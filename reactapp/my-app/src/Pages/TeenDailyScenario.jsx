// TeenDailyScenario.jsx
import React, { useEffect, useRef, useState } from "react";
import TeenSidebar from "./TeenSidebar";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaArrowRight,
  FaHome,
  FaStar,
  FaVolumeUp,
  FaPlay,
  FaStop,
} from "react-icons/fa";
import axios from "axios";

/* === EDIT MARKER START ===
   Full single-file TeenDailyScenario implementation (polished):
   - Teen-friendly daily conversational scenarios (expanded mock data)
   - Conversation Q&A flow: assistant prompt -> user records -> scoring via /score
   - MediaRecorder-based recording, convert best-effort to WAV 16k (falls back to raw blob)
   - Loading states during scoring, clean teen UI/UX
   - Local history of rounds stored in localStorage with trend sparkline
   - Advanced collapsible raw JSON for developers (hidden by default)
   - Prevents scenario change while recording; Next only allowed after recording
   - "Hear Prompt" and "Hear & Record" TTS options added
   - Play/Stop toggle for recorded playback, prevents mixing with assistant
   === EDIT MARKER END === */

/* API setup */
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: API_BASE, timeout: 60000 });

/* Simple spinner */
const Spinner = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className="animate-spin"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
    <path d="M22 12A10 10 0 0012 2" stroke="#7c5fb3" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/* Small sparkline for history trends */
const Sparkline = ({ data = [], w = 120, h = 28 }) => {
  if (!data.length) return <div className="text-xs text-gray-400">No trend</div>;
  const vals = data.map((d) => d.accuracy || 0);
  const max = Math.max(...vals, 100);
  const min = Math.min(...vals, 0);
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1 || 1)) * (w - 6) + 3;
    const y = (1 - (v - min) / Math.max(1, max - min)) * (h - 6) + 3;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts.join(" ")} fill="none" stroke="#9B7EBD" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

/* Useful WAV convert/resample helpers (best-effort) */
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
}
function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    output.setInt16(offset, s, true);
  }
}
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPCM(view, 44, samples);
  return view.buffer;
}
async function convertBlobToWav16k(blob) {
  try {
    const ab = await blob.arrayBuffer();
    const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await decodeCtx.decodeAudioData(ab);
    decodeCtx.close?.();
    const targetRate = 16000;
    const channels = 1;
    const offline = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      channels,
      Math.ceil(decoded.duration * targetRate),
      targetRate
    );
    const buffer = offline.createBuffer(channels, Math.ceil(decoded.duration * targetRate), targetRate);
    for (let ch = 0; ch < channels; ch++) {
      const input = decoded.numberOfChannels > ch ? decoded.getChannelData(ch) : decoded.getChannelData(0);
      const out = buffer.getChannelData(ch);
      const ratio = decoded.sampleRate / targetRate;
      for (let i = 0; i < out.length; i++) out[i] = input[Math.floor(i * ratio)] || 0;
    }
    const src = offline.createBufferSource();
    src.buffer = buffer;
    src.connect(offline.destination);
    src.start(0);
    const rendered = await offline.startRendering();
    const wav = encodeWAV(rendered.getChannelData(0), targetRate);
    return new Blob([wav], { type: "audio/wav" });
  } catch (e) {
    console.warn("convertBlobToWav16k failed:", e);
    return blob; // fallback to original
  }
}

/* Local storage history helper */
const HISTORY_KEY = "teen_daily_scenario_history_v1";
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveHistory(arr) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 50)));
  } catch {}
}

/* Expanded mock scenarios for teens (conversation-based) */
const SCENARIOS = [
  {
    title: "At the School",
    description: "Answer your teacher confidently in common classroom situations.",
    steps: [
      { prompt: "Teacher: Good morning! How are you today?", expected: "Good morning! I'm doing well, thank you." },
      { prompt: "Teacher: Did you finish your history project?", expected: "Yes, I finished it and uploaded it last night." },
      { prompt: "Teacher: Can you explain why the topic matters?", expected: "It matters because it helps us understand how people lived in the past." },
    ],
  },
  {
    title: "Job Interview Prep",
    description: "Practice quick, confident responses for interviews.",
    steps: [
      { prompt: "Interviewer: Tell me about yourself in one minute.", expected: "I'm a student who loves problem-solving and I'm eager to learn new skills." },
      { prompt: "Interviewer: What's your biggest strength?", expected: "My biggest strength is being persistent and organized." },
      { prompt: "Interviewer: Why should we hire you?", expected: "I am a quick learner and I bring energy and dedication to the team." },
    ],
  },
  {
    title: "Ordering at a Cafe",
    description: "Natural, polite ways to order and ask questions.",
    steps: [
      { prompt: "Barista: Hi! What can I get for you?", expected: "Hi! I'd like a medium cappuccino, please." },
      { prompt: "Barista: Would you like any flavor shots?", expected: "Yes, please add a shot of vanilla." },
      { prompt: "Barista: Will that be for here or to go?", expected: "To go, thanks." },
    ],
  },
  {
    title: "Friends Hangout",
    description: "Casual conversational practice with friends.",
    steps: [
      { prompt: "Friend: Hey! Want to catch a movie later?", expected: "Sure! What time and which movie are you thinking of?" },
      { prompt: "Friend: Wanna try the new sushi place?", expected: "Yes, let's go this weekend. I heard it's good." },
      { prompt: "Friend: Did you see the game last night?", expected: "I missed it — how was the final score?" },
    ],
  },
];

/* Main component */
export default function TeenDailyScenario() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = SCENARIOS[scenarioIndex];

  const [step, setStep] = useState("intro"); // intro | practice | feedback
  const [lineIndex, setLineIndex] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordedBlobRef = useRef(null);

  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  const [history, setHistory] = useState(() => loadHistory());
  const [error, setError] = useState("");

  // playback state for recorded audio toggle
  const audioPlayerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // reset when switching scenario
    setLineIndex(0);
    setStep("intro");
    setScoreResult(null);
    setAccuracy(null);
    recordedBlobRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIndex]);

  useEffect(() => {
    return () => {
      // cleanup any open streams / audio
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
      } catch {}
      try {
        audioPlayerRef.current?.pause();
        audioPlayerRef.current = null;
      } catch {}
    };
  }, []);

  /* Recording handlers */
  async function startRecording() {
    setError("");
    // stop assistant (if TTS playing) to avoid mixing
    try {
      window.speechSynthesis?.cancel?.();
    } catch {}

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/wav";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {}
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
        recordedBlobRef.current = blob;
        // convert and post
        const wav = await convertBlobToWav16k(blob);
        await postScore(wav);
      };
      mr.start();
      setIsRecording(true);
      // clear previous for fresh run
      setScoreResult(null);
      setAccuracy(null);
    } catch (err) {
      console.error("startRecording", err);
      setError("Could not access microphone. Check permissions.");
    }
  }

  function stopRecording() {
    setIsRecording(false);
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.warn("stopRecording", err);
      setIsRecording(false);
    }
  }

  /* Posting to backend /score */
  async function postScore(wavBlob) {
    setIsScoring(true);
    setError("");
    setScoreResult(null);
    setAccuracy(null);
    try {
      const form = new FormData();
      form.append("expected", scenario.steps[lineIndex].expected);
      form.append("audio", wavBlob, "response.wav");
      const res = await api.post("/score", form, { headers: { "Content-Type": "multipart/form-data" } });
      const result = res.data || {};
      setScoreResult(result);
      const accPct = Math.round(Number(result?.summary?.word_accuracy ?? 0) * 100);
      setAccuracy(isNaN(accPct) ? null : accPct);

      // persist to local history
      const entry = {
        id: `${scenario.title}-${lineIndex}-${Date.now()}`,
        scenario: scenario.title,
        prompt: scenario.steps[lineIndex].prompt,
        expected: scenario.steps[lineIndex].expected,
        accuracy: isNaN(accPct) ? 0 : accPct,
        date: new Date().toISOString(),
      };
      const next = [entry, ...history].slice(0, 60);
      setHistory(next);
      saveHistory(next);
    } catch (err) {
      console.error("postScore", err);
      setError(err?.response?.data?.message || err?.message || "Scoring failed. Try again.");
    } finally {
      setIsScoring(false);
    }
  }

  /* Navigation logic: Next only allowed after user recorded or there is a scoreResult */
  const handleNext = () => {
    if (isRecording || isScoring) return;
    if (!recordedBlobRef.current && !scoreResult) {
      // enforce recording first
      setError("Please record your answer before moving to the next prompt.");
      return;
    }
    setError("");
    if (lineIndex < scenario.steps.length - 1) {
      setLineIndex((i) => i + 1);
      setScoreResult(null);
      setAccuracy(null);
      recordedBlobRef.current = null;
    } else {
      setStep("feedback");
    }
  };

  const handleStartPractice = () => {
    setStep("practice");
    setLineIndex(0);
    setScoreResult(null);
    setAccuracy(null);
    recordedBlobRef.current = null;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  /* Play/Stop recorded audio toggling (prevents mixing) */
  function togglePlayRecorded() {
    if (!recordedBlobRef.current) return;
    if (isPlaying) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {}
      audioPlayerRef.current = null;
      setIsPlaying(false);
      return;
    }
    // stop any TTS
    try {
      window.speechSynthesis?.cancel?.();
    } catch {}
    const url = URL.createObjectURL(recordedBlobRef.current);
    const a = new Audio(url);
    audioPlayerRef.current = a;
    setIsPlaying(true);
    a.onended = () => {
      setIsPlaying(false);
      try {
        URL.revokeObjectURL(url);
      } catch {}
      audioPlayerRef.current = null;
    };
    a.play().catch((e) => {
      console.warn("playback err", e);
      setIsPlaying(false);
      audioPlayerRef.current = null;
    });
  }

  /* TTS helpers: speak prompt, and optionally start recording after TTS ends */
  function speakPrompt(startRecordingAfter = false) {
    try {
      if (!("speechSynthesis" in window)) {
        setError("TTS not supported in this browser.");
        return;
      }
      // stop any playing audio to avoid mixing
      try {
        audioPlayerRef.current?.pause();
        audioPlayerRef.current = null;
      } catch {}
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(scenario.steps[lineIndex].prompt);
      utter.lang = "en-US";
      utter.rate = 1.0;
      utter.onend = async () => {
        if (startRecordingAfter) {
          // small delay to ensure audio devices are free
          setTimeout(() => startRecording(), 220);
        }
      };
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn("speakPrompt", err);
      setError("Could not play prompt TTS.");
    }
  }

  /* Prevent scenario change while recording */
  function handleScenarioChange(e) {
    const idx = Number(e.target.value);
    if (isRecording) {
      alert("Finish or stop the recording before changing scenario.");
      return;
    }
    setScenarioIndex(idx);
  }

  return (
    <div className="flex min-h-screen">
      <TeenSidebar />

      <div
        className="relative flex-1 p-6 overflow-hidden"
        style={{ background: "linear-gradient(180deg,#F3EFFA 0%,#F9F7FD 100%)" }}
      >
        {/* subtle pattern */}
        <div
          className="absolute inset-0 opacity-6"
          style={{ backgroundImage: `radial-gradient(circle at 10% 10%, rgba(155,126,189,0.03), transparent 20%)` }}
        />

        <div className="relative z-10 flex flex-col items-center justify-start min-h-screen gap-6">
          {/* header */}
          <header className="w-full max-w-3xl flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#2b1736]">Daily Scenario — {scenario.title}</h1>
              <p className="text-sm text-gray-600">{scenario.description}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500 text-right">
                <div>Recent</div>
                <div className="text-sm font-semibold text-[#9B7EBD]">{history.length} rounds</div>
              </div>
              <div>
                <Sparkline data={history.slice(0, 8)} />
              </div>
            </div>
          </header>

          {/* content card */}
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-lg border border-purple-50">
            {step === "intro" && (
              <div className="text-center">
                <div className="text-5xl mb-3">💬</div>
                <h2 className="text-xl font-bold text-[#3B1E54] mb-2">Ready for today's practice?</h2>
                <p className="text-gray-600 mb-6">
                  Short conversational prompts to build confidence and clarity. Record your reply and get instant feedback.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={handleStartPractice} className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a] text-white">
                    Start Practice
                  </button>
                  <button
                    onClick={() => {
                      if (isRecording) {
                        alert("Stop recording first.");
                        return;
                      }
                      setScenarioIndex((i) => (i + 1) % SCENARIOS.length);
                    }}
                    className="px-4 py-2 rounded-full bg-white border"
                    disabled={isRecording}
                  >
                    Change Scenario
                  </button>
                </div>
              </div>
            )}

            {step === "practice" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    Line {lineIndex + 1} / {scenario.steps.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (isRecording) {
                          alert("Stop recording first.");
                          return;
                        }
                        setStep("intro");
                      }}
                      className="text-sm text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
                    >
                      <FaHome />
                    </button>

                    <select
                      value={scenarioIndex}
                      onChange={handleScenarioChange}
                      className="text-sm border px-2 py-1 rounded bg-white"
                      disabled={isRecording}
                    >
                      {SCENARIOS.map((s, idx) => (
                        <option key={s.title} value={idx}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4 p-4 rounded-xl bg-gradient-to-b from-white to-[#f7f4fb] border border-[#efe6fb]">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🗣️</div>
                    <div>
                      <div className="text-sm text-gray-500">Prompt</div>
                      <div className="text-lg font-semibold text-[#2b1736] mt-1">{scenario.steps[lineIndex].prompt}</div>
                    </div>
                  </div>

                  <div className="mt-4 bg-white p-3 rounded-lg border border-[#f0e9fb]">
                    <div className="text-xs text-gray-500">Suggested reply</div>
                    <div className="italic text-[#6b4a88] mt-1">"{scenario.steps[lineIndex].expected}"</div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={toggleRecording}
                      className={`p-5 rounded-full text-white shadow-lg transition-all ${isRecording ? "bg-[#3B1E54] animate-pulse" : "bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a]"}`}
                      aria-pressed={isRecording}
                      aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                      {isRecording ? <FaMicrophoneSlash size={22} /> : <FaMicrophone size={22} />}
                    </button>

                    <div className="flex flex-col items-start">
                      <div className="text-sm text-gray-600">{isRecording ? "Recording... speak now" : recordedBlobRef.current ? "Recorded — ready for scoring" : "Tap mic to record your answer"}</div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => speakPrompt(false)}
                          className="px-3 py-1 rounded-full bg-white border text-sm inline-flex items-center gap-2"
                          disabled={isRecording}
                        >
                          <FaVolumeUp /> Hear Prompt
                        </button>
                        <button
                          onClick={() => speakPrompt(true)}
                          className="px-3 py-1 rounded-full bg-white border text-sm inline-flex items-center gap-2"
                          disabled={isRecording}
                        >
                          <FaPlay /> Hear & Record
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={togglePlayRecorded}
                      disabled={!recordedBlobRef.current}
                      className="px-3 py-2 rounded-full bg-white border inline-flex items-center gap-2 disabled:opacity-60"
                    >
                      {isPlaying ? (
                        <>
                          <FaStop /> Stop
                        </>
                      ) : (
                        <>
                          <FaPlay /> Play
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={isRecording || isScoring || (!recordedBlobRef.current && !scoreResult)}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a] text-white flex items-center gap-2 disabled:opacity-50"
                    >
                      {lineIndex < scenario.steps.length - 1 ? "Next Question" : "Finish & See Feedback"} <FaArrowRight />
                    </button>
                  </div>

                  {/* scoring status */}
                  <div className="mt-4 w-full max-w-xl text-center">
                    {isScoring ? (
                      <div className="inline-flex items-center gap-2 text-sm text-[#6b4a88]">
                        <Spinner /> Scoring your reply...
                      </div>
                    ) : accuracy != null ? (
                      <div className="text-sm">
                        <div className="text-lg font-bold text-[#2b1736]">{accuracy}%</div>
                        <div className="text-xs text-gray-500">Word accuracy</div>
                        {scoreResult?.summary?.wpm ? <div className="mt-2 text-sm text-gray-700">WPM: {Math.round(scoreResult.summary.wpm)}</div> : null}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No score yet</div>
                    )}
                  </div>

                  {/* advanced raw JSON (collapsed) */}
                  <details className="mt-3 text-left w-full max-w-xl text-xs text-gray-500">
                    <summary className="cursor-pointer">Advanced (raw result)</summary>
                    <pre style={{ whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto", background: "#fbfbff", padding: 8, marginTop: 8, borderRadius: 6 }}>
                      {scoreResult ? JSON.stringify(scoreResult, null, 2) : "No server result yet."}
                    </pre>
                  </details>

                  {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
                </div>
              </div>
            )}

            {step === "feedback" && (
              <div className="text-center">
                <div className="text-3xl mb-2">🏁</div>
                <h3 className="text-xl font-bold text-[#2b1736]">Session Complete</h3>
                <p className="mt-2 text-gray-600">Nice work — here are your recent results.</p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="text-xs text-gray-500">Last Accuracy</div>
                    <div className="text-2xl font-bold text-[#9B7EBD]">{accuracy != null ? `${accuracy}%` : "—"}</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="text-xs text-gray-500">Rounds</div>
                    <div className="text-2xl font-bold text-[#9B7EBD]">{history.length}</div>
                  </div>
                </div>

                <div className="mt-5 flex gap-3 justify-center">
                  <button onClick={() => { setStep("practice"); setLineIndex(0); }} className="px-4 py-2 rounded-full bg-white border">Practice again</button>
                  <button onClick={() => { setStep("intro"); }} className="px-4 py-2 rounded-full bg-gradient-to-r from-[#9B7EBD] to-[#6b4a88] text-white">Done</button>
                </div>
              </div>
            )}
          </div>

          {/* right panel: recent rounds */}
          <aside className="w-full max-w-3xl lg:max-w-md">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-purple-50 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-500">Recent Rounds</div>
                  <div className="text-sm font-semibold text-[#3B1E54]">{history.length} entries</div>
                </div>
                <Sparkline data={history.slice(0, 8)} />
              </div>

              <div className="space-y-3 max-h-64 overflow-auto pr-2">
                {history.length === 0 ? (
                  <div className="text-sm text-gray-500">You haven't practiced yet — start a round!</div>
                ) : (
                  history.slice(0, 12).map((h) => (
                    <div key={h.id} className="p-2 rounded-md bg-gray-50 flex items-center justify-between">
                      <div style={{ minWidth: 0 }}>
                        <div className="text-sm font-semibold text-[#3B1E54] truncate">{h.scenario}</div>
                        <div className="text-xs text-gray-500 truncate">{h.prompt}</div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-bold text-[#9B7EBD]">{h.accuracy}%</div>
                        <div className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (!window.confirm("Clear recent rounds?")) return;
                    setHistory([]);
                    saveHistory([]);
                  }}
                  className="text-xs text-gray-500 underline"
                >
                  Clear history
                </button>
                <button onClick={() => { setStep("practice"); setLineIndex(0); }} className="text-xs px-2 py-1 rounded bg-purple-50">Practice</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
