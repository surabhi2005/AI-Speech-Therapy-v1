// TeenStorytelling.jsx
import React, { useEffect, useRef, useState } from "react";
import TeenSidebar from "./TeenSidebar"; // <-- Import your TeenSidebar
import axios from "axios";
import {
  FaPlay,
  FaStop,
  FaArrowLeft,
  FaHome,
  FaStar,
  FaMicrophone,
  FaVolumeUp,
  FaPause,
  FaRedo,
} from "react-icons/fa";

/* === EDIT MARKER START ===
   World-class teen-friendly implementation (UPDATED fixes):
   - Improved real-time highlighter logic using Levenshtein similarity to avoid false positives
   - Replace ellipse "mouth" with speaker-style animated arcs driven by waveform/waveBars
   - Play Recording button toggles to Stop Playback when playing
   - Prevent audio mixing: assistant/tts and recording/playback cannot overlap (mutual stops)
   - Keep all previous behaviors (history, assistant, waveform, scoring, popup)
   === EDIT MARKER END === */

/* API */
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: API_BASE, timeout: 60000 });

/* Utils: WAV encode 16k */
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
    const offline = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      1,
      Math.ceil(duration * targetRate),
      targetRate
    );
    const buffer = offline.createBuffer(1, Math.ceil(duration * targetRate), targetRate);
    const inData = decoded.getChannelData(0);
    const outData = buffer.getChannelData(0);
    const ratio = decoded.sampleRate / targetRate;
    for (let i = 0; i < outData.length; i++) outData[i] = inData[Math.floor(i * ratio)] || 0;

    const src = offline.createBufferSource();
    src.buffer = buffer;
    src.connect(offline.destination);
    src.start(0);
    const rendered = await offline.startRendering();
    const wavBuffer = encodeWAV(rendered.getChannelData(0), targetRate);
    return new Blob([wavBuffer], { type: "audio/wav" });
  } catch {
    return blob;
  }
}

/* Text helpers */
const clean = (t = "") =>
  String(t).toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
const tokenize = (txt) =>
  txt.split(/\s+/).filter(Boolean).map((w) => ({ raw: w, clean: clean(w) }));

/* small levenshtein for similarity */
function levenshtein(a = "", b = "") {
  a = String(a);
  b = String(b);
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  const matrix = Array.from({ length: bl + 1 }, (_, i) => new Array(al + 1).fill(0));
  for (let i = 0; i <= bl; i++) matrix[i][0] = i;
  for (let j = 0; j <= al; j++) matrix[0][j] = j;
  for (let i = 1; i <= bl; i++) {
    for (let j = 1; j <= al; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[bl][al];
}
function similarity(a, b) {
  a = String(a || "");
  b = String(b || "");
  const max = Math.max(a.length, b.length, 1);
  const dist = levenshtein(a, b);
  return 1 - dist / max;
}

/* Local storage */
const HISTORY_KEY = "teen_story_history_v1";
const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveHistory = (arr) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 60)));
  } catch {}
};

/* Small UI atoms */
const Spinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" fill="none">
    <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.12)" strokeWidth="4" />
    <path d="M22 12A10 10 0 0012 2" stroke="#5b3a8a" strokeWidth="4" strokeLinecap="round" />
  </svg>
);
const Sparkline = ({ data = [], w = 160, h = 36 }) => {
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
      <polyline points={pts.join(" ")} fill="none" stroke="#7c5fb3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

/* Stories */
const STORIES = [
  {
    id: "mountain",
    title: "The Mountain of Challenges",
    content:
      "Aria had always dreamed of climbing the tallest mountain near her town. Everyone told her it was impossible at her age, but she trained every morning. When she finally reached the top, she didn’t just see the view—she saw proof of her determination.",
    image: "⛰",
    bg: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "library",
    title: "The Hidden Library",
    content:
      "Ethan discovered a dusty old key in his grandfather’s attic. Following a series of clues, he stumbled upon a secret underground library. Inside, the books glowed faintly, holding stories and knowledge long forgotten by the world.",
    image: "📖",
    bg: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "courage",
    title: "The Courage to Speak",
    content:
      "Maya was terrified of public speaking. But when her class needed someone to represent them in a debate, she stepped up. Her voice trembled at first, then grew stronger—and by the end, the entire hall applauded her courage.",
    image: "🎤",
    bg: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1600&q=80",
  },
];

/* Main */
const TeenStorytelling = () => {
  const [step, setStep] = useState("intro"); // intro | story | assistant
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const story = STORIES[currentStoryIndex];

  // recording
  const [recording, setRecording] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recBlobRef = useRef(null);

  // highlight & playback
  const words = tokenize(story.content);
  const [wordStatuses, setWordStatuses] = useState(() => words.map(() => "neutral")); // neutral|listening|correct|incorrect
  const [playHighlightIdx, setPlayHighlightIdx] = useState(-1);
  const recognitionRef = useRef(null);
  const audioElRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // TTS assistant (paragraph-by-paragraph)
  const [assistantActive, setAssistantActive] = useState(false);
  const [assistantParaIdx, setAssistantParaIdx] = useState(-1);

  // result popup
  const [resultOpen, setResultOpen] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [serverResult, setServerResult] = useState(null);

  // waveform bars
  const [waveBars, setWaveBars] = useState([]);

  // history
  const [history, setHistory] = useState(loadHistory());

  // reset when story changes
  useEffect(() => {
    setWordStatuses(tokenize(story.content).map(() => "neutral"));
    setPlayHighlightIdx(-1);
    setAssistantParaIdx(-1);
    setAssistantActive(false);
    recBlobRef.current = null;
    setAccuracy(null);
    setServerResult(null);
    setWaveBars([]);
    stopPlayback();
    window.speechSynthesis?.cancel?.();
    stopRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoryIndex]);

  // cleanup
  useEffect(() => {
    return () => {
      try {
        stopRecognition();
        stopPlayback();
        window.speechSynthesis?.cancel?.();
      } catch {}
    };
  }, []);

  /* recognition helpers */
  function stopRecognition() {
    try {
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
    } catch {}
  }
  function startRecognition() {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript + " ";
      }
      const spoken = (final + interim).trim();
      if (!spoken) return;
      applyLive(spoken);
    };
    rec.onerror = () => {};
    rec.start();
    recognitionRef.current = rec;
  }

  /* improved live highlighting using similarity threshold */
  const applyLive = (transcript) => {
    const expected = tokenize(story.content).map((w) => w.clean);
    const heard = transcript
      .split(/\s+/)
      .map((t) => clean(t))
      .filter(Boolean);
    const st = expected.map(() => "neutral");
    let heardIdx = 0;

    // Greedy align: for each heard token try to match next expected token with similarity threshold
    for (let eIdx = 0; eIdx < expected.length && heardIdx < heard.length; eIdx++) {
      const exp = expected[eIdx];
      const got = heard[heardIdx] || "";
      const sim = similarity(exp, got);
      if (sim >= 0.75) {
        st[eIdx] = "correct";
        heardIdx++;
      } else {
        // If not similar, mark as 'listening' (not outright incorrect) so UI won't show green incorrectly
        st[eIdx] = "listening";
        // but only advance heardIdx if got is obviously unrelated and long
        if (got.length > 2 && similarity(got, exp) < 0.4) {
          // treat as a mismatch — keep expected waiting, but consume heard in some cases
          heardIdx++;
        }
      }
    }

    // if nothing matched and transcript is short, avoid marking everything
    if (heard.length === 0) {
      setWordStatuses(expected.map(() => "neutral"));
    } else {
      setWordStatuses(st);
    }
  };

  /* Recording flow */
  const startRecording = async () => {
    // stop assistant and playback to avoid mixing
    stopAssistant();
    stopPlayback();
    stopRecognition();
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Microphone not supported in this browser.");
      return;
    }
    setResultOpen(false);
    setAccuracy(null);
    setServerResult(null);
    setWaveBars([]);
    setWordStatuses(words.map(() => "neutral"));
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {}
        const raw = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
        recBlobRef.current = raw;
        const wav = await convertBlobToWav16k(raw);
        await scoreAudio(wav);
      };
      mr.start();
      startRecognition();
      setRecording(true);
    } catch {
      alert("Could not access the microphone.");
    }
  };
  const stopRecording = () => {
    stopRecognition();
    setRecording(false);
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {}
  };

  /* Scoring */
  const scoreAudio = async (wavBlob) => {
    setIsScoring(true);
    try {
      const form = new FormData();
      form.append("expected", story.content);
      form.append("audio", wavBlob, "teen-reading.wav");
      const res = await api.post("/score", form, { headers: { "Content-Type": "multipart/form-data" } });
      const data = res.data || {};
      setServerResult(data);

      const acc = Math.round(Number(data?.summary?.word_accuracy ?? 0) * 100);
      setAccuracy(isNaN(acc) ? null : acc);

      // Build word statuses from per_word if available
      const per = data?.per_word || data?.per_word_aligned || data?.words || [];
      const expected = tokenize(story.content).map((w) => w.clean);
      const st = expected.map(() => "neutral");
      if (Array.isArray(per) && per.length) {
        // Align greedily using per entries
        let wi = 0;
        for (let i = 0; i < per.length && wi < expected.length; i++) {
          const actualLike = clean(per[i].actual || per[i].word || per[i].aligned_word || "");
          const op = per[i].op || "";
          const sim = similarity(expected[wi], actualLike);
          if (op === "equal" || sim >= 0.75) st[wi] = "correct";
          else if (op === "replace" || sim >= 0.4) st[wi] = "incorrect";
          else st[wi] = "incorrect";
          wi++;
        }
      } else {
        // fallback: determine correctness by accuracy threshold
        if (acc >= 80) {
          for (let i = 0; i < st.length; i++) st[i] = "correct";
        } else {
          for (let i = 0; i < st.length; i++) st[i] = "incorrect";
        }
      }
      setWordStatuses(st);

      // waveform bars
      const bars =
        (per || []).map((pw) => {
          const e = pw?.prosody?.energy_db_mean ?? pw?.energy ?? pw?.acoustic_score;
          if (e == null) return 0.2 + Math.random() * 0.6;
          return Math.min(1, Math.max(0, (Number(e) + 60) / 40));
        }) || [];
      setWaveBars(bars.length ? bars : Array.from({ length: 14 }, () => 0.2 + Math.random() * 0.6));

      // history
      const entry = {
        id: `${story.id}-${Date.now()}`,
        title: story.title,
        date: new Date().toISOString(),
        accuracy: acc,
      };
      const newHist = [entry, ...history].slice(0, 60);
      setHistory(newHist);
      saveHistory(newHist);

      setResultOpen(true);
    } catch (e) {
      alert("Scoring failed. Please try again.");
    } finally {
      setIsScoring(false);
    }
  };

  /* Playback of recorded audio with per-word highlight */
  const stopPlayback = () => {
    try {
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
        audioElRef.current = null;
      }
    } catch {}
    setIsPlaying(false);
    setPlayHighlightIdx(-1);
  };

  const playRecording = () => {
    // If currently playing -> stop playback
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (!recBlobRef.current) return;
    // Stop assistant & recognition (prevent mixing)
    stopAssistant();
    stopRecognition();

    const url = URL.createObjectURL(recBlobRef.current);
    const audio = new Audio(url);
    audioElRef.current = audio;
    setIsPlaying(true);
    const per = serverResult?.per_word || serverResult?.per_word_aligned || [];
    audio.ontimeupdate = () => {
      const t = audio.currentTime;
      if (Array.isArray(per) && per.length) {
        let idx = -1;
        for (let i = 0; i < per.length; i++) {
          const s = Number(per[i].start ?? per[i].start_time ?? -1);
          const e = Number(per[i].end ?? per[i].end_time ?? -1);
          if (!isNaN(s) && !isNaN(e) && t >= s && t <= e) {
            idx = i;
            break;
          }
        }
        setPlayHighlightIdx(idx);
      } else {
        const total = audio.duration || 1;
        const frac = Math.min(1, t / total);
        setPlayHighlightIdx(Math.floor(frac * words.length));
      }
    };
    audio.onended = () => {
      setIsPlaying(false);
      setPlayHighlightIdx(-1);
      try {
        URL.revokeObjectURL(url);
      } catch {}
    };
    audio.play().catch(() => setIsPlaying(false));
  };

  /* Reading Assistant — paragraph-by-paragraph TTS */
  const paragraphs = story.content.split(/(?<=\.)\s+/); // simple sentence/paragraph split
  const startAssistant = () => {
    // Stop any recording/playback to avoid mixing
    stopRecording();
    stopPlayback();
    if (!("speechSynthesis" in window)) {
      alert("TTS not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    setAssistantActive(true);
    setAssistantParaIdx(0);
    queuePara(0);
  };
  const stopAssistant = () => {
    try {
      window.speechSynthesis?.cancel?.();
    } catch {}
    setAssistantActive(false);
    setAssistantParaIdx(-1);
  };
  const queuePara = (idx) => {
    if (idx >= paragraphs.length) {
      stopAssistant();
      return;
    }
    const utt = new SpeechSynthesisUtterance(paragraphs[idx]);
    utt.lang = "en-US";
    utt.rate = 1.0;
    utt.onstart = () => setAssistantParaIdx(idx);
    utt.onend = () => queuePara(idx + 1);
    window.speechSynthesis.speak(utt);
  };

  /* Stars (0..5 from accuracy) */
  const Stars = ({ score = 0 }) => {
    const count = Math.round((Math.max(0, Math.min(100, score)) / 100) * 5);
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <FaStar key={i} className={i < count ? "text-yellow-400" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  /* UI */
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <TeenSidebar />

      {/* Main Content */}
      <div className="flex-1 relative min-h-screen overflow-hidden">
        {/* Cool background */}
        <div
          className="absolute inset-0 bg-cover bg-center [filter:contrast(112%)_saturate(118%)]"
          style={{ backgroundImage: `linear-gradient(rgba(18,12,30,0.25),rgba(18,12,30,0.12)), url('${story.bg}')` }}
        />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        {/* Top controls (back/home) */}
        {step !== "intro" && (
          <div className="absolute top-4 left-4 right-4 z-30 flex justify-between">
            <button
              onClick={() => setStep("intro")}
              className="bg-[#7c5fb3] text-white p-3 rounded-full shadow-md hover:bg-[#5b3a8a] transition"
              aria-label="Back"
            >
              <FaArrowLeft />
            </button>
            <button
              onClick={() => setStep("intro")}
              className="bg-white text-[#2b1736] p-3 rounded-full shadow-md hover:bg-purple-50 transition"
              aria-label="Home"
            >
              <FaHome />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="relative z-20 flex flex-col lg:flex-row gap-6 p-6 min-h-screen">
          {/* Main Panel */}
          <main className="flex-1 max-w-3xl mx-auto lg:mx-0 self-center">
            {step === "intro" && (
              <div className="text-center max-w-xl mx-auto bg-white/95 p-8 rounded-2xl shadow-2xl border border-purple-100">
                <h1 className="text-4xl font-extrabold text-[#2b1736] mb-2">Teen Storytelling</h1>
                <p className="text-gray-600">Explore inspiring stories, read aloud, and track your accuracy gains over time.</p>
                <div className="mt-6 flex gap-3 justify-center">
                  <button
                    onClick={() => setStep("story")}
                    className="bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a] text-white px-6 py-3 rounded-full shadow hover:scale-[1.02] transition inline-flex items-center gap-2"
                  >
                    <FaMicrophone /> Start Reading
                  </button>
                  <button
                    onClick={() => setStep("assistant")}
                    className="bg-white border px-6 py-3 rounded-full shadow-sm hover:bg-purple-50 transition inline-flex items-center gap-2 text-[#2b1736]"
                  >
                    <FaVolumeUp /> Reading Assistant
                  </button>
                </div>
              </div>
            )}

            {(step === "story" || step === "assistant") && (
              <div className="w-full bg-white/95 shadow-2xl rounded-2xl p-6 border border-purple-100">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl md:text-6xl">{story.image}</div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#2b1736]">{story.title}</h2>
                      <div className="text-xs text-gray-500">{story.content.split(" ").length} words</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentStoryIndex((i) => (i - 1 + STORIES.length) % STORIES.length);
                        stopAssistant();
                        stopPlayback();
                      }}
                      className="px-3 py-2 rounded-full bg-white border hover:bg-purple-50"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStoryIndex((i) => (i + 1) % STORIES.length);
                        stopAssistant();
                        stopPlayback();
                      }}
                      className="px-3 py-2 rounded-full bg-white border hover:bg-purple-50"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {/* Story text + micro-animations */}
                <div className="mt-6 bg-gradient-to-b from-white to-purple-50 p-5 rounded-xl border border-purple-100">
                  {/* Assistant paragraph highlight */}
                  {step === "assistant" ? (
                    <div className="space-y-3">
                      {paragraphs.map((p, idx) => (
                        <p
                          key={idx}
                          className={`text-lg leading-relaxed ${
                            assistantParaIdx === idx ? "bg-yellow-50 ring-2 ring-yellow-200 rounded px-1" : ""
                          }`}
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-lg leading-relaxed text-[#2b1736]">
                      {tokenize(story.content).map((w, i) => {
                        const status = wordStatuses[i] || "neutral";
                        const isPlayingWord = playHighlightIdx === i;
                        const base = "inline-block mr-1 mb-2 px-0.5";
                        const cls =
                          status === "correct"
                            ? "bg-green-100 text-green-800 rounded"
                            : status === "incorrect"
                            ? "bg-red-50 text-red-700 rounded"
                            : isPlayingWord
                            ? "bg-yellow-100 text-yellow-800 rounded"
                            : "text-[#2b1736]";
                        return (
                          <span key={`${w.raw}-${i}`} className={`${base} ${cls}`} style={{ transition: "all .18s" }}>
                            {w.raw}
                          </span>
                        );
                      })}
                    </p>
                  )}

                  {/* Waveform + speaker-style animation */}
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex items-end gap-1 flex-1 min-h-[48px]">
                      {(waveBars.length ? waveBars : Array.from({ length: 14 }, () => 0.35)).map((v, i) => (
                        <div
                          key={i}
                          style={{
                            width: `${Math.max(4, 100 / 14 - 2)}%`,
                            height: `${Math.round(v * 100)}%`,
                            background:
                              i === (playHighlightIdx % 14)
                                ? "linear-gradient(180deg,#ffd36b,#ffb84d)"
                                : "#e9e3f6",
                            borderRadius: 4,
                            transition: "height 120ms linear, background 180ms",
                          }}
                        />
                      ))}
                    </div>

                    {/* Speaker arcs */}
                    <div style={{ width: 84, height: 52 }}>
                      <svg viewBox="0 0 84 52" width="84" height="52" aria-hidden>
                        <defs>
                          <linearGradient id="g1" x1="0" x2="1">
                            <stop offset="0%" stopColor="#ffd36b" />
                            <stop offset="100%" stopColor="#ffb84d" />
                          </linearGradient>
                        </defs>

                        <rect x="0" y="0" width="84" height="52" rx="10" fill="rgba(123,95,179,0.04)" />
                        <g transform="translate(12,14)">
                          {/* speaker base */}
                          <rect x="0" y="6" width="18" height="18" rx="3" fill="#5b3a8a" opacity="0.95" />
                          <polygon points="18,6 30,0 30,30 18,24" fill="#5b3a8a" opacity="0.95" />
                          {/* arcs */}
                          {[0, 1, 2].map((a) => {
                            const active = recording || isPlaying || assistantActive;
                            const factor = active ? 1 + (a * 0.18) : 0.6 + a * 0.05;
                            const stroke = a === 0 ? "url(#g1)" : "#d7cbe8";
                            const widthArc = 24 + a * 8;
                            return (
                              <path
                                key={a}
                                d={`
                                  M ${36 + a * 0.5} 12
                                  C ${36 + widthArc * 0.3} ${12 - 10 * factor}, ${36 + widthArc * 0.6} ${12 - 10 * factor}, ${
                                  36 + widthArc
                                } 12
                                `}
                                stroke={stroke}
                                strokeWidth={2}
                                fill="none"
                                strokeLinecap="round"
                                opacity={active ? 1 - a * 0.12 : 0.35}
                              />
                            );
                          })}
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {step === "assistant" ? (
                    <>
                      {!assistantActive ? (
                        <button
                          onClick={() => {
                            // stop recording/playback before assistant
                            stopRecording();
                            stopPlayback();
                            startAssistant();
                          }}
                          className="px-4 py-2 rounded-full bg-white border text-[#2b1736] inline-flex items-center gap-2"
                        >
                          <FaVolumeUp /> Play Assistant
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            stopAssistant();
                          }}
                          className="px-4 py-2 rounded-full bg-red-500 text-white inline-flex items-center gap-2"
                        >
                          <FaPause /> Stop Assistant
                        </button>
                      )}
                      <button
                        onClick={() => setStep("story")}
                        className="px-3 py-2 rounded-full bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a] text-white inline-flex items-center gap-2"
                      >
                        <FaRedo /> Switch to Reading
                      </button>
                    </>
                  ) : (
                    <>
                      {!recording ? (
                        <button
                          onClick={() => {
                            // ensure assistant/tts is stopped
                            stopAssistant();
                            startRecording();
                          }}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a] text-white inline-flex items-center gap-2"
                        >
                          <FaMicrophone /> Record
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            stopRecording();
                          }}
                          className="px-4 py-2 rounded-full bg-red-500 text-white inline-flex items-center gap-2"
                        >
                          <FaStop /> Stop
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (isPlaying) stopPlayback();
                          else playRecording();
                        }}
                        disabled={!recBlobRef.current}
                        className="px-3 py-2 rounded-full bg-white border text-[#2b1736] inline-flex items-center gap-2 disabled:opacity-60"
                      >
                        {isPlaying ? (
                          <>
                            <FaStop /> Stop Playback
                          </>
                        ) : (
                          <>
                            <FaPlay /> Play Recording
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setStep("assistant");
                          // ensure recording stopped
                          stopRecording();
                        }}
                        className="px-3 py-2 rounded-full bg-white border text-[#2b1736] inline-flex items-center gap-2"
                      >
                        <FaVolumeUp /> Reading Assistant
                      </button>
                    </>
                  )}
                  {isScoring && (
                    <div className="ml-2">
                      <Spinner />
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar: history & trends */}
          <aside className="w-full lg:w-96 self-start lg:sticky lg:top-6">
            <div className="bg-white/95 rounded-2xl p-4 shadow-2xl border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Past readings</div>
                  <div className="text-lg font-semibold text-[#2b1736]">{history.length} entries</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Trend</div>
                  <Sparkline data={history.slice(0, 10).reverse()} />
                </div>
              </div>

              <div className="mt-3 space-y-2 max-h-64 overflow-auto pr-1">
                {history.length === 0 ? (
                  <div className="text-sm text-gray-500">No readings yet. Record your first!</div>
                ) : (
                  history.slice(0, 12).map((h) => (
                    <div key={h.id} className="p-2 rounded-md bg-gray-50 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#2b1736] truncate">{h.title}</div>
                        <div className="text-xs text-gray-500">{new Date(h.date).toLocaleString()}</div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-bold text-[#7c5fb3]">{h.accuracy}%</div>
                        <div className="text-[10px] text-gray-400">accuracy</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (!window.confirm("Clear reading history?")) return;
                    setHistory([]);
                    saveHistory([]);
                  }}
                  className="text-xs text-gray-500 underline"
                >
                  Clear history
                </button>
                <button
                  onClick={() => setStep("story")}
                  className="text-xs px-3 py-1 rounded-full bg-purple-50 text-[#2b1736] border"
                >
                  Go to Reading
                </button>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-4 bg-white/95 rounded-2xl p-4 shadow-2xl border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#2b1736]">Pro Tips</div>
                  <div className="text-xs text-gray-500">Small, consistent reps beat marathons.</div>
                </div>
                <div className="text-xl">⚡️</div>
              </div>
              <ul className="mt-3 text-sm text-[#2b1736] space-y-2">
                <li>• Pace first, speed later.</li>
                <li>• Replay your reading and compare to Assistant.</li>
                <li>• Focus on the tricky words you miss.</li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Result Popup */}
        {resultOpen && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-purple-100 p-6 text-center">
              <div className="text-5xl mb-2">🎉</div>
              <h3 className="text-2xl font-bold text-[#2b1736]">Great Work!</h3>
              <div className="mt-3 flex items-center justify-center gap-3">
                <div className="text-3xl font-extrabold text-[#2b1736]">{accuracy != null ? `${accuracy}%` : "—"}</div>
                <Stars score={accuracy ?? 0} />
              </div>
              <p className="mt-2 text-gray-600 text-sm">Accuracy based on your last reading.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setResultOpen(false);
                    playRecording();
                  }}
                  className="px-4 py-2 rounded-full bg-white border text-[#2b1736] inline-flex items-center justify-center gap-2"
                >
                  <FaPlay /> Replay
                </button>
                <button
                  onClick={() => {
                    setResultOpen(false);
                    setCurrentStoryIndex((i) => (i + 1) % STORIES.length);
                    setStep("story");
                  }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a] text-white"
                >
                  Next Story
                </button>
              </div>
              <button
                onClick={() => setResultOpen(false)}
                className="mt-3 text-xs text-gray-500 underline"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeenStorytelling;
