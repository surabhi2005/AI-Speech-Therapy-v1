# interactive/session.py
"""
Terminal-first Interactive Speech Trainer.

Run:
  python -m interactive.session --mode guided --duration 4 --age adult

Workflow:
 - Greeting (speak/print)
 - Loop over exercises:
    - Assistant speaks prompt (via AzureTTS if configured)
    - Record user audio for `duration`
    - ASR -> Align -> Score
    - Feedback (AzureOpenAI -> AzureTTS), age-aware
    - Simple curriculum adaptation (repeat if accuracy < threshold)
"""

import argparse
import json
import os
import tempfile
import time
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

# audio I/O
import sounddevice as sd
import soundfile as sf
import numpy as np

# core modules (your existing code)
try:
    from asr import get_asr, VADStreamer, VADConfig
except Exception:
    from asr.asr import get_asr, VADStreamer, VADConfig

from scoring.aligner import WhisperXAligner
from scoring.scorer import Scorer
from scoring.azure_tts import AzureTTS
from scoring.feedback import FeedbackGenerator

from .state import EXERCISES
from .bot import Coach

# small helper
def _play_wav_file(path: str):
    try:
        data, sr = sf.read(path, dtype="float32")
        sd.play(data, sr)
        sd.wait()
    except Exception as e:
        print(f"[session] Playback failed: {e}")

def _escape_xml(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

class InteractiveSession:
    def __init__(self,
                 sample_rate: int = 16000,
                 default_duration: int = 4,
                 repeat_threshold: float = 0.75,
                 max_repeats: int = 2,
                 use_azure_tts: bool = True,
                 default_age: str = "adult"):
        self.sample_rate = sample_rate
        self.default_duration = default_duration
        self.repeat_threshold = repeat_threshold
        self.max_repeats = max_repeats
        self.default_age = default_age

        # instantiate ASR & aligner & scorer
        self.asr = get_asr()
        self.aligner = WhisperXAligner(device=None)
        self.azure_tts = None
        if use_azure_tts:
            try:
                self.azure_tts = AzureTTS()
            except Exception as e:
                print("[session] Azure TTS not configured:", e)
                self.azure_tts = None

        # Feedback generator (uses Azure OpenAI); non-fatal if missing
        try:
            self.feedback_gen = FeedbackGenerator(azure_tts=self.azure_tts)
        except Exception as e:
            print("[session] FeedbackGenerator init failed (Azure OpenAI may be missing):", e)
            print("[session] Feedback will use a local fallback.")
            self.feedback_gen = None

        self.scorer = Scorer(azure_tts=self.azure_tts, sample_rate=self.sample_rate)
        self.coach = Coach()

        # runtime state
        self.session_log = []

    def speak_text(self, text: str):
        """Speak assistant text via AzureTTS if available; always print."""
        print("\n[ASSISTANT]:", text)
        if self.azure_tts:
            safe = _escape_xml(text)
            tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            tmp.close()
            try:
                self.azure_tts.synthesize_to_file(safe, tmp.name)
                _play_wav_file(tmp.name)
            except Exception as e:
                print("[session] AzureTTS speak failed:", e)
            finally:
                try:
                    os.remove(tmp.name)
                except Exception:
                    pass

    def record_audio(self, duration_s: int) -> np.ndarray:
        """Record a mono int16 buffer for duration_s seconds and return numpy array (int16)."""
        dur = max(1, int(duration_s))
        print(f"[session] Recording for {dur} seconds...")
        data = sd.rec(int(dur * self.sample_rate), samplerate=self.sample_rate, channels=1, dtype="int16")
        sd.wait()
        return data.squeeze()

    def process_attempt(self, expected_text: str, audio_np: np.ndarray, asr_hypothesis: Optional[str] = None, save_wav: Optional[str] = None) -> dict:
        """Transcribe -> align -> score. Returns scoring result (dict)."""
        if save_wav:
            try:
                sf.write(save_wav, audio_np, self.sample_rate)
            except Exception as e:
                print("[session] Could not save wav:", e)

        # ASR
        try:
            asr_text, segments = self.asr.transcribe_numpy(audio_np, sample_rate=self.sample_rate)
        except Exception as e:
            print("[session] ASR failed:", e)
            asr_text, segments = (asr_hypothesis or "", [])

        # Align
        try:
            aligned = self.aligner.align_segments(segments, audio_np, sample_rate=self.sample_rate, language="en", return_char_alignments=False)
        except Exception as e:
            print("[session] Alignment failed:", e)
            aligned = {"segments": segments}

        # Score (pass original asr_text as fallback)
        try:
            result = self.scorer.score_utterance(expected_text=expected_text,
                                                 aligned_result=aligned,
                                                 audio_np=audio_np,
                                                 audio_sr=self.sample_rate,
                                                 asr_hypothesis=asr_text,
                                                 debug=False)
        except Exception as e:
            print("[session] Scoring failed:", e)
            result = {
                "expected_text": expected_text,
                "actual_text": asr_text or "",
                "per_word": [],
                "summary": {"expected_words": 0, "correct_words": 0, "word_accuracy": 0.0}
            }

        # attach some meta
        result["_meta"] = {"asr_text": asr_text}
        return result

    def give_feedback(self, scoring_result: dict, play: bool = True, age_group: Optional[str] = None) -> str:
        """Generate spoken feedback via FeedbackGenerator (AzureOpenAI) or fallback local generator."""
        age = age_group or self.default_age
        if self.feedback_gen:
            try:
                text = self.feedback_gen.generate_and_speak(scoring_result, play=play, age_group=age)
                return text
            except Exception as e:
                print("[session] Feedback generation via GPT failed:", e)

        # Fallback
        s = scoring_result.get("summary", {})
        expected = s.get("expected_words", 0)
        correct = s.get("correct_words", 0)
        acc_line = f"You pronounced {correct} out of {expected} words correctly."
        # minimal tips
        tips = []
        wrongs = [p for p in scoring_result.get("per_word", []) if p.get("op") != "equal"]
        if wrongs:
            for p in wrongs[:2]:
                w = p.get("expected") or "<word>"
                tips.append(f"Try saying '{w}' slowly and clearly.")
        else:
            tips.append("Nice work — add a little expression next time.")

        practice = scoring_result.get("expected_text", "")
        feedback = " ".join(["Great work!", acc_line, " ".join(tips), f'Practice: "{practice}"', "Keep going!"])
        # speak fallback via azure_tts if available
        if self.azure_tts and play:
            try:
                safe = _escape_xml(feedback)
                tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
                tmp.close()
                self.azure_tts.synthesize_to_file(safe, tmp.name)
                _play_wav_file(tmp.name)
                try:
                    os.remove(tmp.name)
                except Exception:
                    pass
            except Exception as e:
                print("[session] Fallback AzureTTS failed:", e)
        else:
            print("\n[FEEDBACK TEXT]\n" + feedback + "\n")
        return feedback

    def run_guided(self, start_index: int = 0, save_sessions_dir: Optional[str] = None, play_feedback: bool = True):
        """Run a guided loop through EXERCISES with simple adaptation."""
        idx = start_index if 0 <= start_index < len(EXERCISES) else 0
        last_result = None
        repeats = 0

        # initial greeting
        self.speak_text("Hey there — let's practice. Use Ctrl+C to quit anytime. Please use headphones for clearer feedback.")

        while True:
            ex = EXERCISES[idx]
            prompt = ex.get("prompt_text")
            expected = ex.get("expected_text")
            duration = ex.get("duration_s", self.default_duration)

            # Speak instruction
            self.speak_text(prompt)
            # small pause to avoid TTS bleed into recording
            time.sleep(0.3)

            # Record attempt
            audio_np = self.record_audio(duration_s=duration)

            # Process attempt
            result = self.process_attempt(expected_text=expected, audio_np=audio_np, asr_hypothesis=None)
            print("\n[SCORING RESULT]")
            print(json.dumps(result, indent=2))

            # Save session attempt
            entry = {"exercise": ex, "result": result, "timestamp": time.time()}
            self.session_log.append(entry)
            if save_sessions_dir:
                try:
                    os.makedirs(save_sessions_dir, exist_ok=True)
                    fname = os.path.join(save_sessions_dir, f"session_ex{ex['id']}_{int(time.time())}.json")
                    with open(fname, "w", encoding="utf-8") as f:
                        json.dump(entry, f, indent=2)
                except Exception as e:
                    print("[session] Failed saving session file:", e)

            # Feedback (age-aware, TTS + print)
            self.give_feedback(result, play=play_feedback)

            # Adaptation: repeat if accuracy low
            acc = result.get("summary", {}).get("word_accuracy", 0.0)
            # store repeat count in result meta for the coach's decision
            result["_meta"] = result.get("_meta", {})
            result["_meta"]["repeats"] = repeats

            if acc < self.repeat_threshold and repeats < self.max_repeats:
                print(f"[session] Accuracy {acc:.2f} < {self.repeat_threshold}; repeating exercise (repeat #{repeats+1}).")
                repeats += 1
                last_result = result
                # repeat same idx
                continue
            else:
                # move next
                repeats = 0
                last_result = result
                if idx + 1 < len(EXERCISES):
                    idx += 1
                else:
                    print("[session] Completed all exercises in the curriculum.")
                    break

            # Small pause between exercises
            time.sleep(0.4)

        # session end: summary
        print("\n[session] Session finished. Summary of attempts:")
        for i, e in enumerate(self.session_log):
            exid = e["exercise"]["id"]
            acc = e["result"].get("summary", {}).get("word_accuracy", 0.0)
            print(f"  Attempt {i+1} — exercise {exid} — accuracy: {acc:.3f}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["guided"], default="guided")
    parser.add_argument("--duration", type=int, default=4, help="Default recording duration (seconds)")
    parser.add_argument("--repeat-threshold", type=float, default=0.75, help="Repeat same exercise if accuracy < this")
    parser.add_argument("--max-repeats", type=int, default=2, help="Max repeats per exercise")
    parser.add_argument("--no-play", action="store_true", help="Don't play TTS feedback")
    parser.add_argument("--save", type=str, default=None, help="Directory to save per-attempt JSON (optional)")
    parser.add_argument("--age", choices=["kid", "teen", "adult"], default="adult", help="Age group for feedback tone")
    args = parser.parse_args()

    sess = InteractiveSession(sample_rate=16000,
                              default_duration=args.duration,
                              repeat_threshold=args.repeat_threshold,
                              max_repeats=args.max_repeats,
                              use_azure_tts=True,
                              default_age=args.age)
    try:
        sess.run_guided(save_sessions_dir=args.save, play_feedback=not args.no_play)
    except KeyboardInterrupt:
        print("\n[session] Interrupted by user. Exiting gracefully.")
    except Exception as e:
        print("[session] Fatal error:", e)

if __name__ == "__main__":
    main()
