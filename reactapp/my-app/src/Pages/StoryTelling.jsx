// Storytelling.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaPlay, FaStop, FaArrowLeft, FaHome, FaStar, FaVolumeUp, FaMicrophone } from "react-icons/fa";
import KidsSidebar from "./KidsSidebar";
import axios from "axios";

/* === EDIT MARKER START ===
   Converged with TeenStorytelling:
   - Improved real-time highlighting (similarity + listening state)
   - Speaker-style SVG animation + waveform bars
   - Mutual exclusion for recording / assistant playback to avoid audio mixing
   - Play/Stop toggle for recordings
   - Local history and sparkline trend
   - Collapsible advanced JSON
   - Kid-friendly but consistent UX with TeenStorytelling logic
   === EDIT MARKER END === */

/* API setup */
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: API_BASE, timeout: 60000 });

/* Audio conversion helpers (WAV 16k) */
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
    console.warn("convertBlobToWav16k failed:", err);
    return blob;
  }
}

/* Text helpers */
function normalizeText(t = "") {
  return String(t || "").toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
}
function splitToWords(txt) {
  const words = txt.split(/\s+/).filter(Boolean);
  return words.map((w) => ({ raw: w, clean: normalizeText(w) }));
}

/* Simple levenshtein & similarity to avoid false positives */
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
function similarity(a = "", b = "") {
  a = String(a);
  b = String(b);
  const max = Math.max(a.length, b.length, 1);
  const dist = levenshtein(a, b);
  return 1 - dist / max;
}

/* Local storage keys */
const HISTORY_KEY = "kids_story_history_v1";
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
  <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.12)" strokeWidth="4" />
    <path d="M22 12A10 10 0 0012 2" stroke="#6b4a88" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const Sparkline = ({ data = [], w = 140, h = 36 }) => {
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

/* Stories (kid-friendly) */
const STORIES = [
  {
    id: "brave-rabbit",
    title: "The Brave Little Rabbit",
    content:
      "Once upon a time, a little rabbit lived in a big forest. He found a shiny golden carrot. To eat it, he had to be brave and cross a dark cave.",
    image: "🐰",
    bg: "https://i.pinimg.com/1200x/a4/bb/b9/a4bbb9546fdd8658b458fd054bbcda96.jpg",
  },
  {
    id: "lost-kitten",
    title: "The Lost Kitten",
    content:
      "Mittens was a fluffy gray kitten who loved to explore. One day, she wandered too far from home. A friendly butterfly helped her find the way back.",
    image: "🐱",
    bg: "https://i.pinimg.com/1200x/a4/bb/b9/a4bbb9546fdd8658b458fd054bbcda96.jpg",
  },
  {
    id: "happy-turtle",
    title: "The Happy Turtle",
    content:
      "Timmy the turtle dreamed of exploring the ocean. He met colorful fish and playful dolphins. A wise old whale taught him about the deep blue sea.",
    image: "🐢",
    bg: "https://i.pinimg.com/1200x/a4/bb/b9/a4bbb9546fdd8658b458fd054bbcda96.jpg",
  },
];

/* Main component */
export default function Storytelling() {
  const [step, setStep] = useState("intro"); // intro | story | assistant
  const [currentIdx, setCurrentIdx] = useState(0);
  const story = STORIES[currentIdx];

  // recording & playback refs/states
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordedBlobRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const recognitionRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  // highlighting & waveform
  const words = splitToWords(story.content);
  const [wordStatuses, setWordStatuses] = useState(() => words.map(() => "neutral")); // neutral|listening|correct|incorrect
  const [playHighlightIdx, setPlayHighlightIdx] = useState(-1);
  const [waveBars, setWaveBars] = useState([]);

  // scoring & history
  const [scoreResult, setScoreResult] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [history, setHistory] = useState(() => loadHistory());

  // result popup
  const [resultOpen, setResultOpen] = useState(false);

  // reset on story change
  useEffect(() => {
    setWordStatuses(splitToWords(story.content).map(() => "neutral"));
    setPlayHighlightIdx(-1);
    setScoreResult(null);
    setAccuracy(null);
    recordedBlobRef.current = null;
    setWaveBars([]);
    stopAllAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // cleanup
  useEffect(() => {
    return () => {
      try {
        stopAllAudio();
        stopRecognition();
      } catch {}
    };
  }, []);

  /* Recognition (best-effort): webkitSpeechRecognition or SpeechRecognition */
  function startRecognitionLive() {
    stopRecognition();
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return null;
    const rec = new Rec();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript + " ";
      }
      const combined = (final + interim).trim();
      if (!combined) return;
      applyLiveHighlight(combined);
    };
    rec.onerror = () => {};
    rec.onend = () => {
      // nothing — controlled by stopRecording
    };
    rec.start();
    recognitionRef.current = rec;
    return rec;
  }

  function stopRecognition() {
    try {
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
    } catch {}
  }

  /* improved live highlight to avoid false green:
     - greedily align heard tokens to expected words using similarity
     - mark words as 'correct' when sim >= 0.75
     - otherwise mark 'listening' (not 'incorrect') so UI won't turn everything green prematurely
  */
  function applyLiveHighlight(transcript) {
    const heard = transcript
      .split(/\s+/)
      .map((t) => normalizeText(t))
      .filter(Boolean);
    const expected = splitToWords(story.content).map((w) => w.clean);
    const statuses = expected.map(() => "neutral");
    let hIdx = 0;
    for (let i = 0; i < expected.length && hIdx < heard.length; i++) {
      const exp = expected[i];
      const got = heard[hIdx];
      const sim = similarity(exp, got);
      if (sim >= 0.75) {
        statuses[i] = "correct";
        hIdx++;
      } else {
        statuses[i] = "listening";
        // sometimes consume short tokens
        if (got.length > 2 && similarity(got, exp) < 0.4) hIdx++;
      }
    }
    setWordStatuses(statuses);
  }

  /* Recording flow */
  async function startRecording() {
    // Ensure assistant TTS and playback are stopped to avoid mixing
    stopAssistant();
    stopPlayback();

    setScoreResult(null);
    setAccuracy(null);
    setWaveBars([]);
    setWordStatuses(splitToWords(story.content).map(() => "neutral"));
    chunksRef.current = [];

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Microphone not supported in this browser.");
      return;
    }
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
        const rawBlob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
        recordedBlobRef.current = rawBlob;
        const wav = await convertBlobToWav16k(rawBlob);
        await postScore(wav);
      };
      mr.start();
      startRecognitionLive();
      setIsRecording(true);
    } catch (err) {
      console.error("startRecording error", err);
      alert("Could not access microphone. Check permissions.");
    }
  }

  function stopRecording() {
    try {
      stopRecognition();
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    } catch (err) {
      console.warn("stopRecording", err);
      setIsRecording(false);
    }
  }

  /* Post to backend /score and process result */
  async function postScore(wavBlob) {
    setIsScoring(true);
    setScoreResult(null);
    setAccuracy(null);
    try {
      const form = new FormData();
      form.append("expected", story.content);
      form.append("audio", wavBlob, "reading.wav");
      const res = await api.post("/score", form, { headers: { "Content-Type": "multipart/form-data" } });
      const result = res.data || {};
      setScoreResult(result);

      const acc = Math.round(Number(result?.summary?.word_accuracy ?? 0) * 100);
      setAccuracy(isNaN(acc) ? null : acc);

      // Build word statuses from per_word if available
      const per = result?.per_word || result?.per_word_aligned || result?.words || [];
      const expectedClean = splitToWords(story.content).map((w) => w.clean);
      const statuses = expectedClean.map(() => "neutral");
      if (Array.isArray(per) && per.length) {
        let wi = 0;
        for (let i = 0; i < per.length && wi < expectedClean.length; i++) {
          const item = per[i];
          const actual = normalizeText(item.actual || item.word || item.aligned_word || "");
          const op = item.op || "";
          const sim = similarity(expectedClean[wi], actual);
          if (op === "equal" || sim >= 0.75) statuses[wi] = "correct";
          else if (sim >= 0.4) statuses[wi] = "incorrect";
          else statuses[wi] = "incorrect";
          wi++;
        }
      } else {
        // fallback: mark according to overall accuracy threshold
        if (acc >= 75) {
          for (let i = 0; i < statuses.length; i++) statuses[i] = "correct";
        } else {
          for (let i = 0; i < statuses.length; i++) statuses[i] = "incorrect";
        }
      }
      setWordStatuses(statuses);

      // waveform from prosody/energy if available
      const bars = (per || []).map((pw) => {
        const energy = pw?.prosody?.energy_db_mean ?? pw?.energy ?? pw?.acoustic_score ?? null;
        if (energy == null) return Math.min(1, 0.2 + Math.random() * 0.6);
        return Math.min(1, Math.max(0, (Number(energy) + 60) / 40));
      });
      setWaveBars(bars.length ? bars : Array.from({ length: 12 }, () => 0.2 + Math.random() * 0.6));

      // add to history
      const entry = {
        id: `${story.id}-${Date.now()}`,
        title: story.title,
        date: new Date().toISOString(),
        accuracy: Math.round(Number(result?.summary?.word_accuracy ?? 0) * 100),
      };
      const newHist = [entry, ...history].slice(0, 60);
      setHistory(newHist);
      saveHistory(newHist);

      // show result popup briefly
      setResultOpen(true);
    } catch (err) {
      console.error("postScore error", err);
      alert("Scoring failed. Try again.");
    } finally {
      setIsScoring(false);
    }
  }

  /* Playback recorded audio synced with per-word timestamps if available */
  function stopPlayback() {
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current = null;
      }
    } catch {}
    setIsPlaying(false);
    setPlayHighlightIdx(-1);
  }

  function playRecording() {
    if (!recordedBlobRef.current) return;
    // If playing -> stop
    if (isPlaying) {
      stopPlayback();
      return;
    }
    // Stop other audio sources
    stopAssistant();
    stopRecognition();
    setPlayHighlightIdx(-1);

    const url = URL.createObjectURL(recordedBlobRef.current);
    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setIsPlaying(true);

    const per = scoreResult?.per_word || scoreResult?.per_word_aligned || [];
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

    audio.play().catch((e) => {
      console.warn("Playback error", e);
      setIsPlaying(false);
    });
  }

  /* TTS assistant (paragraph highlighting using onboundary where supported) */
  const paragraphs = story.content.split(/(?<=\.)\s+/);
  function startAssistant() {
    // stop recording / playback to avoid mixing
    stopRecording();
    stopPlayback();
    if (!("speechSynthesis" in window)) {
      alert("TTS not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    setIsTTSPlaying(true);
    setPlayHighlightIdx(-1);
    // speak paragraph-by-paragraph
    const speakPara = (idx) => {
      if (idx >= paragraphs.length) {
        setIsTTSPlaying(false);
        setPlayHighlightIdx(-1);
        return;
      }
      const utt = new SpeechSynthesisUtterance(paragraphs[idx]);
      utt.lang = "en-US";
      utt.rate = 1.0;
      // char->word mapping
      const cumul = [];
      let acc = 0;
      const allWords = splitToWords(paragraphs[idx]);
      allWords.forEach((w) => {
        cumul.push({ start: acc, end: acc + w.raw.length - 1 });
        acc += w.raw.length + 1;
      });
      utt.onboundary = (ev) => {
        const ci = ev.charIndex ?? null;
        if (ci != null) {
          // approximate location in whole story: we will highlight within whole text by searching word index
          // For kids simplicity, map by fraction
          const frac = ci / (paragraphs[idx].length || 1);
          const globalIdx = Math.floor(frac * words.length);
          setPlayHighlightIdx(globalIdx);
        }
      };
      utt.onend = () => speakPara(idx + 1);
      window.speechSynthesis.speak(utt);
    };
    speakPara(0);
  }

  function stopAssistant() {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setIsTTSPlaying(false);
    setPlayHighlightIdx(-1);
  }

  /* Utility: small star component */
  const Stars = ({ value = 0 }) => {
    const count = Math.round((Math.max(0, Math.min(100, value)) / 100) * 5);
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <FaStar key={i} className={i < count ? "text-yellow-400" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  /* Stop everything helper */
  function stopAllAudio() {
    stopRecording();
    stopPlayback();
    stopAssistant();
  }

  /* Render */
  return (
    <div className="flex min-h-screen">
      <KidsSidebar />

      <div className="flex-1 relative min-h-screen overflow-hidden">
        {/* background */}
        <div
          className="absolute inset-0 bg-cover bg-center [filter:contrast(110%)_saturate(115%)]"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.02)), url("${story.bg}")` }}
        />

        <div className="relative z-20 p-6 flex flex-col lg:flex-row gap-6 min-h-screen">
          {/* main */}
          <main className="flex-1 max-w-3xl mx-auto lg:mx-0">
            {step === "intro" && (
              <div className="bg-white/95 rounded-2xl p-8 shadow-lg border border-purple-100 text-center max-w-xl mx-auto">
                <h1 className="text-4xl font-extrabold text-[#3B1E54]">Story Time!</h1>
                <p className="mt-2 text-gray-600">Listen, read aloud, and see how your reading improves.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setStep("story")}
                    className="bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a] text-white px-6 py-3 rounded-full shadow hover:scale-[1.02] transition inline-flex items-center gap-2"
                  >
                    <FaPlay /> Start Reading
                  </button>
                  <button
                    onClick={() => {
                      setStep("assistant");
                      startAssistant();
                    }}
                    className="px-5 py-3 rounded-full bg-white border shadow inline-flex items-center gap-2 text-[#3B1E54]"
                  >
                    <FaVolumeUp /> Listening Assistant
                  </button>
                </div>
              </div>
            )}

            {(step === "story" || step === "assistant") && (
              <div className="bg-white/95 rounded-2xl p-6 shadow-lg border border-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{story.image}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#3B1E54]">{story.title}</h2>
                      <div className="text-xs text-gray-500">{story.content.split(" ").length} words</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentIdx((i) => (i - 1 + STORIES.length) % STORIES.length);
                        stopAllAudio();
                      }}
                      className="px-2 py-1 rounded-full bg-white border"
                      aria-label="Prev"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => {
                        setCurrentIdx((i) => (i + 1) % STORIES.length);
                        stopAllAudio();
                      }}
                      className="px-2 py-1 rounded-full bg-white border"
                      aria-label="Next"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                <div className="mt-6 bg-gradient-to-b from-white to-[#f8f6ff] p-5 rounded-xl border border-purple-50">
                  {/* Story text highlighting */}
                  <p className="text-lg leading-relaxed text-[#3B1E54]">
                    {splitToWords(story.content).map((w, i) => {
                      const status = wordStatuses[i] || "neutral";
                      const playing = playHighlightIdx === i;
                      const base = "inline-block mr-1 mb-2 px-0.5";
                      const cls =
                        status === "correct"
                          ? "bg-green-100 text-green-800 rounded"
                          : status === "incorrect"
                          ? "bg-red-100 text-red-700 rounded"
                          : playing
                          ? "bg-yellow-100 text-yellow-800 rounded"
                          : "text-[#3B1E54]";
                      return (
                        <span key={`${w.raw}-${i}`} className={`${base} ${cls}`} style={{ transition: "all .18s" }}>
                          {w.raw}
                        </span>
                      );
                    })}
                  </p>

                  {/* waveform and speaker arcs */}
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex items-end gap-1 flex-1 min-h-[48px]">
                      {(waveBars.length ? waveBars : Array.from({ length: 12 }, (_, i) => 0.25 + (i % 3) * 0.12)).map((v, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: `${Math.max(4, 100 / (waveBars.length || 12) - 2)}%`,
                            height: `${Math.round(v * 100)}%`,
                            background: idx === playHighlightIdx ? "linear-gradient(180deg,#ffd36b,#ffb84d)" : "#e6dff0",
                            borderRadius: 4,
                            transition: "height 120ms linear, background 200ms",
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ width: 84, height: 52 }}>
                      <svg viewBox="0 0 84 52" width="84" height="52" aria-hidden>
                        <defs>
                          <linearGradient id="kidG" x1="0" x2="1">
                            <stop offset="0%" stopColor="#ffd36b" />
                            <stop offset="100%" stopColor="#ffb84d" />
                          </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="84" height="52" rx="10" fill="rgba(255,255,255,0.6)" />
                        <g transform="translate(12,14)">
                          <rect x="0" y="6" width="18" height="18" rx="3" fill="#9B7EBD" opacity="0.95" />
                          <polygon points="18,6 30,0 30,30 18,24" fill="#9B7EBD" opacity="0.95" />
                          {[0, 1, 2].map((a) => {
                            const active = isRecording || isPlaying || isTTSPlaying;
                            const factor = active ? 1 + a * 0.12 : 0.6 + a * 0.05;
                            const stroke = a === 0 ? "url(#kidG)" : "#d7cbe8";
                            const widthArc = 24 + a * 8;
                            return (
                              <path
                                key={a}
                                d={`
                                  M ${36 + a * 0.5} 12
                                  C ${36 + widthArc * 0.3} ${12 - 8 * factor}, ${36 + widthArc * 0.6} ${12 - 8 * factor}, ${
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

                    <div className="flex gap-2">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="text-sm font-semibold text-[#9B7EBD]">
                        {isRecording ? "Recording" : isPlaying ? "Playing" : isTTSPlaying ? "Assistant" : "Idle"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* controls */}
                <div className="mt-5 flex gap-3 flex-wrap items-center">
                  {!isRecording ? (
                    <button
                      onClick={() => {
                        stopAssistant();
                        stopPlayback();
                        startRecording();
                      }}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a] text-white inline-flex items-center gap-2"
                    >
                      <FaMicrophone /> Record
                    </button>
                  ) : (
                    <button
                      onClick={() => stopRecording()}
                      className="px-4 py-2 rounded-full bg-red-500 text-white inline-flex items-center gap-2"
                    >
                      <FaStop /> Stop
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!recordedBlobRef.current) return;
                      playRecording();
                    }}
                    disabled={!recordedBlobRef.current}
                    className="px-3 py-2 rounded-full bg-white border text-[#3B1E54] inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    {isPlaying ? <><FaStop /> Stop</> : <><FaPlay /> Play Recording</>}
                  </button>

                  <button
                    onClick={() => {
                      stopRecording();
                      stopPlayback();
                      startAssistant();
                      setStep("assistant");
                    }}
                    className="px-3 py-2 rounded-full bg-white border text-[#3B1E54] inline-flex items-center gap-2"
                  >
                    <FaVolumeUp /> Reading Assistant
                  </button>

                  {isScoring && <div className="ml-2"><Spinner /></div>}
                </div>

                {/* scoring display */}
                <div className="mt-4 flex items-center gap-4 justify-between flex-wrap">
                  <div>
                    <div className="text-xs text-gray-500">Latest Accuracy</div>
                    <div className="text-lg font-bold text-[#3B1E54]">{accuracy != null ? `${accuracy}%` : "—"}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500">Quick rating</div>
                    <div><Stars value={accuracy ?? 0} /></div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-500">History</div>
                    <div className="text-sm text-[#9B7EBD]">{history.length} readings</div>
                  </div>
                </div>

                <div className="mt-4">
                  <details>
                    <summary className="cursor-pointer text-xs text-gray-500">Advanced (raw server result)</summary>
                    <pre style={{ whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto", background: "#fbfbff", padding: 8, marginTop: 8, borderRadius: 6 }}>
                      {scoreResult ? JSON.stringify(scoreResult, null, 2) : "No server result yet."}
                    </pre>
                  </details>
                </div>
              </div>
            )}

            {/* result popup */}
            {resultOpen && (
              <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
                <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-2xl font-bold text-[#3B1E54]">Nice reading!</h3>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <div className="text-3xl font-extrabold text-[#3B1E54]">{accuracy != null ? `${accuracy}%` : "—"}</div>
                    <Stars value={accuracy ?? 0} />
                  </div>
                  <p className="mt-2 text-gray-600 text-sm">Your accuracy from the last round.</p>
                  <div className= "mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setResultOpen(false);
                        if (recordedBlobRef.current) playRecording();
                      }}
                      className="px-4 py-2 rounded-full bg-white border text-[#2b1736] inline-flex items-center justify-center gap-2"
                    >
                      <FaPlay /> Replay
                    </button>
                    <button
                      onClick={() => {
                        setResultOpen(false);
                        setCurrentIdx((i) => (i + 1) % STORIES.length);
                        setStep("story");
                      }}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7c5fb3] to-[#5b3a8a] text-white"
                    >
                      Next Story
                    </button>
                  </div>
                  <button onClick={() => setResultOpen(false)} className="mt-3 text-xs text-gray-500 underline">Close</button>
                </div>
              </div>
            )}
          </main>

          {/* right sidebar */}
          <aside className="w-full lg:w-96 self-start">
            <div className="bg-white/95 rounded-2xl p-4 shadow-lg border border-purple-50 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-500">Reading History</div>
                  <div className="text-lg font-semibold text-[#3B1E54]">{history.length} entries</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Trend</div>
                  <Sparkline data={history.slice(0, 10).reverse()} />
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-auto">
                {history.length === 0 ? (
                  <div className="text-sm text-gray-500">No readings yet — try reading a story!</div>
                ) : (
                  history.slice(0, 12).map((h) => (
                    <div key={h.id} className="p-2 rounded-md bg-gray-50 flex items-center justify-between">
                      <div style={{ minWidth: 0 }}>
                        <div className="text-sm font-semibold text-[#3B1E54] truncate">{h.title}</div>
                        <div className="text-xs text-gray-500">{new Date(h.date).toLocaleString()}</div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-bold text-[#9B7EBD]">{h.accuracy}%</div>
                        <div className="text-[10px] text-gray-400">acc</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (!window.confirm("Clear reading history?")) return;
                    saveHistory([]);
                    setHistory([]);
                  }}
                  className="text-xs text-gray-500 underline"
                >
                  Clear history
                </button>
                <button onClick={() => setStep("story")} className="text-xs px-3 py-1 rounded-full bg-purple-50 text-[#3B1E54] border">
                  Go to Story
                </button>
              </div>
            </div>

            <div className="mt-4 bg-white/95 rounded-2xl p-4 shadow-lg border border-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#3B1E54]">Tips for reading</div>
                  <div className="text-xs text-gray-500">Short sessions beat long marathons.</div>
                </div>
                <div className="text-xl">📚</div>
              </div>
              <ul className="mt-3 text-sm text-[#3B1E54] space-y-2">
                <li>• Start slow and focus on clarity.</li>
                <li>• Repeat tricky sentences out loud.</li>
                <li>• Use the assistant to learn pacing.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
