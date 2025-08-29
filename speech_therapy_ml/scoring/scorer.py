"""
Scorer: converts aligned result (whisperx) + expected text into per-word scores and a session summary.

Stage 3.2: hardened prosody extraction and reliability checks.
"""

import numpy as np
import math
import tempfile
import os
import json
from typing import List, Dict, Any, Optional

# libs used
try:
    import pronouncing
except Exception:
    pronouncing = None

try:
    import soundfile as sf
    import librosa
except Exception as e:
    raise ImportError("scorer requires 'soundfile' and 'librosa'. Install them (pip install soundfile librosa). Error: " + str(e))

from difflib import SequenceMatcher
from .azure_tts import AzureTTS

# ---------- Text utilities ----------
def normalize_text(s: str) -> str:
    return "".join(c.lower() if c.isalnum() or c.isspace() else " " for c in s).strip()

def tokens_from_text(s: str) -> List[str]:
    return [t for t in normalize_text(s).split() if t]

# ---------- Word flattening with robust key handling ----------
def _extract_text_from_word_dict(w: Dict) -> str:
    if not isinstance(w, dict):
        return ""
    for k in ("text", "word", "aligned_word", "alignedText", "aligned_text", "word_text"):
        v = w.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    if "token" in w and isinstance(w["token"], str) and w["token"].strip():
        return w["token"].strip()
    return ""

def flatten_whisperx_words(aligned_result: Dict, asr_hypothesis: Optional[str] = None) -> List[Dict]:
    words: List[Dict] = []
    for seg in aligned_result.get("segments", []):
        for w in seg.get("words", []):
            txt = _extract_text_from_word_dict(w)
            start = w.get("start", w.get("start_time", w.get("s", 0.0)))
            end = w.get("end", w.get("end_time", w.get("e", 0.0)))
            conf = w.get("confidence", w.get("probability", w.get("score", None)))
            words.append({
                "word": txt,
                "start": float(start) if start is not None else 0.0,
                "end": float(end) if end is not None else 0.0,
                "confidence": float(conf) if conf is not None else None
            })

    num_empty = sum(1 for w in words if not w["word"])
    if num_empty > 0 and asr_hypothesis:
        asr_tokens = tokens_from_text(asr_hypothesis)
        if len(asr_tokens) == len(words) and len(words) > 0:
            for i in range(len(words)):
                if not words[i]["word"]:
                    words[i]["word"] = asr_tokens[i]
        else:
            idx = 0
            existing_words = [normalize_text(w["word"]) for w in words if w["word"]]
            remaining_tokens = [t for t in asr_tokens if t not in existing_words]
            for i in range(len(words)):
                if words[i]["word"]:
                    continue
                if idx < len(remaining_tokens):
                    words[i]["word"] = remaining_tokens[idx]
                    idx += 1
            for i in range(len(words)):
                if not words[i]["word"]:
                    words[i]["word"] = "<unk>"
    else:
        for i in range(len(words)):
            if not words[i]["word"]:
                words[i]["word"] = "<unk>"

    return words

# ---------- Simple alignment (string-level) ----------
def simple_word_alignment(expected_tokens: List[str], actual_tokens: List[str]) -> List[Dict]:
    sm = SequenceMatcher(a=expected_tokens, b=actual_tokens)
    out = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for ai, bi in zip(range(i1, i2), range(j1, j2)):
                out.append({"expected_idx": ai, "expected": expected_tokens[ai], "actual_idx": bi, "actual": actual_tokens[bi], "op": "equal"})
        elif tag == "replace":
            la = i2 - i1
            lb = j2 - j1
            m = min(la, lb)
            for k in range(m):
                out.append({"expected_idx": i1 + k, "expected": expected_tokens[i1 + k], "actual_idx": j1 + k, "actual": actual_tokens[j1 + k], "op": "replace"})
            if la > m:
                for k in range(m, la):
                    out.append({"expected_idx": i1 + k, "expected": expected_tokens[i1 + k], "actual_idx": None, "actual": None, "op": "delete"})
            if lb > m:
                for k in range(m, lb):
                    out.append({"expected_idx": None, "expected": None, "actual_idx": j1 + k, "actual": actual_tokens[j1 + k], "op": "insert"})
        elif tag == "delete":
            for ai in range(i1, i2):
                out.append({"expected_idx": ai, "expected": expected_tokens[ai], "actual_idx": None, "actual": None, "op": "delete"})
        elif tag == "insert":
            for bi in range(j1, j2):
                out.append({"expected_idx": None, "expected": None, "actual_idx": bi, "actual": actual_tokens[bi], "op": "insert"})
    return out

# ---------- Acoustic utilities ----------
def compute_mfcc(y: np.ndarray, sr: int, n_mfcc: int = 13) -> np.ndarray:
    if y.dtype != np.float32 and y.dtype != np.float64:
        y = y.astype(np.float32)
    if np.all(np.abs(y) < 1e-7):
        return np.zeros((n_mfcc, 1), dtype=np.float32)
    mf = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    return mf

def dtw_distance(mfcc_ref: np.ndarray, mfcc_test: np.ndarray) -> float:
    D, wp = librosa.sequence.dtw(X=mfcc_ref, Y=mfcc_test, metric="euclidean")
    cost = float(D[-1, -1])
    path_len = len(wp) if wp is not None else (mfcc_ref.shape[1] + mfcc_test.shape[1]) / 2.0
    if path_len <= 0:
        return cost
    return cost / float(path_len)

# ---------- Prosody helpers ----------
def _to_float_audio(audio: np.ndarray) -> np.ndarray:
    a = np.asarray(audio)
    if a.dtype == np.int16:
        f = (a.astype(np.float32) / 32768.0).astype(np.float32)
    else:
        f = a.astype(np.float32)
    if f.ndim > 1:
        f = f[:, 0]
    return f

def _safe_pyin(y: np.ndarray, sr: int, fmin_hz: float = None, fmax_hz: float = None, frame_length: int = 2048, hop_length: int = 256):
    if fmin_hz is None:
        fmin_hz = librosa.note_to_hz('C2')
    if fmax_hz is None:
        fmax_hz = librosa.note_to_hz('C6')
    try:
        f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=fmin_hz, fmax=fmax_hz, sr=sr, frame_length=frame_length, hop_length=hop_length)
        times = librosa.times_like(f0, sr=sr, hop_length=hop_length)
        voiced_count = np.sum(~np.isnan(f0))
        if voiced_count < 3 or (voiced_count / max(1, len(f0))) < 0.02:
            f0_yin = librosa.yin(y, fmin=max(40, fmin_hz), fmax=min(600, fmax_hz), sr=sr, frame_length=frame_length, hop_length=hop_length)
            times = librosa.times_like(f0_yin, sr=sr, hop_length=hop_length)
            voiced_flag = ~np.isnan(f0_yin)
            return f0_yin, voiced_flag.astype(bool), None, times
        return f0, (~np.isnan(f0)).astype(bool), voiced_probs, times
    except Exception:
        try:
            f0_yin = librosa.yin(y, fmin=80.0, fmax=400.0, sr=sr, frame_length=frame_length, hop_length=hop_length)
            times = librosa.times_like(f0_yin, sr=sr, hop_length=hop_length)
            voiced_flag = ~np.isnan(f0_yin)
            return f0_yin, voiced_flag.astype(bool), None, times
        except Exception:
            return np.zeros(1, dtype=np.float32), np.array([False]), None, np.array([0.0])

def _smooth_array(arr: np.ndarray, window: int = 3) -> np.ndarray:
    if arr is None or arr.size == 0:
        return arr
    if window <= 1 or arr.size < window:
        return arr
    kernel = np.ones(window, dtype=np.float32) / float(window)
    return np.convolve(arr, kernel, mode='same')

# ---------- Main Scorer ----------
class Scorer:
    def __init__(self, azure_tts: AzureTTS | None = None, sample_rate: int = 16000):
        self.azure_tts = azure_tts
        self.sample_rate = sample_rate

    def score_utterance(self,
                       expected_text: str,
                       aligned_result: dict,
                       audio_np: np.ndarray,
                       audio_sr: int,
                       asr_hypothesis: Optional[str] = None,
                       debug: bool = False) -> dict:

        words = flatten_whisperx_words(aligned_result, asr_hypothesis)
        actual_tokens = [normalize_text(w["word"]) for w in words]
        expected_tokens = tokens_from_text(expected_text)
        mapping = simple_word_alignment(expected_tokens, actual_tokens)

        actual_word_times = {i: {"word": words[i]["word"], "start": words[i]["start"], "end": words[i]["end"], "confidence": words[i]["confidence"]} for i in range(len(words))}

        # ----- Prosody: compute utterance-level contours (F0 + energy) -----
        y = _to_float_audio(audio_np)
        frame_length = 2048
        hop_length = 256

        # constants (tuning knobs)
        MIN_FRAMES = 1
        MIN_VOICED_RATIO = 0.05
        LOW_ENERGY_DB_FOR_VOICED = -50.0
        MIN_F0 = 40.0
        MAX_F0 = 600.0
        MAX_F0_STD = 200.0
        MAX_OUTLIER_PROP = 0.6
        VERY_LOW_ENERGY_DB = -85.0

        f0_raw, voiced_flag, voiced_probs, times = _safe_pyin(y, sr=audio_sr, frame_length=frame_length, hop_length=hop_length)
        f0_raw = np.asarray(f0_raw, dtype=np.float32)
        times = np.asarray(times, dtype=np.float32)

        # fill NaNs by linear interpolation (if possible)
        if f0_raw.size == 0:
            f0_filled = np.array([], dtype=np.float32)
        else:
            x = np.arange(len(f0_raw))
            valid = np.isfinite(f0_raw)
            if valid.sum() == 0:
                # fallback to yin numeric (should be handled by _safe_pyin)
                f0_filled = np.nan_to_num(f0_raw, nan=0.0)
            else:
                if valid.sum() < len(f0_raw):
                    f0_interp = f0_raw.copy()
                    f0_interp[~valid] = np.interp(x[~valid], x[valid], f0_raw[valid])
                    f0_filled = f0_interp
                else:
                    f0_filled = f0_raw.copy()

        # smoothing (light)
        f0_smoothed = _smooth_array(f0_filled, window=3) if f0_filled.size > 0 else f0_filled

        # compute energy (RMS -> dB) and smooth lightly
        try:
            rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
            if len(rms) != len(times):
                minlen = min(len(rms), len(times))
                rms = rms[:minlen]
                f0_smoothed = f0_smoothed[:minlen]
                times = times[:minlen]
            energy_db = 20.0 * np.log10(rms + 1e-9)
        except Exception:
            energy_db = np.zeros(len(times), dtype=np.float32) - 120.0

        energy_db_smoothed = _smooth_array(energy_db, window=3) if energy_db.size > 0 else energy_db

        # per-word prosody computation (robust + reliability checks)
        word_prosody = []
        for w in words:
            start = w.get("start", None)
            end = w.get("end", None)
            if start is None or end is None:
                word_prosody.append({
                    "f0_mean_hz": None,
                    "f0_std_hz": None,
                    "energy_db_mean": None,
                    "voiced_ratio": None,
                    "prosody_reliable": None,
                    "stress_score": None,
                    "_unreliable_reasons": []
                })
                continue

            if times.size == 0:
                # fallback global stats
                f0_mean = float(np.nanmean(f0_smoothed)) if f0_smoothed.size > 0 else 0.0
                f0_std = float(np.nanstd(f0_smoothed)) if f0_smoothed.size > 0 else 0.0
                energy_mean = float(np.mean(energy_db_smoothed)) if energy_db_smoothed.size > 0 else -120.0
                voiced_ratio = float(np.mean(voiced_flag)) if voiced_flag is not None else 0.0
                frames_count = max(1, f0_smoothed.size)
                f0_vals_voiced = f0_raw[np.isfinite(f0_raw)] if f0_raw.size > 0 else np.array([])
            else:
                s_idx = int(np.searchsorted(times, start, side='left'))
                e_idx = int(np.searchsorted(times, end, side='right'))
                if e_idx <= s_idx:
                    s_idx = max(0, s_idx - 1)
                    e_idx = min(len(times), s_idx + 1)
                frames_count = max(1, e_idx - s_idx)
                f0_slice_raw = f0_raw[s_idx:e_idx] if f0_raw.size > 0 else np.array([])
                f0_slice_smoothed = f0_smoothed[s_idx:e_idx] if f0_smoothed.size > 0 else np.array([])
                energy_slice = energy_db_smoothed[s_idx:e_idx] if energy_db_smoothed.size > 0 else np.array([])
                # voiced ratio using raw un-interpolated detection (if available)
                if f0_slice_raw.size > 0:
                    voiced_ratio = float(np.sum(np.isfinite(f0_slice_raw)) / float(max(1, f0_slice_raw.size)))
                else:
                    voiced_ratio = 0.0

                # voiced f0 values (raw)
                f0_vals_voiced = f0_slice_raw[np.isfinite(f0_slice_raw)] if f0_slice_raw.size > 0 else np.array([])

                # compute f0 stats:
                if f0_vals_voiced.size > 0:
                    f0_mean = float(np.mean(f0_vals_voiced))
                    f0_std = float(np.std(f0_vals_voiced))
                elif f0_slice_smoothed.size > 0:
                    # no voiced raw frames: use smoothed interpolation as fallback
                    f0_mean = float(np.mean(f0_slice_smoothed))
                    f0_std = float(np.std(f0_slice_smoothed))
                else:
                    f0_mean = 0.0
                    f0_std = 0.0

                energy_mean = float(np.mean(energy_slice)) if energy_slice.size > 0 else float(np.mean(energy_db_smoothed) if energy_db_smoothed.size > 0 else -120.0)

            # safe numeric defaults
            if not np.isfinite(f0_mean):
                f0_mean = 0.0
            if not np.isfinite(f0_std):
                f0_std = 0.0
            if not np.isfinite(energy_mean):
                energy_mean = -120.0
            if not np.isfinite(voiced_ratio):
                voiced_ratio = 0.0

            # outlier proportion: voiced frames outside plausible bounds
            outlier_prop = 0.0
            if f0_vals_voiced.size > 0:
                outlier_prop = float(np.sum((f0_vals_voiced < MIN_F0) | (f0_vals_voiced > MAX_F0)) / float(f0_vals_voiced.size))

            # Decision rules: collect reasons for unreliability, mark False only if clear problem(s)
            reasons = []
            if frames_count < MIN_FRAMES:
                reasons.append("few_frames")
            # if little voicing and very low energy => unreliable
            if voiced_ratio < MIN_VOICED_RATIO and energy_mean < LOW_ENERGY_DB_FOR_VOICED:
                reasons.append("low_voicing_low_energy")
            # extremes
            if (f0_mean < (MIN_F0 - 10)) or (f0_mean > (MAX_F0 + 100)):
                reasons.append("f0_out_of_range")
            if f0_std > MAX_F0_STD:
                reasons.append("high_f0_variability")
            if outlier_prop > MAX_OUTLIER_PROP:
                reasons.append("many_outliers")
            if energy_mean < VERY_LOW_ENERGY_DB:
                reasons.append("very_low_energy")

            # prosody reliable only if no reasons
            prosody_reliable = True if len(reasons) == 0 else False

            # create stress score: energy normalized within utterance (nudge small zeros)
            # We'll fill stress later; put placeholder for now
            word_prosody.append({
                "f0_mean_hz": round(f0_mean, 1),
                "f0_std_hz": round(f0_std, 1),
                "energy_db_mean": round(energy_mean, 3),
                "voiced_ratio": round(voiced_ratio, 3),
                "prosody_reliable": prosody_reliable,
                "stress_score": None,
                "_unreliable_reasons": reasons
            })

        # compute stress normalization across words (energy-based)
        energy_vals = [wp["energy_db_mean"] for wp in word_prosody if wp["energy_db_mean"] is not None]
        if len(energy_vals) == 0:
            energy_min = -120.0
            energy_max = -120.0
        else:
            energy_min = float(min(energy_vals))
            energy_max = float(max(energy_vals))

        energy_range = energy_max - energy_min if (energy_max - energy_min) > 1e-6 else 1.0

        # fill stress_score per word; nudge exact zeros upward slightly to avoid suspicious 0.0
        for wp in word_prosody:
            if wp["energy_db_mean"] is None:
                wp["stress_score"] = None
            else:
                stress_norm = (wp["energy_db_mean"] - energy_min) / energy_range
                stress_norm = float(max(0.0, min(1.0, stress_norm)))
                if stress_norm == 0.0:
                    stress_norm = 0.02
                wp["stress_score"] = round(stress_norm, 3)

        # ---------- Now original scoring pipeline (word-level acoustic + DTW) ----------
        per_word = []
        for entry in mapping:
            rec = {
                "op": entry["op"],
                "expected_idx": entry["expected_idx"],
                "expected": entry["expected"],
                "actual_idx": entry["actual_idx"],
                "actual": entry["actual"],
                "word_confidence": None,
                "start": None,
                "end": None,
                "word_score": None,
                "phonemes": None,
                "acoustic_score": None,
                "notes": []
            }
            if entry["actual_idx"] is not None:
                ai = entry["actual_idx"]
                info = actual_word_times.get(ai)
                if info:
                    rec["start"] = float(info["start"])
                    rec["end"] = float(info["end"])
                    rec["word_confidence"] = float(info["confidence"]) if info.get("confidence") is not None else None
                    rec["actual"] = info["word"]

            if entry["op"] == "equal":
                rec["word_score"] = 1.0
            elif entry["op"] in ("insert", "delete"):
                rec["word_score"] = 0.0
            else:  # replace
                rec["word_score"] = rec["word_confidence"] if rec["word_confidence"] is not None else 0.4

            if rec["expected"] and pronouncing is not None:
                phones = pronouncing.phones_for_word(rec["expected"])
                rec["phonemes"] = phones[0] if phones else None

            # Acoustic check: disabled for speed
            if rec["start"] is not None and rec["end"] is not None and self.azure_tts is not None:
                # Acoustic scoring skipped for speed: TTS reference synthesis is too slow.
                # Instead, rely on ASR confidence + prosody for per-word scoring.
                rec["acoustic_score"] = None
                # word_score stays as set by alignment/ASR confidence.
            
            # attach prosody for this actual word if computed
            if entry["actual_idx"] is not None:
                ai = entry["actual_idx"]
                if ai < len(word_prosody):
                    rec_pros = word_prosody[ai]
                    rec["prosody"] = {
                        "f0_mean_hz": rec_pros["f0_mean_hz"],
                        "f0_std_hz": rec_pros["f0_std_hz"],
                        "energy_db_mean": rec_pros["energy_db_mean"],
                        "voiced_ratio": rec_pros["voiced_ratio"],
                        "stress_score": rec_pros["stress_score"],
                        "prosody_reliable": rec_pros["prosody_reliable"]
                    }
                    # if unreliable, append reason to notes (keeps API shape)
                    if rec_pros.get("_unreliable_reasons"):
                        rec["notes"].append("prosody_unreliable:" + ",".join(rec_pros["_unreliable_reasons"]))
                else:
                    rec["prosody"] = {
                        "f0_mean_hz": None,
                        "f0_std_hz": None,
                        "energy_db_mean": None,
                        "voiced_ratio": None,
                        "stress_score": None,
                        "prosody_reliable": None
                    }
            else:
                rec["prosody"] = {
                    "f0_mean_hz": None,
                    "f0_std_hz": None,
                    "energy_db_mean": None,
                    "voiced_ratio": None,
                    "stress_score": None,
                    "prosody_reliable": None
                }

            per_word.append(rec)

        total_expected = len(expected_tokens)
        correct = sum(1 for r in per_word if r["op"] == "equal")
        word_acc = float(correct) / total_expected if total_expected > 0 else 0.0

        flat_words = words
        if flat_words:
            utt_start = flat_words[0]["start"]
            utt_end = flat_words[-1]["end"]
            duration_s = max(0.001, utt_end - utt_start)
            num_words = len(flat_words)
            wpm = (num_words / duration_s) * 60.0
            pauses = []
            for i in range(1, len(flat_words)):
                p = max(0.0, flat_words[i]["start"] - flat_words[i - 1]["end"])
                pauses.append(p)
            avg_pause = float(np.mean(pauses)) if pauses else 0.0
        else:
            duration_s = 0.0
            wpm = 0.0
            avg_pause = 0.0

        # summary prosody aggregation: prefer reliable words when available
        f0_means_all = [wp["f0_mean_hz"] for wp in word_prosody if wp["f0_mean_hz"] is not None]
        energy_means_all = [wp["energy_db_mean"] for wp in word_prosody if wp["energy_db_mean"] is not None]
        reliable_words = [wp for wp in word_prosody if wp.get("prosody_reliable")]
        f0_means_rel = [wp["f0_mean_hz"] for wp in reliable_words if wp["f0_mean_hz"] is not None]
        energy_means_rel = [wp["energy_db_mean"] for wp in reliable_words if wp["energy_db_mean"] is not None]

        use_f0 = f0_means_rel if len(f0_means_rel) > 0 else f0_means_all
        use_energy = energy_means_rel if len(energy_means_rel) > 0 else energy_means_all

        prosody_coverage = float(len([p for p in word_prosody if p["prosody_reliable"]]) / max(1, len(word_prosody)))

        avg_f0 = float(np.mean(use_f0)) if len(use_f0) > 0 else 0.0
        std_f0 = float(np.std(use_f0)) if len(use_f0) > 0 else 0.0
        avg_energy = float(np.mean(use_energy)) if len(use_energy) > 0 else -120.0

        summary = {
            "expected_words": total_expected,
            "correct_words": correct,
            "word_accuracy": round(word_acc, 3),
            "wpm": round(wpm, 1),
            "avg_pause_s": round(avg_pause, 3),
            "utterance_duration_s": round(duration_s, 3),
            "prosody": {
                "avg_f0_hz": round(avg_f0, 1),
                "f0_std_hz_over_words": round(std_f0, 1),
                "avg_energy_db": round(avg_energy, 3),
                "prosody_coverage": round(prosody_coverage, 3)
            }
        }

        out = {
            "expected_text": expected_text,
            "actual_text": " ".join([w["word"] for w in flat_words]).strip(),
            "per_word": per_word,
            "summary": summary
        }
        if debug:
            out["_debug_segments_preview"] = aligned_result.get("segments", [])[:4]
            out["_debug_prosody_words"] = word_prosody[:8]
        return out
