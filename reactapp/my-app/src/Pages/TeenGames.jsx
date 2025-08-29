// TeenGames.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaPlay, FaStop, FaRedo, FaArrowLeft, FaCrown, FaTrophy } from "react-icons/fa";
import TeenSidebar from "./TeenSidebar"; // Make sure this path is correct
import axios from "axios";

/* === EDIT MARKER START ===
   Polished UI/UX upgrades (maintained) + responsive/fixes:
   - Fix Recent Rounds overflow & alignment
   - Increased Pro Tips padding
   - Make Advanced JSON wrap/scroll cleanly
   - Daily challenge button: now "Claim +10 XP" only after a round completed; persists as completed
   === EDIT MARKER END === */

/* API setup */
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
});

/* Spinner component (small, reusable) */
const Spinner = ({ size = 16, className = "" }) => (
  <svg
    className={`animate-spin ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
    <path d="M22 12a10 10 0 00-10-10" stroke="#6b4a88" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/* Utility WAV encode & resample */
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
    const arrayBuffer = await blob.arrayBuffer();
    const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
    decodeCtx.close?.();

    const duration = decoded.duration;
    const targetRate = 16000;
    const channels = 1;
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      channels,
      Math.ceil(duration * targetRate),
      targetRate
    );

    const buffer = offlineCtx.createBuffer(channels, Math.ceil(duration * targetRate), targetRate);
    for (let ch = 0; ch < channels; ch++) {
      const inputData = decoded.numberOfChannels > ch ? decoded.getChannelData(ch) : decoded.getChannelData(0);
      const outputData = buffer.getChannelData(ch);
      const ratio = decoded.sampleRate / targetRate;
      for (let i = 0; i < outputData.length; i++) {
        outputData[i] = inputData[Math.floor(i * ratio)] || 0;
      }
    }

    const src = offlineCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(offlineCtx.destination);
    src.start(0);
    const rendered = await offlineCtx.startRendering();

    const wavBuffer = encodeWAV(rendered.getChannelData(0), targetRate);
    return new Blob([wavBuffer], { type: "audio/wav" });
  } catch (err) {
    console.warn("convertBlobToWav16k failed, falling back to original blob:", err);
    return blob;
  }
}

function base64ToBlob(b64, contentType = "audio/wav") {
  const byteCharacters = atob(b64);
  const byteArrays = [];
  const sliceSize = 512;
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

function performanceLabel(score) {
  if (score >= 90) return "🔥 Pro level";
  if (score >= 75) return "💪 Strong";
  if (score >= 60) return "🙂 Improving";
  return "🔁 Keep practicing";
}

/* Local storage helpers for XP and history */
const XP_KEY = "teengames_xp_v1";
const HISTORY_KEY = "teengames_history_v1";
const DAILY_KEY = "teengames_daily_claim_v1";
function loadXp() {
  try {
    return Number(localStorage.getItem(XP_KEY) || 0);
  } catch {
    return 0;
  }
}
function saveXp(xp) {
  try {
    localStorage.setItem(XP_KEY, String(xp));
  } catch {}
}
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveHistory(h) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 20))); // keep last 20
  } catch {}
}
function loadDailyClaim() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    return raw ? JSON.parse(raw) : { claimed: false, lastDate: null };
  } catch {
    return { claimed: false, lastDate: null };
  }
}
function saveDailyClaim(obj) {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(obj));
  } catch {}
}

const TeenGames = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [score, setScore] = useState(0);
  const [currentTwister, setCurrentTwister] = useState(0);
  const [recording, setRecording] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return Number(localStorage.getItem("teen_best_score") || 0);
    } catch {
      return 0;
    }
  });

  // server & scoring states
  const [lastASR, setLastASR] = useState("");
  const [scoreResult, setScoreResult] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackPlaying, setFeedbackPlaying] = useState(false);
  const [error, setError] = useState("");

  // new loading states to prevent UI flicker
  const [isScoring, setIsScoring] = useState(false);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);

  // confetti on high score
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(0);

  // xp + history
  const [xp, setXp] = useState(loadXp());
  const [history, setHistory] = useState(loadHistory());
  const [dailyClaim, setDailyClaim] = useState(loadDailyClaim());

  // media refs
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const tongueTwisters = [
    "Unique New York, Unique New York, Unique New York",
    "Red lorry, yellow lorry, red lorry, yellow lorry",
    "She sells seashells by the seashore",
    "Peter Piper picked a peck of pickled peppers",
    "How can a clam cram in a clean cream can",
  ];

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      stopGame();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    return () => {
      try {
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
    };
  }, []);

  const startRecordingInternal = async () => {
    setError("");
    chunksRef.current = [];
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Microphone not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/wav";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        setRecording(false);
        setIsActive(false);
        try {
          const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
          const wavBlob = await convertBlobToWav16k(blob);
          await postScore(wavBlob);
        } catch (err) {
          console.error("Processing recorded audio failed:", err);
          setError("Audio processing failed. Try again.");
        } finally {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
          chunksRef.current = [];
        }
      };

      mr.start();
      setRecording(true);
    } catch (err) {
      console.error("startRecordingInternal error:", err);
      setError("Could not access microphone. Check permissions.");
    }
  };

  const stopRecordingInternal = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      } else {
        setRecording(false);
        setIsActive(false);
      }
    } catch (err) {
      console.error("stopRecordingInternal error:", err);
      setError("Failed to stop recording.");
      setRecording(false);
      setIsActive(false);
    }
  };

  const startGame = async () => {
    setError("");
    setScore(0);
    setScoreResult(null);
    setLastASR("");
    setFeedbackText("");
    setTimeLeft(30);
    setIsActive(true);
    setAttempts((a) => a + 1);
    await startRecordingInternal();
  };

  const stopGame = () => {
    setIsActive(false);
    stopRecordingInternal();
  };

  const nextTwister = () => {
    setCurrentTwister((p) => (p + 1) % tongueTwisters.length);
    setScoreResult(null);
    setLastASR("");
    setFeedbackText("");
  };

  /* postScore: send WAV + expected text to backend /score and process the result */
  const postScore = async (wavBlob) => {
    setError("");
    setIsScoring(true); // show scoring loading UI
    try {
      const form = new FormData();
      form.append("expected", tongueTwisters[currentTwister]);
      form.append("audio", wavBlob, "utterance.wav");

      const res = await api.post("/score", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = res.data || {};
      setScoreResult(result);

      // prefer _meta.asr_text or asr_text fields
      const asr = result?._meta?.asr_text || result?.asr_text || "";
      setLastASR(asr);

      const wordAccuracy = Number(result?.summary?.word_accuracy ?? result?.summary?.accuracy ?? 0); // 0..1
      const wpm = Number(result?.summary?.wpm ?? 0);

      const normWpm = Math.min(Math.max((wpm - 40) / (140 - 40), 0), 1);
      const composite = Math.round((wordAccuracy * 100) * 0.75 + (normWpm * 100) * 0.25);

      setScore(composite);

      // History, XP, Best score update
      const item = {
        score: composite,
        wpm: Math.round(wpm || 0),
        accuracy: Math.round((wordAccuracy || 0) * 100),
        date: new Date().toISOString(),
        text: tongueTwisters[currentTwister],
      };
      const newHistory = [item, ...history];
      setHistory(newHistory);
      saveHistory(newHistory);

      // XP reward: higher score = more xp
      const earned = Math.max(5, Math.round(composite / 10) * 5); // 5..50 increments
      const newXp = xp + earned;
      setXp(newXp);
      saveXp(newXp);

      if (composite > bestScore) {
        setBestScore(composite);
        try {
          localStorage.setItem("teen_best_score", String(composite));
        } catch {}
        // trigger confetti celebration
        confettiRef.current += 1;
        setShowConfetti(true);
        window.setTimeout(() => setShowConfetti(false), 3800);
      }

      setFeedbackText(result?.feedback_short || (composite >= 75 ? "Nice clarity — push speed!" : "Focus on articulation — slow down a bit."));

      // After a completed round, allow daily claim (if not already claimed today)
      const today = new Date().toISOString().slice(0, 10);
      const dc = loadDailyClaim();
      if (dc.lastDate !== today) {
        // set allowed but not claimed
        setDailyClaim({ claimed: false, lastDate: today });
        saveDailyClaim({ claimed: false, lastDate: today });
      }
    } catch (err) {
      console.error("postScore error:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Scoring failed";
      setError(String(serverMsg));
    } finally {
      setIsScoring(false);
    }
  };

  /* Request feedback from /feedback and play TTS if provided */
  const requestFeedback = async () => {
    setError("");
    if (!scoreResult) {
      setError("Record a round first to get targeted feedback.");
      return;
    }
    setIsFetchingFeedback(true);
    try {
      const body = { scoring_result: scoreResult, age: "teen" };
      const res = await api.post("/feedback", body);
      const data = res.data || {};
      const text = data.text || "Keep practicing!";
      setFeedbackText(text);

      if (data.audio_base64) {
        const wavBlob = base64ToBlob(data.audio_base64, "audio/wav");
        const url = URL.createObjectURL(wavBlob);
        setFeedbackPlaying(true);
        const audio = new Audio(url);
        audio.onended = () => {
          setFeedbackPlaying(false);
          URL.revokeObjectURL(url);
        };
        audio.play().catch((e) => {
          console.warn("Feedback playback error", e);
          setFeedbackPlaying(false);
        });
      }
    } catch (err) {
      console.error("requestFeedback error:", err);
      const serverMsg = err?.response?.data?.message || err?.message || "Feedback failed";
      setError(String(serverMsg));
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const perfLabel = performanceLabel(score);

  /* Circular score gauge calculation */
  const gaugeRadius = 36;
  const gaugeCirc = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = Math.max(0, gaugeCirc - (score / 100) * gaugeCirc);

  /* Level from xp: every 100xp -> next level */
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const xpThisLevel = xp % 100;
  const xpPct = Math.min(100, Math.round((xpThisLevel / 100) * 100));

  /* Claim daily challenge: only allowed after a completed round and not yet claimed today */
  const canClaimDaily = !dailyClaim.claimed && dailyClaim.lastDate && history.length > 0;
  const claimDaily = () => {
    if (!canClaimDaily) return;
    const bonus = 10;
    const newXp = xp + bonus;
    setXp(newXp);
    saveXp(newXp);
    const today = dailyClaim.lastDate || new Date().toISOString().slice(0, 10);
    const obj = { claimed: true, lastDate: today };
    setDailyClaim(obj);
    saveDailyClaim(obj);
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "radial-gradient(1200px 600px at 10% 10%, #F3EFFF 0%, rgba(243,238,255,0) 20%), linear-gradient(180deg, #FBFAFF 0%, #F3F0FF 100%)",
      }}
    >
      {/* Small custom styles for animations (scoped to component) */}
      <style>{`
        @keyframes confetti-float {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(420px) rotate(600deg); opacity: 0; }
        }
        .confetti {
          position: absolute;
          pointer-events: none;
          will-change: transform, opacity;
          font-size: 18px;
          animation: confetti-float 3.2s linear forwards;
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 6px 18px rgba(107,74,136,0.12); }
          50% { box-shadow: 0 12px 30px rgba(107,74,136,0.18); transform: translateY(-2px); }
          100% { box-shadow: 0 6px 18px rgba(107,74,136,0.12); transform: translateY(0); }
        }
        .glowButton { transition: transform .18s ease, box-shadow .18s ease; }
        .glowButton:hover { transform: translateY(-3px); box-shadow: 0 18px 46px rgba(107,74,136,0.12); }
        .smallPulse { animation: glowPulse 2.2s infinite; }

        /* Responsive fixes: Recent rounds cards do not overflow */
        .history-card { min-width: 0; } /* allows truncation inside flex items */
        .history-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 12rem; }

        /* Advanced JSON: wrap cleanly and scroll when necessary */
        details pre {
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 220px;
          overflow: auto;
        }

        /* Pro tips spacing */
        .pro-tips { padding: 14px !important; }

        @media (max-width: 900px) {
          .history-text { max-width: 9rem; white-space: normal; overflow-wrap: anywhere; }
          details pre { max-height: 160px; }
        }
      `}</style>

      {/* Confetti burst (simple emoji-based) */}
      {showConfetti && (
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 60 }}>
          {Array.from({ length: 22 }).map((_, i) => {
            const left = 24 + (i * 7) % 88;
            const delay = (i % 5) * 0.08;
            const emojis = ["🎉", "✨", "🚀", "🔥", "🌟", "💥"];
            const e = emojis[i % emojis.length];
            return (
              <div
                key={`c${confettiRef.current}-${i}`}
                className="confetti"
                style={{
                  left: `${left}%`,
                  top: `6%`,
                  animationDelay: `${delay}s`,
                  transform: `translateY(-6px) rotate(${i * 20}deg)`,
                  fontSize: 18 + (i % 4) * 3,
                }}
              >
                {e}
              </div>
            );
          })}
        </div>
      )}

      {/* Sidebar */}
      <TeenSidebar />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-purple-100">
        <div
          className="max-w-3xl w-full rounded-3xl overflow-hidden shadow-lg border border-[#5d289a]"
        >
          {/* Header */}
          <div className="p-6 text-center relative">
            <div className="absolute top-4 left-4">
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2b1736] tracking-tight">Tongue Twister Challenge</h1>
            <p className="text-sm mt-1 text-[#6b4a88] max-w-2xl mx-auto">
              Quick-fire rounds to sharpen your articulation & speed — gain XP, climb levels, and beat your best.
            </p>

            {/* Top row: level badge, best, attempts */}
<div className="mt-5 flex items-center justify-center gap-4 flex-wrap">
  {/* Level Badge */}
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-tr from-[#fef3d8] via-[#ffedc8] to-[#ffdca8] shadow-md border border-amber-200 group hover:scale-105 transition-transform duration-200">
    <div className="relative">
      <FaCrown className="text-amber-600 text-lg filter drop-shadow-sm" />
      <div className="absolute -inset-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
    </div>
    <div className="text-sm font-bold text-amber-800 tracking-wide">Level {level}</div>
  </div>

  {/* Best Score Badge */}
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-100 group hover:shadow-lg transition-all duration-200">
    <div className="relative">
      <FaTrophy className="text-amber-500 text-lg filter drop-shadow-sm" />
      <div className="absolute -inset-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-10 blur-sm transition-opacity duration-300"></div>
    </div>
    <div className="text-sm font-semibold text-gray-800">
      Best <span className="text-amber-600 font-bold">{bestScore}</span>
    </div>
  </div>

  {/* Attempts Badge */}
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-100 group hover:shadow-lg transition-all duration-200">
    <div className="relative flex items-center justify-center">
      <svg 
        className="w-4 h-4 text-purple-500 filter drop-shadow-sm" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <div className="absolute -inset-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-10 blur-sm transition-opacity duration-300"></div>
    </div>
    <div className="text-sm font-semibold text-gray-800">
      Attempts <span className="text-purple-600 font-bold">{attempts}</span>
    </div>
  </div>
</div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Left column - play area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Twister card */}
              <div className="p-6 rounded-2xl bg-white shadow-md border" style={{ borderColor: "#f0e9fb" }}>
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="text-xs text-[#6b4a88] uppercase tracking-wider mb-2">Your challenge</div>
                    <div className="text-xl md:text-2xl font-semibold text-[#2b1736] leading-tight">
                      {tongueTwisters[currentTwister]}
                    </div>

                    {/* Navigation buttons */}
<div className="mt-4 flex items-center justify-between">
  <div className="text-sm font-medium text-[#3B1E54]">
    Twister <span className="font-semibold">{currentTwister + 1}</span> of <span className="font-semibold">{tongueTwisters.length}</span>
  </div>
  <div className="flex items-center gap-2">
    <button
      onClick={() => {
        setCurrentTwister((p) => (p - 1 + tongueTwisters.length) % tongueTwisters.length);
        setScoreResult(null);
      }}
      className="flex items-center text-xs px-2 py-1 rounded-md bg-white border border-gray-400 text-[#2b1736] hover:bg-gray-100 transition-colors shadow-md"
    >
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Prev
    </button>
    <button
      onClick={() => nextTwister()}
      className="flex items-center text-xs px-2 py-1 rounded-md bg-white border border-gray-400 text-[#2b1736] hover:bg-gray-100 transition-colors shadow-md"
    >
      Next
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</div>
                  </div>

                  {/* Circular score gauge */}
                  <div className="flex-shrink-0 ml-4">
                    <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
                      <defs>
                        <linearGradient id="g1" x1="0" x2="1">
                          <stop offset="0%" stopColor="#ffd36b" />
                          <stop offset="100%" stopColor="#ffb84d" />
                        </linearGradient>
                        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#b78bd5" floodOpacity="0.12" />
                        </filter>
                      </defs>
                      <g transform="translate(48,48)">
                        <circle r={gaugeRadius} fill="#fff" stroke="rgba(60,40,80,0.04)" strokeWidth="8" />
                        <circle
                          r={gaugeRadius}
                          fill="transparent"
                          stroke="rgba(0,0,0,0.06)"
                          strokeWidth="8"
                        />
                        <circle
                          r={gaugeRadius}
                          fill="transparent"
                          stroke="url(#g1)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={gaugeCirc}
                          strokeDashoffset={gaugeOffset}
                          transform="rotate(-90)"
                          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.9,.2,1)" }}
                          filter="url(#soft)"
                        />
                        <text x="0" y="6" textAnchor="middle" fontSize="18" fontWeight="700" fill="#2b1736">{score}</text>
                        <text x="0" y="23" textAnchor="middle" fontSize="10" fill="#6b4a88">score</text>
                      </g>
                    </svg>
                    <div className="text-center text-xs text-gray-500 mt-1">Live</div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-6 text-center">
                  {!isActive && timeLeft === 0 ? (
                    <button
                      onClick={startGame}
                      className="glowButton inline-flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold"
                      style={{ background: "linear-gradient(90deg,#9B7EBD,#6b4a88)", boxShadow: "0 10px 28px rgba(107,74,136,0.12)" }}
                    >
                      <FaPlay /> Start Round
                    </button>
                  ) : isActive ? (
                    <button
                      onClick={stopGame}
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-[#2b1736] font-bold shadow"
                    >
                      <FaStop /> Stop
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-lg font-semibold text-[#2b1736]">Round complete — Score: <span className="text-[#6b4a88]">{score}</span></div>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => startGame()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold"
                          style={{ background: "linear-gradient(90deg,#9B7EBD,#6b4a88)" }}
                        >
                          <FaRedo /> Try Again
                        </button>
                        <button
                          onClick={() => {
                            setScore(0);
                            setScoreResult(null);
                            setLastASR("");
                            setFeedbackText("");
                          }}
                          className="px-3 py-2 rounded-full bg-white text-[#2b1736] font-medium"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recording / loading indicator */}
                <div className="mt-5 flex items-center justify-center gap-4">
                  {recording && <div className="text-sm text-[#6b4a88]">● Recording...</div>}
                  {isScoring && (
                    <div className="inline-flex items-center gap-2 text-sm text-[#6b4a88]">
                      <Spinner size={18} /> Scoring...
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback & metrics */}
              <div className="p-4 rounded-xl bg-white shadow-sm border" style={{ borderColor: "#f0e9fb" }}>
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="text-xs text-gray-500">ASR (what I heard)</div>
                    <div className="text-lg font-semibold text-[#2b1736] mt-1">
                      {isScoring ? (
                        <span className="inline-flex items-center gap-2 text-[#6b4a88]"><Spinner size={16} /> Scoring...</span>
                      ) : lastASR ? `"${lastASR}"` : "No recording yet"}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-400">WPM</div>
                        <div className="text-sm font-semibold text-[#2b1736]">{isScoring ? "—" : Math.round(scoreResult?.summary?.wpm ?? 0) || "—"}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-400">Accuracy</div>
                        <div className="text-sm font-semibold text-[#2b1736]">{isScoring ? "—" : `${Math.round((scoreResult?.summary?.word_accuracy ?? 0) * 100) || 0}%`}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-400">Score</div>
                        <div className="text-sm font-semibold text-[#2b1736]">{score}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ minWidth: 220 }}>
                    <div className="text-xs text-gray-500">XP Progress</div>
                    <div className="mt-2 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div style={{ width: `${xpPct}%`, height: "100%", background: "linear-gradient(90deg,#ffd36b,#ffb84d)", transition: "width 800ms cubic-bezier(.2,.9,.2,1)" }} />
                    </div>
                    <div className="mt-2 text-right text-xs text-gray-500">Level {level} • {xpThisLevel}/100 XP</div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={requestFeedback}
                        disabled={!scoreResult || feedbackPlaying || isScoring || isFetchingFeedback}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-white font-medium"
                        style={{ background: (!scoreResult || isScoring || isFetchingFeedback) ? "linear-gradient(90deg,#ece6f6,#e7def0)" : "linear-gradient(90deg,#9B7EBD,#6b4a88)" }}
                      >
                        {isFetchingFeedback ? <><Spinner size={14} /> Playing</> : feedbackPlaying ? "Playing..." : "Get Feedback"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* short feedback & advanced */}
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="text-sm text-[#2b1736]" style={{ minWidth: 200 }}>
                    {isFetchingFeedback ? <span className="inline-flex items-center gap-2 text-[#6b4a88]"><Spinner size={14} /> Fetching feedback...</span> : isScoring ? <span className="text-[#6b4a88]">Scoring in progress — hang tight!</span> : feedbackText || "Try a round to get targeted feedback."}
                  </div>
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">Advanced</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded max-h-48 overflow-auto text-gray-700" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {scoreResult ? JSON.stringify(scoreResult, null, 2) : "No score data"}
                    </pre>
                  </details>
                </div>

                {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
              </div>

              {/* Round history */}
              <div className="p-4 rounded-xl bg-white/95 border" style={{ borderColor: "#f7eefc" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-[#2b1736]">Recent rounds</div>
                  <div className="text-xs text-gray-500">Last {history.length} rounds</div>
                </div>

                {history.length === 0 ? (
                  <div className="text-sm text-gray-500">No rounds yet — play a round to create a history.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {history.slice(0, 6).map((h, idx) => (
                      <div key={idx} className="p-3 rounded-md bg-gray-50 flex items-center justify-between history-card">
                        <div style={{ minWidth: 0 }}>
                          <div className="text-sm font-semibold text-[#2b1736]">
                            {h.score} pts <span className="text-xs text-gray-400">• {h.wpm} wpm</span>
                          </div>
                          <div className="text-xs text-gray-500">{h.accuracy}% • {new Date(h.date).toLocaleString()}</div>
                          <div className="mt-1 text-xs text-gray-600 history-text" title={h.text}>{h.text}</div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-xs text-gray-400">Level</div>
                          <div className="text-sm font-semibold text-[#6b4a88]">{Math.max(1, Math.floor((h.score || 0) / 20) + 1)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column - supplemental / tips */}
            <aside className="space-y-6">
              {/* Quick status */}
              <div className="p-4 rounded-xl bg-white shadow-sm border" style={{ borderColor: "#f0e9fb" }}>
                <div className="text-xs text-gray-500">Quick status</div>
                <div className="mt-3">
                  <div className="text-sm text-[#2b1736]">Performance: <span className="font-semibold">{perfLabel}</span></div>
                  <div className="text-sm text-gray-500 mt-2">XP: <span className="font-medium text-[#6b4a88]">{xp}</span></div>
                </div>
              </div>

              {/* Tips (more padding) */}
              <div className="pro-tips p-6 rounded-xl bg-white shadow-sm border" style={{ borderColor: "#f0e9fb" }}>
                <h3 className="font-semibold text-[#2b1736] mb-3 flex items-center gap-2"><FaCrown className="text-yellow-500" /> Pro tips</h3>
                <ul className="text-sm text-[#2b1736] list-inside space-y-2">
                  <li>• Warm up with vowels (a e i o u).</li>
                  <li>• Pronounce clearly first, add speed later.</li>
                  <li>• Keep mic ~2–4 cm from mouth — avoid breath noise.</li>
                </ul>
              </div>

              {/* Daily Challenge - claim flow */}
<div className="p-4 rounded-xl bg-gradient-to-br from-[#fff6e6] to-[#fff0df] shadow-sm border" style={{ borderColor: "#fde6b6" }}>
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex-1 min-w-0">
      <div className="text-sm text-[#2b1736] font-semibold">Daily challenge</div>
      <div className="text-xs text-gray-600 mt-1">Complete a round to be eligible — claim reward once</div>
    </div>
    <div className="flex-shrink-0">
      {dailyClaim.claimed ? (
        <div className="px-3 py-2 rounded-full text-sm font-semibold text-center whitespace-nowrap" style={{ background: "linear-gradient(90deg,#dcd2ff,#e8dffe)", color: "#5a3f6b" }}>
          Completed
        </div>
      ) : canClaimDaily ? (
        <button
          onClick={() => claimDaily()}
          className="px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-transform hover:scale-105"
          style={{ background: "linear-gradient(90deg,#ffd36b,#ffb84d)" }}
        >
          Claim +10 XP
        </button>
      ) : (
        <button
          disabled
          title="Play a round to unlock"
          className="px-3 py-2 rounded-full text-sm font-semibold text-gray-500 bg-white/60 whitespace-nowrap"
        >
          Locked
        </button>
      )}
    </div>
  </div>
</div>

              {/* Reset storage */}
              <div className="p-3 text-center">
                <button
                  onClick={() => {
                    if (!window.confirm("Reset XP and history? This cannot be undone.")) return;
                    setXp(0);
                    setHistory([]);
                    saveXp(0);
                    saveHistory([]);
                    setBestScore(0);
                    try { localStorage.removeItem("teen_best_score"); } catch {}
                    setDailyClaim({ claimed: false, lastDate: null });
                    saveDailyClaim({ claimed: false, lastDate: null });
                  }}
                  className="text-xs text-white bg-red-500 hover:bg-red-700 px-2 py-1.5 rounded-md font-medium transition-colors duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  Reset progress
                </button>
              </div>
            </aside>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeenGames;
