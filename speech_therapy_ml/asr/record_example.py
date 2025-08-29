"""
CLI smoke tests for the hardened ASR foundation.

Examples:
  python asr/record_example.py --mode batch --duration 4
  python asr/record_example.py --mode vad
  python asr/record_example.py --list-devices
  python asr/record_example.py --mode vad --input-device 1
  python asr/record_example.py --mode batch --duration 3 --out test.wav
"""
import argparse
import sounddevice as sd
import numpy as np
import soundfile as sf

from asr import get_asr, VADStreamer, VADConfig

def list_devices():
    print(sd.query_devices())


def record_batch(duration_s: int = 4, sample_rate: int = 16000, out_file: str = None):
    print(f"[ASR] Recording {duration_s}s ...")
    audio = sd.rec(
        int(duration_s * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype="int16"
    )
    sd.wait()

    # Optional save
    if out_file:
        sf.write(out_file, audio, sample_rate)
        print(f"[ASR] Saved recording to {out_file}")

    asr = get_asr()
    text, segs = asr.transcribe_numpy(audio.squeeze(), sample_rate)
    if text.strip():
        print("TEXT:", text)
        print("SEGMENTS:", segs)
    else:
        print("TEXT: <empty>")
        print("SEGMENTS:", segs)


def stream_vad(input_device=None):
    asr = get_asr()

    def on_utt(audio_int16: np.ndarray):
        text, segs = asr.transcribe_numpy(audio_int16, sample_rate=16000)
        if not text.strip():
            return
        print("\n[UTTERANCE]")
        print("-> text:", text)
        print("-> segments:", segs)

    cfg = VADConfig(
        sample_rate=16000,
        frame_ms=30,
        aggressiveness=2,
        pre_roll_ms=300,
        max_utterance_s=6.0,
        end_silence_ms=600,
        min_utterance_ms=300,
        min_rms_db=-45.0,
        normalize_peak=False,
    )
    VADStreamer(cfg, input_device=input_device).start(on_utterance=on_utt)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["batch", "vad"], default="vad")
    parser.add_argument("--duration", type=int, default=4)
    parser.add_argument("--list-devices", action="store_true")
    parser.add_argument("--input-device", type=str, default=None, help="Device index or name")
    parser.add_argument("--out", type=str, default=None, help="Optional path to save .wav file")
    args = parser.parse_args()

    if args.list_devices:
        list_devices()
        exit(0)

    if args.mode == "batch":
        record_batch(duration_s=args.duration, out_file=args.out)
    else:
        stream_vad(input_device=args.input_device)
