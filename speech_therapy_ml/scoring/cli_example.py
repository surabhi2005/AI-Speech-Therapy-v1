# scoring/cli_example.py
"""
CLI example showing end-to-end (updated):
  - record short audio
  - ASR (faster-whisper)
  - WhisperX align
  - Scorer (acoustic + prosody)
  - Feedback (Azure OpenAI -> Azure TTS)
"""

import argparse
import numpy as np
import sounddevice as sd
import soundfile as sf
import os
import json

# attempt to import get_asr from either package root or module
try:
    from asr import get_asr
except Exception:
    from asr.asr import get_asr

from scoring.aligner import WhisperXAligner
from scoring.azure_tts import AzureTTS
from scoring.scorer import Scorer

# New feedback module
from scoring.feedback import FeedbackGenerator

def record_audio(duration, sr=16000):
    print(f"[cli_example] Recording {duration}s ...")
    data = sd.rec(int(duration * sr), samplerate=sr, channels=1, dtype="int16")
    sd.wait()
    return data.squeeze()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["batch", "vad"], default="batch")
    parser.add_argument("--duration", type=int, default=4)
    parser.add_argument("--expected", type=str, required=True, help="Expected prompt/sentence user should read")
    parser.add_argument("--out", type=str, default=None)
    parser.add_argument("--debug", action="store_true", help="Show debug info from aligned result")
    parser.add_argument("--no-play", action="store_true", help="Don't play TTS (only print)")
    parser.add_argument("--age", choices=["kid", "teen", "adult"], default="adult", help="Age group for feedback tone")
    args = parser.parse_args()

    if args.mode != "batch":
        raise NotImplementedError("This CLI supports batch mode only. Use VADStreamer for streaming demos.")

    audio_np = record_audio(args.duration, sr=16000)
    if args.out:
        sf.write(args.out, audio_np, 16000)
        print(f"[cli_example] saved recording to {args.out}")

    # 1) ASR
    asr = get_asr()
    asr_text, segments = asr.transcribe_numpy(audio_np, sample_rate=16000)
    print("[ASR] text:", asr_text)
    print("[ASR] segments:", segments)

    # 2) Align (WhisperX)
    aligner = WhisperXAligner(device=None)
    aligned = aligner.align_segments(segments, audio_np, sample_rate=16000, language="en", return_char_alignments=False)
    print("[Aligner] got aligned segments")

    if args.debug:
        print(">>> aligned_result['segments'] (preview):")
        import pprint
        pprint.pprint(aligned.get("segments", [])[:10])

    # 3) Score (pass asr_text as fallback)
    try:
        azure_tts = None
        try:
            azure_tts = AzureTTS()
        except Exception:
            print("[cli_example] Azure TTS not configured; TTS playback will be skipped (feedback will still be generated and printed).")
            azure_tts = None

        scorer = Scorer(azure_tts=azure_tts, sample_rate=16000)
        result = scorer.score_utterance(expected_text=args.expected,
                                       aligned_result=aligned,
                                       audio_np=audio_np,
                                       audio_sr=16000,
                                       asr_hypothesis=asr_text,
                                       debug=args.debug)
        # print(json.dumps(result, indent=2))
    except Exception as e:
        print("[cli_example] Scoring failed:", str(e))
        return

    # 4) Feedback (Azure OpenAI -> AzureTTS), age-aware
    try:
        fb = FeedbackGenerator(azure_tts=azure_tts)
        # play unless user passed --no-play or AzureTTS absent
        play_flag = (not args.no_play) and (azure_tts is not None)
        feedback_text = fb.generate_and_speak(result, play=play_flag, age_group=args.age)
        # feedback_text printed by feedback.speak_text already
    except Exception as e:
        print("[cli_example] Feedback generation failed:", str(e))
        # still exit gracefully

if __name__ == "__main__":
    main()
