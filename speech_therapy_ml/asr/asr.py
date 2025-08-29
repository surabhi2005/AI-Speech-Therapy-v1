"""
speech_therapy_ml/asr/asr.py

ASRModel:
  - Singleton wrapper for faster-whisper
  - .transcribe_numpy(np.int16 or float32, sr) -> (text, segments)

VADStreamer:
  - WebRTC VAD-based in-memory utterance segmentation
  - Calls a callback with np.int16 audio for each utterance
"""

from __future__ import annotations
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="ctranslate2")  # silence pkg_resources warning

import os
import sys
import queue
import time
from dataclasses import dataclass
from collections import deque
from typing import Callable, Optional, List, Dict, Tuple

import numpy as np
import sounddevice as sd
import webrtcvad

# Prefer faster-whisper
from faster_whisper import WhisperModel

# ---------- Utilities ----------

def _cuda_available() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False

def _to_float32_mono(audio: np.ndarray) -> np.ndarray:
    """Convert int16/float32 mono to float32 in [-1, 1]."""
    if audio.ndim > 1:
        audio = audio[:, 0]
    if audio.dtype == np.int16:
        return (audio.astype(np.float32) / 32768.0).clip(-1.0, 1.0)
    return audio.astype(np.float32)

def _rms_db(audio_float32: np.ndarray, eps: float = 1e-9) -> float:
    """Root-mean-square in dBFS."""
    if audio_float32.size == 0:
        return -120.0
    rms = np.sqrt(np.mean(np.square(audio_float32)) + eps)
    return 20.0 * np.log10(max(rms, eps))

# ---------- ASR Model (singleton) ----------

@dataclass
class ASRConfig:
    model_size: str = "small"          # tiny/base/small/medium
    language: str = "en"
    device: Optional[str] = None       # "cpu"|"cuda"|None -> auto
    compute_type_cpu: str = "int8"     # int8 is fast on CPU
    compute_type_cuda: str = "int8_float16"  # good perf on consumer GPUs
    beam_size: int = 5
    vad_filter: bool = False           # we do VAD ourselves

class ASRModel:
    """Faster-Whisper wrapper with a clean return contract."""
    def __init__(self, cfg: ASRConfig = ASRConfig()):
        d = cfg.device or ("cuda" if _cuda_available() else "cpu")
        compute_type = cfg.compute_type_cuda if d == "cuda" else cfg.compute_type_cpu
        print(f"[ASR] Loading faster-whisper '{cfg.model_size}' on {d} (compute_type={compute_type}) ...")
        self.cfg = cfg
        self.model = WhisperModel(cfg.model_size, device=d, compute_type=compute_type)

    def transcribe_numpy(self, audio: np.ndarray, sample_rate: int) -> Tuple[str, List[Dict]]:
        """
        Transcribe in-memory audio.
        Returns (text, segments[{start, end, text}])
        """
        x = _to_float32_mono(audio)
        # faster-whisper accepts NumPy arrays as input in recent versions; if your local version misbehaves,
        # replace this with a small WAV write-and-read fallback.
        segments, info = self.model.transcribe(
            x,
            beam_size=self.cfg.beam_size,
            language=self.cfg.language,
            vad_filter=self.cfg.vad_filter,
        )
        segs = [{"start": float(s.start), "end": float(s.end), "text": s.text.strip()} for s in segments]
        text = " ".join(s["text"] for s in segs).strip()
        return text, segs

# Singleton accessor
__ASR_SINGLETON: Optional[ASRModel] = None
def get_asr() -> ASRModel:
    global __ASR_SINGLETON
    if __ASR_SINGLETON is None:
        __ASR_SINGLETON = ASRModel()
    return __ASR_SINGLETON

# ---------- VAD Streamer (in-memory) ----------

@dataclass
class VADConfig:
    sample_rate: int = 16000                 # VAD supports 8/16/32/48k; we pick 16k
    frame_ms: int = 30                       # must be 10/20/30ms for WebRTC VAD
    aggressiveness: int = 2                  # 0..3 (higher = more aggressive)
    pre_roll_ms: int = 300                   # audio kept before trigger
    max_utterance_s: float = 6.0             # safety cap for utterance length
    end_silence_ms: int = 600                # silence to consider utterance end
    min_utterance_ms: int = 300              # drop micro-blips < 300ms
    min_rms_db: float = -45.0                # drop ultra-low energy
    normalize_peak: bool = False             # simple peak normalization

class VADStreamer:
    """
    Produces utterance-level numpy int16 audio via WebRTC VAD.
    Call .start(on_utterance=callback). Ctrl+C to stop.
    """
    def __init__(self, cfg: VADConfig = VADConfig(), input_device: Optional[int | str] = None):
        assert cfg.frame_ms in (10, 20, 30), "frame_ms must be 10/20/30 for WebRTC VAD"
        self.cfg = cfg
        self.input_device = input_device
        self.vad = webrtcvad.Vad(cfg.aggressiveness)
        self._stop = False

    def _normalize(self, audio: np.ndarray) -> np.ndarray:
        if not self.cfg.normalize_peak or audio.size == 0:
            return audio
        peak = np.max(np.abs(audio.astype(np.int32)))
        if peak < 1:
            return audio
        target = 30000  # keep headroom
        gain = target / float(peak)
        out = np.clip(audio.astype(np.float32) * gain, -32768, 32767).astype(np.int16)
        return out

    def start(self, on_utterance: Callable[[np.ndarray], None]):
        print("[ASR] VAD streaming started. Press Ctrl+C to stop.")
        sr = self.cfg.sample_rate
        frame_len = int(sr * self.cfg.frame_ms / 1000)  # samples per frame (mono)
        end_silence_frames = int(self.cfg.end_silence_ms / self.cfg.frame_ms)
        max_frames = int(self.cfg.max_utterance_s * 1000 / self.cfg.frame_ms)
        min_frames = max(1, int(self.cfg.min_utterance_ms / self.cfg.frame_ms))

        ring = deque(maxlen=int(self.cfg.pre_roll_ms / self.cfg.frame_ms))
        triggered = False
        voiced_frames: List[np.ndarray] = []
        silence_count = 0

        q: "queue.Queue[np.ndarray]" = queue.Queue()

        def sd_callback(indata, frames, time_info, status):
            if status:
                print("[InputStream]:", status, file=sys.stderr)
            q.put(indata.copy())

        with sd.InputStream(
            samplerate=sr,
            blocksize=frame_len,
            dtype="int16",
            channels=1,
            callback=sd_callback,
            device=self.input_device,
        ):
            try:
                while not self._stop:
                    frame = q.get()
                    if frame is None:
                        continue
                    frame = frame.squeeze().astype(np.int16)
                    is_speech = self.vad.is_speech(frame.tobytes(), sr)

                    if not triggered:
                        ring.append(frame)
                        # trigger when >60% of ring frames are voiced
                        if len(ring) == ring.maxlen:
                            voiced = sum(1 for f in ring if self.vad.is_speech(f.tobytes(), sr))
                            if voiced > 0.6 * len(ring):
                                triggered = True
                                voiced_frames = list(ring)
                                silence_count = 0
                                ring.clear()
                    else:
                        voiced_frames.append(frame)
                        if is_speech:
                            silence_count = 0
                        else:
                            silence_count += 1

                        if silence_count > end_silence_frames or len(voiced_frames) >= max_frames:
                            # finalize utterance
                            utt = np.concatenate(voiced_frames, axis=0).astype(np.int16)
                            utt = self._normalize(utt)
                            # basic gating
                            f32 = _to_float32_mono(utt)
                            if len(voiced_frames) >= min_frames and _rms_db(f32) >= self.cfg.min_rms_db:
                                on_utterance(utt)
                            # reset
                            triggered = False
                            voiced_frames = []
                            silence_count = 0
            except KeyboardInterrupt:
                print("[ASR] VAD streaming stopped by user.")
            finally:
                self._stop = True

    def stop(self):
        self._stop = True