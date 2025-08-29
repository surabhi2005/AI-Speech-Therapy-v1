"""
WhisperX aligner wrapper.

Usage:
  aligner = WhisperXAligner(device="cpu")
  aligned_result = aligner.align_segments(asr_segments, audio_np, sample_rate, language="en")
  # aligned_result is the whisperx result dict containing 'segments' each with 'words': [{'text','start','end','confidence'}]
"""

import os
import numpy as np
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

try:
    import whisperx
except Exception as e:
    raise ImportError("whisperx is required for alignment. Install `pip install whisperx`. Error: " + str(e))

import torch

class WhisperXAligner:
    def __init__(self, device: str | None = None):
        """
        device: "cuda" or "cpu" or None -> auto
        """
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self._align_model = None
        self._metadata = None
        # cache the align model per language
        self._loaded_lang = None

    def _ensure_align_model(self, language: str = "en"):
        if self._align_model is not None and self._loaded_lang == language:
            return
        # load alignment model for language. whisperx will pick a suitable model (wav2vec2-based).
        self._align_model, self._metadata = whisperx.load_align_model(language_code=language, device=self.device)
        self._loaded_lang = language

    @staticmethod
    def _ensure_float32(audio: np.ndarray, sr: int, target_sr: int = 16000) -> np.ndarray:
        """WhisperX expects float32 waveform, shape (n,) normalized to [-1,1]. If sampling rate mismatch, resample using librosa if installed."""
        import numpy as np
        audio = np.asarray(audio)
        if audio.dtype == np.int16:
            audio = (audio.astype(np.float32) / 32768.0).astype(np.float32)
        elif audio.dtype == np.float32:
            audio = audio.astype(np.float32)
        else:
            audio = audio.astype(np.float32)

        # resample if needed
        if sr != target_sr:
            try:
                import librosa
            except Exception:
                raise RuntimeError(f"Audio sample rate {sr} != {target_sr}. Please install librosa to resample or provide 16k audio.")
            audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
        return audio

    def align_segments(self,
                       asr_segments: list,
                       audio_np: np.ndarray,
                       sample_rate: int,
                       language: str = "en",
                       return_char_alignments: bool = False) -> dict:
        """
        Parameters:
          - asr_segments: list of dicts with at least keys: {'start', 'end', 'text'} (your ASR segments)
          - audio_np: np.ndarray int16 or float32 mono waveform
          - sample_rate: sample rate of audio_np (e.g., 16000)
          - language: language code for alignment model
        Returns:
          - whisperx-style result dict after alignment (contains 'segments' with 'words' list)
        """
        self._ensure_align_model(language=language)
        # ensure float32 16k mono
        audio = self._ensure_float32(audio_np, sr=sample_rate, target_sr=self._metadata.get("sample_rate", 16000) if isinstance(self._metadata, dict) and self._metadata.get("sample_rate") else 16000)

        device = self.device
        # whisperx.align expects segments in whisperx output format. The minimal required keys are 'start','end','text'.
        # Pass through asr_segments directly but ensure snake_case keys
        segments = []
        for s in asr_segments:
            st = {"start": float(s.get("start", 0.0)), "end": float(s.get("end", 0.0)), "text": str(s.get("text", "")).strip()}
            segments.append(st)

        # Run alignment
        aligned = whisperx.align(segments, self._align_model, self._metadata, audio, device, return_char_alignments=return_char_alignments)
        # aligned is a dict with "segments" key replaced by aligned segments (each segment contains "words")
        return aligned
