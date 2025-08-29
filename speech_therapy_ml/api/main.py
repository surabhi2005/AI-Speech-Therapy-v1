# speech_therapy_ml/api/main.py
import os
import tempfile
import base64
import json
import asyncio
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import soundfile as sf
import numpy as np

# Import your modules (assumes speech_therapy_ml is the working package)
from asr import get_asr, VADConfig, VADStreamer  # your asr package
from scoring.aligner import WhisperXAligner
from scoring.scorer import Scorer
from scoring.feedback import FeedbackGenerator
from scoring.azure_tts import AzureTTS

app = FastAPI(title="SpeechTherapy ML API")

# CORS for frontend dev (adjust origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend origin for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Globals initialized at startup
ASR = None
ALIGNER = None
SCORER = None
FEEDBACK_GEN = None
AZURE_TTS = None

@app.on_event("startup")
def startup_event():
    global ASR, ALIGNER, SCORER, FEEDBACK_GEN, AZURE_TTS
    print("[api] Warm starting models...")
    # Load the heavy model once (singleton)
    ASR = get_asr()  # uses your singleton; this loads faster-whisper
    ALIGNER = WhisperXAligner(device=None)
    try:
        AZURE_TTS = AzureTTS()
    except Exception as e:
        print("[api] AzureTTS not configured:", e)
        AZURE_TTS = None
    SCORER = Scorer(azure_tts=AZURE_TTS, sample_rate=16000)
    try:
        FEEDBACK_GEN = FeedbackGenerator(azure_tts=AZURE_TTS)
    except Exception as e:
        print("[api] FeedbackGenerator not configured (Azure OpenAI may be missing):", e)
        FEEDBACK_GEN = None
    print("[api] Startup complete.")

# Pydantic model for /feedback POST
class FeedbackRequest(BaseModel):
    scoring_result: dict
    age: Optional[str] = "adult"

async def _save_upload_to_tempfile(upload: UploadFile) -> str:
    """Save UploadFile to a temp file and return path."""
    suffix = os.path.splitext(upload.filename)[1] if upload.filename else ".wav"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    content = await upload.read()
    tmp.write(content)
    tmp.close()
    return tmp.name

def _load_audio_for_numpy(path: str):
    """Return (audio_np, sr) where audio_np is numpy array (float32 or int16)."""
    data, sr = sf.read(path, dtype='float32', always_2d=False)
    # ensure shape (n,) mono
    if data.ndim > 1:
        data = data[:, 0]
    return data, sr

# ---- Endpoints ----

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Simple transcribe endpoint: returns text and segments.
    Accepts multipart/form-data with key 'audio' (wav file).
    """
    if ASR is None:
        raise HTTPException(status_code=503, detail="ASR model not loaded yet")

    tmp_path = await _save_upload_to_tempfile(audio)
    try:
        audio_np, sr = _load_audio_for_numpy(tmp_path)
        # run blocking ASR in thread
        text, segments = await asyncio.to_thread(ASR.transcribe_numpy, audio_np, sr)
        return {"text": text, "segments": segments}
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

@app.post("/score")
async def score(expected: str = Form(...), audio: UploadFile = File(...)):
    """
    Score an audio recording against `expected` sentence.
    Returns the full scoring JSON.
    Usage: multipart/form-data keys: expected (string), audio (file .wav)
    """
    if any(x is None for x in (ASR, ALIGNER, SCORER)):
        raise HTTPException(status_code=503, detail="Models not ready")

    tmp_path = await _save_upload_to_tempfile(audio)
    try:
        audio_np, sr = _load_audio_for_numpy(tmp_path)  # float32 in [-1..1]
        # 1) ASR
        asr_text, asr_segments = await asyncio.to_thread(ASR.transcribe_numpy, audio_np, sr)
        # 2) Align
        aligned = await asyncio.to_thread(ALIGNER.align_segments, asr_segments, audio_np, sr, "en")
        # 3) Score
        result = await asyncio.to_thread(SCORER.score_utterance, expected, aligned, audio_np, sr, asr_text, False)
        # include asr_text metadata
        result["_meta"] = {"asr_text": asr_text}
        return result
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

@app.post("/feedback")
async def feedback(req: FeedbackRequest):
    """
    Generate human feedback text and return TTS as base64 WAV (if AzureTTS configured).
    Body JSON:
      { "scoring_result": {...}, "age": "kid"|"teen"|"adult" }
    Returns:
      { "text": "...", "audio_base64": "..." | null }
    """
    scoring_result = req.scoring_result
    age = req.age or "adult"

    # Generate text (blocking) in thread
    if FEEDBACK_GEN is None:
        # fallback: locally create a short text using SCORER.summary
        text = FEEDBACK_GEN._fallback_text(scoring_result, age_group=age) if FEEDBACK_GEN else "Good job! (feedback generator unavailable.)"
    else:
        text = await asyncio.to_thread(FEEDBACK_GEN.generate_feedback_text, scoring_result, age)

    audio_b64 = None
    if AZURE_TTS is not None:
        try:
            wav_bytes = await asyncio.to_thread(AZURE_TTS.synthesize_to_wav_bytes, text)
            audio_b64 = base64.b64encode(wav_bytes).decode("ascii")
        except Exception as e:
            print("[api] AzureTTS synthesis failed:", e)
            audio_b64 = None

    return {"text": text, "audio_base64": audio_b64}

@app.get("/")
async def root():
    return {"status": "ok", "note": "SpeechTherapy ML API"}

