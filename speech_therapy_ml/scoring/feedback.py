# scoring/feedback.py
"""
Feedback generator: uses Azure OpenAI (GPT-4.1 deployment) to generate short,
human-friendly spoken feedback based on the scoring JSON, then speaks it using AzureTTS.

Now supports age-aware feedback via the `age_group` parameter: "kid", "teen", "adult".
If age_group is not provided, defaults to "adult".
"""

import os
import json
import tempfile
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

# audio playback
try:
    import soundfile as sf
    import sounddevice as sd
except Exception as e:
    raise ImportError("feedback.py requires 'soundfile' and 'sounddevice'. Install them. Error: " + str(e))

# Azure OpenAI client (OpenAI Python package with Azure wrapper)
try:
    from openai import AzureOpenAI
except Exception:
    AzureOpenAI = None  # handled below

# reuse your AzureTTS helper
from .azure_tts import AzureTTS


def _escape_xml(text: str) -> str:
    # minimal XML escaping for SSML safety
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def _normalize_age(age: Optional[str]) -> str:
    if not age:
        return "adult"
    a = age.strip().lower()
    if a in ("kid", "child", "children"):
        return "kid"
    if a in ("teen", "adolescent"):
        return "teen"
    return "adult"

class FeedbackGenerator:
    def __init__(self,
                 azure_tts: Optional[AzureTTS] = None,
                 openai_api_key: Optional[str] = None,
                 openai_endpoint: Optional[str] = None,
                 openai_deployment: Optional[str] = None):
        """
        azure_tts: instance of scoring.azure_tts.AzureTTS (optional but recommended)
        openai_api_key/endpoint/deployment: if not provided, pulled from env
        Required env variables (preferred in .env):
          AZURE_OPENAI_KEY
          AZURE_OPENAI_ENDPOINT
          AZURE_OPENAI_DEPLOYMENT
        """
        self.azure_tts = azure_tts

        self.api_key = openai_api_key or os.getenv("AZURE_OPENAI_KEY")
        self.endpoint = openai_endpoint or os.getenv("AZURE_OPENAI_ENDPOINT")
        self.deployment = openai_deployment or os.getenv("AZURE_OPENAI_DEPLOYMENT")

        if not (self.api_key and self.endpoint and self.deployment):
            raise RuntimeError("Azure OpenAI config missing. Set AZURE_OPENAI_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT.")

        if AzureOpenAI is None:
            raise RuntimeError("OpenAI Python package not available. Install the 'openai' package that provides AzureOpenAI.")

        # instantiate client
        self.client = AzureOpenAI(api_key=self.api_key, api_version="2024-05-01-preview", azure_endpoint=self.endpoint)

    def _build_messages(self, scoring_result: dict, age_group: Optional[str] = None) -> list:
        """
        Build compact system + user messages for GPT, tuned by age_group.
        age_group: "kid"|"teen"|"adult"
        """
        age = _normalize_age(age_group)

        # Base instructions (structure + prosody usage)
        base_instr = (
            "You are a supportive speech-therapy coach giving spoken feedback. "
            "Keep the response short, human, and encouraging — it should sound like something a real coach would say, not a script. "
            "Always speak naturally, with warmth and variety in phrasing. "
            "Your response must be plain text only (for TTS). "
            "Structure loosely around these elements (but blend them into natural speech, not numbered lists): "
            "- Start with genuine praise in one short sentence. "
            "- Give a quick accuracy recap (e.g., 'You nailed 3 out of 4 words'). "
            "- Offer up to three concrete, bite-sized tips for improvement (pronunciation, fluency, volume, intonation). "
            "- Suggest exactly one short practice sentence in quotes (≤ 8 words). "
            " - You should analyze prosody details (pace, stress, intonation) if 'prosody_reliable' is true in the scoring JSON, and mention them in tips. "
            "- End with one closing line of encouragement. "
            "Only use prosody details if 'prosody_reliable' is true in the scoring JSON. "
            "Avoid technical jargon unless the user is an adult. "
            "Do not output JSON or analysis — only a warm, spoken-style feedback paragraph."
        )


        # Age-specific constraints
        if age == "kid":
            age_instr = (
                "Age: child. Speak in simple, playful, happy language like talking to a 6-10 year old. "
                "Use short, bouncy sentences with fun encouragement (like 'Great job, superstar!' or 'That was awesome!'). "
                "Tips should be super concrete and easy: 'say it slower', 'open your mouth wider', 'smile while saying it'. "
                "Practice sentence must be fun and tiny (≤ 6 words), like something a kid would enjoy repeating. "
                "Keep total output very short (≤ 90 words)."
            )
        elif age == "teen":
            age_instr = (
                "Age: teen. Use a friendly, slightly informal, coach-like tone. "
                "Encourage without being childish, and never patronize. "
                "Use relatable phrasing like 'That sounded smooth' or 'Nice progress, keep building'. "
                "Tips can use simple technical terms (pace, stress, tone) but stay brief. "
                "Practice sentence should feel natural (≤ 8 words). "
                "Keep response lean and engaging (≤ 140 words)."
            )
        else:  # adult
            age_instr = (
                "Age: adult. Speak with a warm, professional coaching tone. "
                "Balance encouragement with clear, actionable tips. "
                "Be specific and constructive, focusing on improvement areas. "
                "Practice sentence should be relevant, short, and practical (≤ 10 words). "
                "Keep the output concise and natural (≤ 160 words)."
            )


        system = " ".join([base_instr, age_instr])

        # Compact scoring JSON embed: keep it but remove any huge debug keys if present.
        safe = scoring_result.copy()
        if "_debug_segments_preview" in safe:
            safe.pop("_debug_segments_preview", None)
        if "_debug_prosody_words" in safe:
            safe.pop("_debug_prosody_words", None)

        # Build user block with a compact JSON string plus a short human note
        user = "Scoring JSON:\n" + json.dumps(safe, indent=2) + "\n\nNow produce the requested feedback adapting language/tone to the target age group."

        return [{"role": "system", "content": system},
                {"role": "user", "content": user}]

    def generate_feedback_text(self, scoring_result: dict, age_group: Optional[str] = None, max_tokens: int = 300, temperature: float = 0.6) -> str:
        """
        Generate human-like feedback text using Azure OpenAI, adapted to age_group.
        age_group: "kid"|"teen"|"adult"
        Falls back to a simple template if the API call fails.
        """
        messages = self._build_messages(scoring_result, age_group=age_group)
        try:
            resp = self.client.chat.completions.create(
                model=self.deployment,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            text = resp.choices[0].message.content.strip()
            # Truncate conservatively to ~200 words if GPT is too verbose
            words = text.split()
            if len(words) > 200:
                text = " ".join(words[:200])
            return text
        except Exception as e:
            print("[Feedback] Azure OpenAI failed:", e)
            return self._fallback_text(scoring_result, age_group=age_group)

    def _fallback_text(self, scoring_result: dict, age_group: Optional[str] = None) -> str:
        """
        Simple fallback templates, adapted by age_group.
        Keeps the 5-part structure but uses safe plain text construction.
        """
        age = _normalize_age(age_group)
        s = scoring_result.get("summary", {})
        expected = s.get("expected_words", 0)
        correct = s.get("correct_words", 0)
        acc_line = f"You pronounced {correct} out of {expected} words correctly."

        per = scoring_result.get("per_word", [])
        wrongs = [p for p in per if p.get("op") != "equal"]
        tips = []

        if wrongs:
            # pick first up to 2 errors
            for p in wrongs[:2]:
                expected_word = p.get("expected") or "<word>"
                phonemes = p.get("phonemes")
                if age == "kid":
                    tips.append(f"Try saying '{expected_word}' slowly and clearly.")
                elif age == "teen":
                    if phonemes:
                        tips.append(f"Work on '{expected_word}' — focus on {phonemes}.")
                    else:
                        tips.append(f"Try '{expected_word}' with a bit more clarity and a slower pace.")
                else:  # adult
                    if phonemes:
                        tips.append(f"Pronounce '{expected_word}' carefully — focus on {phonemes}.")
                    else:
                        tips.append(f"Try '{expected_word}' more slowly and enunciate clearly.")
        else:
            if age == "kid":
                tips.append("Awesome! Try saying the whole sentence with a big smile!")
            elif age == "teen":
                tips.append("Great — add a little variation in tone and keep your pace steady.")
            else:
                tips.append("Good job — add a bit more expression and ensure consistent volume.")

        practice = scoring_result.get("expected_text", "") or ""
        # Age-tune practice sentence length if needed
        if age == "kid" and len(practice.split()) > 6:
            # shorten for kids: pick first 6 words
            words = practice.split()
            practice_short = " ".join(words[:6])
            practice_sentence = f'Practice: "{practice_short}"'
        else:
            practice_sentence = f'Practice: "{practice}"'

        # Closing encouragement
        if age == "kid":
            encouragement = "You're doing great—keep practicing and have fun!"
            praise = "Well done!"
        elif age == "teen":
            encouragement = "Keep it up — small improvements add up quickly."
            praise = "Nice work!"
        else:
            encouragement = "Keep practicing — you're improving each time."
            praise = "Well done!"

        feedback = " ".join([praise, acc_line, " ".join(tips), practice_sentence, encouragement])
        return feedback

    def speak_text(self, text: str, play: bool = True) -> Optional[str]:
        """
        Use your AzureTTS instance to synthesize and play the text.
        Returns path to temporary WAV if successful, None otherwise.
        """
        # Print text to terminal first
        print("\n[FEEDBACK TEXT]\n" + text + "\n")

        if self.azure_tts is None:
            print("[Feedback] Azure TTS not configured — cannot play audio. (Text printed above.)")
            return None

        safe = _escape_xml(text)
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        tmp.close()
        try:
            # synthesize with AzureTTS helper (writes WAV)
            self.azure_tts.synthesize_to_file(safe, tmp.name)
            if play:
                try:
                    data, sr = sf.read(tmp.name, dtype='float32')
                    sd.play(data, sr)
                    sd.wait()
                except Exception as e:
                    print("[Feedback] Playback failed:", e)
            return tmp.name
        except Exception as e:
            print("[Feedback] Azure TTS failed:", e)
            return None
        finally:
            try:
                os.remove(tmp.name)
            except Exception:
                pass

    def generate_and_speak(self, scoring_result: dict, play: bool = True, age_group: Optional[str] = None) -> str:
        """
        Top-level convenience: generate text via Azure OpenAI (age-adapted) and speak it via AzureTTS.
        Returns the final feedback text (generated or fallback).

        age_group: optional string 'kid'|'teen'|'adult'. Defaults to 'adult'.
        """
        text = self.generate_feedback_text(scoring_result, age_group=age_group)
        self.speak_text(text, play=play)
        return text
