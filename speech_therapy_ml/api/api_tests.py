import requests
from pathlib import Path
import tempfile
import os
import dotenv
dotenv.load_dotenv()

# --- AzureTTS Helper ---
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

# --- API Tests ---
BASE_URL = "http://localhost:8000"
TEST_TEXT = "America is a continent"

def get_test_audio_bytes():
    tts = AzureTTS()
    return tts.synthesize_to_wav_bytes(TEST_TEXT)

def test_transcribe():
    url = f"{BASE_URL}/transcribe"
    try:
        audio_bytes = get_test_audio_bytes()
    except Exception as e:
        return f"❌ AzureTTS error: {e}"
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    with open(tmp_path, "rb") as f:
        files = {"audio": f}
        resp = requests.post(url, files=files)
    os.remove(tmp_path)
    data = resp.json()
    if "text" in data:
        return f"✅ /transcribe OK → {data['text']}"
    return f"❌ /transcribe bad response: {data}"

def test_score_and_feedback():
    url_score = f"{BASE_URL}/score"
    url_feedback = f"{BASE_URL}/feedback"
    try:
        audio_bytes = get_test_audio_bytes()
    except Exception as e:
        return f"❌ AzureTTS error: {e}"
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    with open(tmp_path, "rb") as f:
        files = {"audio": f}
        data = {"expected": TEST_TEXT}
        resp_score = requests.post(url_score, data=data, files=files)
    os.remove(tmp_path)
    if resp_score.status_code != 200:
        return f"❌ /score failed → {resp_score.text}"
    scoring_result = resp_score.json()
    if "summary" not in scoring_result:
        return f"❌ /score bad response → {scoring_result}"
    print(f"✅ /score OK → word_accuracy={scoring_result['summary']['word_accuracy']}")
    resp_fb = requests.post(url_feedback, json={"scoring_result": scoring_result})
    if resp_fb.status_code != 200:
        return f"❌ /feedback failed → {resp_fb.text}"
    fb_data = resp_fb.json()
    if "feedback" in fb_data:
        return f"✅ /feedback OK → {fb_data['feedback']}"
    return f"❌ /feedback bad response: {fb_data}"

if __name__ == "__main__":
    print("Running API tests...\n")
    print(test_transcribe())
    print(test_score_and_feedback())
    print("\nTests completed.")