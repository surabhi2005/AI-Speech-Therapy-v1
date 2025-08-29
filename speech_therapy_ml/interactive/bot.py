# interactive/bot.py
"""
Bot helper: proposes next exercise or adapts difficulty.
Uses AzureOpenAI if configured; otherwise falls back to the static curriculum.
"""

import os
import json
from typing import Optional, Tuple

from dotenv import load_dotenv
load_dotenv()

try:
    from openai import AzureOpenAI
except Exception:
    AzureOpenAI = None

from . import state as state_module

class Coach:
    def __init__(self, deployment: Optional[str] = None):
        self.deployment = deployment or os.getenv("AZURE_OPENAI_DEPLOYMENT")
        self.api_key = os.getenv("AZURE_OPENAI_KEY")
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.client = None
        if AzureOpenAI is not None and self.api_key and self.endpoint and self.deployment:
            try:
                self.client = AzureOpenAI(api_key=self.api_key, api_version="2024-05-01-preview", azure_endpoint=self.endpoint)
            except Exception:
                self.client = None

    def propose_next(self, last_result: Optional[dict], current_index: int) -> Tuple[dict, int]:
        """
        Decide the next exercise.
        Returns (exercise_dict, index).
        Rule:
          - If last_result is None: return exercise 0.
          - If last_result exists and accuracy < 0.7 -> repeat same exercise (unless repeated > 2 times)
          - Else move to next exercise.
        If AzureOpenAI available: optionally request a tailored next prompt (not required).
        """
        exercises = state_module.EXERCISES
        if not exercises:
            return ({"id": 0, "prompt_text": "Say anything", "expected_text": "", "duration_s": 4}, 0)

        # Very small adaptation logic:
        if last_result is None:
            return exercises[0], 0

        acc = last_result.get("summary", {}).get("word_accuracy", 0.0)
        last_idx = current_index
        repeat_count = last_result.get("_meta", {}).get("repeats", 0)

        if acc < 0.7 and repeat_count < 2:
            # repeat
            ex = exercises[last_idx]
            return ex, last_idx

        # else move next (cap at last)
        next_idx = min(len(exercises) - 1, last_idx + 1)
        return exercises[next_idx], next_idx

    def gpt_suggest(self, context_text: str) -> Optional[dict]:
        """
        Optional: use AzureOpenAI to suggest a custom practice prompt.
        Not used by default — included for extensibility.
        """
        if not self.client:
            return None
        system = "You are a speech-coach that suggests short sentences for pronunciation practice (<=10 words). Return JSON: {\"prompt_text\":\"...\",\"expected_text\":\"...\",\"duration_s\":int}"
        user = f"Context:\n{context_text}\n\nSuggest one short practice sentence and expected plain form."
        try:
            resp = self.client.chat.completions.create(
                model=self.deployment,
                messages=[{"role":"system","content":system},{"role":"user","content":user}],
                temperature=0.7,
                max_tokens=150
            )
            txt = resp.choices[0].message.content.strip()
            # Attempt to parse JSON from model; if fails, return None
            try:
                parsed = json.loads(txt)
                if "prompt_text" in parsed and "expected_text" in parsed:
                    parsed.setdefault("duration_s", 4)
                    return parsed
            except Exception:
                return None
        except Exception:
            return None
        return None
