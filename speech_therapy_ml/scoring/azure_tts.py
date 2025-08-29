"""
Azure TTS helper that returns a WAV (RIFF PCM) bytes buffer for a small text snippet.
If AZURE_SPEECH_KEY / AZURE_REGION are not present in env, raises an informative error.
"""

import os
import requests
import tempfile
from dotenv import load_dotenv
load_dotenv()

AZURE_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_REGION = os.getenv("AZURE_REGION")
DEFAULT_VOICE = "en-US-JennyNeural"
DEFAULT_OUTPUT_FORMAT = "riff-16khz-16bit-mono-pcm"

class AzureTTS:
    def __init__(self, subscription_key: str | None = None, region: str | None = None, voice: str = DEFAULT_VOICE):
        self.subscription_key = subscription_key or AZURE_KEY
        self.region = region or AZURE_REGION
        if not self.subscription_key or not self.region:
            raise RuntimeError("Azure TTS requires AZURE_SPEECH_KEY and AZURE_REGION environment variables (or pass them to AzureTTS).")
        self.voice = voice
        self.endpoint = f"https://{self.region}.tts.speech.microsoft.com/cognitiveservices/v1"

    def synthesize_to_wav_bytes(self, text: str, output_format: str = DEFAULT_OUTPUT_FORMAT) -> bytes:
        ssml = f"""
            <speak version='1.0' xml:lang='en-US'>
                <voice xml:lang='en-US' name='{self.voice}'>{text}</voice>
            </speak>
        """
        headers = {
            "Ocp-Apim-Subscription-Key": self.subscription_key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": output_format,
            "User-Agent": "speech_therapy_scoring"
        }
        resp = requests.post(self.endpoint, headers=headers, data=ssml.encode("utf-8"))
        if resp.status_code != 200:
            raise RuntimeError(f"Azure TTS failed: {resp.status_code} {resp.text}")
        return resp.content

    def synthesize_to_file(self, text: str, out_path: str):
        data = self.synthesize_to_wav_bytes(text)
        with open(out_path, "wb") as f:
            f.write(data)
        return out_path
