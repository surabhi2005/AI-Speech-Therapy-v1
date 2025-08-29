// Storytelling.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaPlay, FaStop, FaArrowLeft, FaHome, FaStar, FaVolumeUp, FaMicrophone } from "react-icons/fa";
import KidsSidebar from "./KidsSidebar";
import axios from "axios";

/* === EDIT MARKER START ===
   Upgrades included in this single-file implementation:
   - Local history of past readings (localStorage) and simple trends sparkline
   - "Reading Assistant" mode that highlights words while TTS is speaking (uses onboundary where available)
   - Micro-animations: simple SVG mouth + waveform synced during playback using score per-word segments when available
   - Real-time (best-effort) highlighting while recording using Web Speech API interim results (webkitSpeechRecognition)
   - Post-recording scoring via /score endpoint (backend), stores history and shows accuracy
   - Clean teen-friendly UI with image background, responsive layout, collapsible advanced JSON
   === EDIT MARKER END === */

/* API set-up (assumes API similar to your ML backend running at REACT_APP_API_URL) */
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: API_BASE, timeout: 60000 });

/* --- Helpers: audio conversion utilities (encode WAV / convert to 16k) --- */
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

function normalizeText(t = "") {
  return String(t || "").toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
}

function splitToWords(txt) {
  // Keep punctuation token adjacent but return words array with original text and cleaned text
  const words = txt.split(/\s+/).filter(Boolean);
  return words.map((w) => ({
    raw: w,
    clean: normalizeText(w),
  }));
}

/* Local Storage keys & helpers */
const HISTORY_KEY = "story_reading_history_v1";
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveHistory(hist) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 50)));
  } catch {}
}

/* Simple spinner component */
const Spinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.12)" strokeWidth="4" />
    <path d="M22 12A10 10 0 0012 2" stroke="#6b4a88" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/* Stories data - can be expanded later */
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

/* Main Component */
export default function Storytelling() {
  const [step, setStep] = useState("intro"); // intro, story, feedback, assistant
  const [currentIdx, setCurrentIdx] = useState(0);
  const story = STORIES[currentIdx];

  // recording & recognition
  const [isRecording, setIsRecording] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordedBlobRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // highlighting & real-time feedback
  const words = splitToWords(story.content);
  const [liveWordStatuses, setLiveWordStatuses] = useState(() => words.map(() => "neutral")); // "neutral"|"listening"|"correct"|"incorrect"
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // scoring & history
  const [scoreResult, setScoreResult] = useState(null); // full backend JSON
  const [scoreValue, setScoreValue] = useState(null); // numeric % accuracy
  const [history, setHistory] = useState(() => loadHistory());

  // waveform data for playback visualization
  const [waveBars, setWaveBars] = useState([]); // array of numbers 0..1
  const waveAnimRef = useRef(null);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        stopRecognition();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // when story changes, reset word statuses
    setLiveWordStatuses(splitToWords(story.content).map(() => "neutral"));
    setHighlightIndex(-1);
    setScoreResult(null);
    setScoreValue(null);
    recordedBlobRef.current = null;
  }, [currentIdx]); // eslint-disable-line

  /* ----------------------------
     Real-time speech recognition (interim) to highlight words while recording
     ---------------------------- */
  function startRecognitionLive() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      // not available - no real-time highlight
      return null;
    }
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Rec();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onresult = (ev) => {
      // combine interim results into string
      let interim = "";
      let final = "";
      for (let i = 0; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
        else interim += ev.results[i][0].transcript;
      }
      const transcript = (final + " " + interim).trim();
      if (!transcript) return;
      // Update live highlighting based on transcript by mapping tokens sequentially
      applyLiveTranscript(transcript);
    };

    recognition.onerror = (e) => {
      // console.warn("Recognition error", e);
    };
    recognition.onend = () => {
      // will be restarted by stopRecording handler as needed
    };
    recognition.start();
    recognitionRef.current = recognition;
    return recognition;
  }

  function stopRecognition() {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } catch {}
  }

  function applyLiveTranscript(transcript) {
    // Map tokens to expected words greedily. This is best-effort approximate highlighting.
    const expected = splitToWords(story.content).map((w) => w.clean);
    const seen = transcript.split(/\s+/).map((t) => normalizeText(t)).filter(Boolean);
    // For each expected index, if corresponding token equals, mark correct
    const newStatuses = expected.map(() => "neutral");
    let si = 0;
    for (let i = 0; i < expected.length && si < seen.length; i++) {
      const exp = expected[i];
      if (!exp) continue;
      if (seen[si] === exp) {
        newStatuses[i] = "correct";
        si++;
      } else {
        // attempt to see if seen[si] contains exp as substring
        if (seen[si].includes(exp) || exp.includes(seen[si])) {
          newStatuses[i] = "correct";
          si++;
        } else {
          // leave neutral but mark listening window
          newStatuses[i] = "listening";
        }
      }
    }
    setLiveWordStatuses(newStatuses);
  }

  /* ----------------------------
     Recording with MediaRecorder and posting audio to /score
     ---------------------------- */
  async function startRecording() {
    setScoreResult(null);
    setScoreValue(null);
    setLiveWordStatuses(splitToWords(story.content).map(() => "neutral"));
    chunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        // Create blob and score
        const rawBlob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
        recordedBlobRef.current = rawBlob;
        // convert to 16k WAV if possible
        const wav = await convertBlobToWav16k(rawBlob);
        await postScore(wav);
        // stop microphone tracks
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {}
      };
      mediaRecorderRef.current.start();
      startRecognitionLive();
      setIsRecording(true);
    } catch (err) {
      console.error("startRecording failed:", err);
      alert("Could not start recording. Check microphone permission.");
    }
  }

  function stopRecording() {
    try {
      stopRecognition();
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    } catch (err) {
      console.error("stopRecording failed:", err);
      setIsRecording(false);
    }
  }

  /* Post audio to backend /score and process response for highlighting and history */
  async function postScore(wavBlob) {
    setIsScoring(true);
    setScoreResult(null);
    setScoreValue(null);
    try {
      const form = new FormData();
      form.append("expected", story.content);
      form.append("audio", wavBlob, "reading.wav");
      const res = await api.post("/score", form, { headers: { "Content-Type": "multipart/form-data" } });
      const result = res.data || {};
      setScoreResult(result);
      // compute accuracy percentage (if available)
      const acc = Number(result?.summary?.word_accuracy ?? 0) * 100;
      setScoreValue(Math.round(acc));
      // Map per-word segments to highlight words: prefer result.per_word or result.per_word
      const perWord = result?.per_word || result?.per_word_aligned || result?.words || [];
      // Build statuses array
      const statuses = splitToWords(story.content).map(() => "neutral");
      if (Array.isArray(perWord) && perWord.length > 0) {
        // perWord items often include .op === 'equal' and expected indices - we match by content best-effort
        const expectedClean = splitToWords(story.content).map((w) => w.clean);
        // try matching sequentially
        let wi = 0;
        for (let i = 0; i < perWord.length && wi < expectedClean.length; i++) {
          const pw = perWord[i];
          const act = normalizeText(pw.actual || pw.word || pw.aligned_word || "");
          const exp = expectedClean[wi];
          if (!act) {
            wi++;
            continue;
          }
          // decide correct based on op/equality or same tokens
          const correct = pw.op === "equal" || act === exp || exp.includes(act) || act.includes(exp);
          statuses[wi] = correct ? "correct" : "incorrect";
          wi++;
        }
      } else {
        // fallback: use overall accuracy
        if (scoreValue >= 70) {
          // mark all as correct
          for (let i = 0; i < statuses.length; i++) statuses[i] = "correct";
        }
      }
      setLiveWordStatuses(statuses);

      // prepare waveform bars from per_word prosody.energy_db_mean or acoustic_score
      const bars = (perWord || []).map((pw) => {
        const energy = pw?.prosody?.energy_db_mean ?? pw?.energy ?? pw?.acoustic_score ?? null;
        if (energy == null) return Math.random() * 0.6 + 0.1;
        // energy might be negative dB - normalize heuristically
        const val = Math.min(1, Math.max(0, (Number(energy) + 60) / 40)); // map -60..-20 -> 0..1
        return val;
      });
      if (bars.length === 0) {
        // create placeholder bars
        for (let i = 0; i < Math.min(12, words.length); i++) bars.push(0.2 + Math.random() * 0.6);
      }
      setWaveBars(bars);

      // persist to history
      const item = {
        id: `${story.id}-${Date.now()}`,
        title: story.title,
        date: new Date().toISOString(),
        accuracy: Math.round(acc),
        scoreSummary: result?.summary ?? {},
      };
      const newHist = [item, ...history].slice(0, 50);
      setHistory(newHist);
      saveHistory(newHist);
    } catch (err) {
      console.error("postScore error:", err);
      alert("Scoring failed. Check server or try again.");
    } finally {
      setIsScoring(false);
    }
  }

  /* ----------------------------
     Playback helpers:
     - Play recorded audio and sync highlighting with per-word timestamps if available
     - TTS assistant mode: read via speechSynthesis and use onboundary where available to highlight words
     ---------------------------- */
  function playRecording() {
    if (!recordedBlobRef.current) return;
    if (isPlayingRecording) {
      // stop
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {}
      setIsPlayingRecording(false);
      setHighlightIndex(-1);
      return;
    }
    const url = URL.createObjectURL(recordedBlobRef.current);
    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setIsPlayingRecording(true);
    setHighlightIndex(-1);

    // create segments from scoreResult per_word if present
    const perWord = scoreResult?.per_word || scoreResult?.per_word_aligned || [];

    audio.ontimeupdate = () => {
      const t = audio.currentTime;
      // Find which per_word segment includes t
      if (Array.isArray(perWord) && perWord.length > 0) {
        // find index where start <= t < end
        let idx = -1;
        for (let i = 0; i < perWord.length; i++) {
          const s = Number(perWord[i].start ?? perWord[i].start_time ?? -1);
          const e = Number(perWord[i].end ?? perWord[i].end_time ?? -1);
          if (!isNaN(s) && !isNaN(e) && s <= t && t <= e) {
            idx = i;
            break;
          }
        }
        if (idx >= 0) {
          // map idx to visual word index by sequential mapping: we already matched per_word to words in postScore
          setHighlightIndex(idx);
        } else {
          setHighlightIndex(-1);
        }
      } else {
        // no segments: animate simple pulsing highlight based on progress
        const total = audio.duration || 1;
        const frac = Math.min(1, t / total);
        const idx = Math.floor(frac * words.length);
        setHighlightIndex(idx);
      }
    };

    audio.onended = () => {
      setIsPlayingRecording(false);
      setHighlightIndex(-1);
      URL.revokeObjectURL(url);
    };

    audio.play().catch((e) => {
      console.warn("Playback error", e);
      setIsPlayingRecording(false);
    });
  }

  function startAssistantTTS() {
    // Use speechSynthesis to read story text and highlight words using onboundary
    if (!("speechSynthesis" in window)) {
      alert("TTS not supported in this browser.");
      return;
    }
    const synth = window.speechSynthesis;
    // stop any previous
    synth.cancel();
    setIsTTSPlaying(true);
    setHighlightIndex(-1);

    const utter = new SpeechSynthesisUtterance(story.content);
    utter.lang = "en-US";
    utter.rate = 1.0;
    // Build cumulative char positions for words to map charIndex -> wordIndex
    const cumul = [];
    let acc = 0;
    for (let i = 0; i < words.length; i++) {
      cumul.push({ start: acc, end: acc + words[i].raw.length - 1 });
      acc += words[i].raw.length + 1; // include single space
    }

    utter.onboundary = (ev) => {
      // boundary gives charIndex most of the time (not universally implemented)
      const charIndex = ev.charIndex ?? null;
      if (charIndex != null) {
        // find which word contains charIndex
        let wi = 0;
        for (let i = 0; i < cumul.length; i++) {
          if (charIndex >= cumul[i].start && charIndex <= cumul[i].end) {
            wi = i;
            break;
          }
        }
        setHighlightIndex(wi);
      } else {
        // fallback: approximate by progress using elapsed time (no timing info)
      }
    };
    utter.onend = () => {
      setIsTTSPlaying(false);
      setHighlightIndex(-1);
    };
    synth.speak(utter);
  }

  /* render sparkline for history accuracies */
  function Sparkline({ data = [], width = 160, height = 36 }) {
    if (!data || data.length === 0) {
      return <div className="text-xs text-gray-400">No trend yet</div>;
    }
    const values = data.map((d) => d.accuracy || 0);
    const max = Math.max(...values, 100);
    const min = Math.min(...values, 0);
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * (width - 6) + 3;
      const y = ((1 - (v - min) / Math.max(1, max - min)) * (height - 6)) + 3;
      return `${x},${y}`;
    });
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="rounded">
        <polyline fill="none" stroke="#9B7EBD" strokeWidth="2" points={points.join(" ")} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  /* small utility to render stars (0..5 scaled from accuracy) */
  function renderStars(score = 0) {
    const count = Math.round((score / 100) * 5);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar key={i} className={i < count ? "text-yellow-400" : "text-gray-300"} />
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  }

  /* ----------------------------
     UI pieces
     ---------------------------- */
  return (
    <div className="flex min-h-screen">
      <KidsSidebar />

      <div className="flex-1 relative min-h-screen overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center [filter:contrast(110%)_saturate(115%)]"
          style={{
            backgroundImage: `linear-gradient(rgba(15,10,25,0.12), rgba(15,10,25,0.05)), url("${story.bg}")`,
          }}
          aria-hidden
        />
        <div className="relative z-20 flex flex-col lg:flex-row gap-6 p-6">
          {/* Left — main reading panel */}
          <main className="flex-1 max-w-3xl mx-auto lg:mx-0">
            {step === "intro" && (
              <div className="bg-white/95 rounded-2xl p-8 shadow-lg border border-purple-100 max-w-xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold text-[#2b1736]">Storytime — Level Up Your Reading</h1>
                <p className="mt-3 text-gray-600">Pick a story and read aloud. Get accuracy feedback and see trends over time.</p>
                <div className="mt-8 flex gap-3 justify-center">
                  <button
                    onClick={() => { setStep("story"); }}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[#9B7EBD] to-[#6b4a88] text-white font-semibold shadow hover:scale-105 transform transition"
                  >
                    Start Reading
                  </button>
                  <button
                    onClick={() => { setStep("assistant"); }}
                    className="px-6 py-3 rounded-full bg-white border shadow text-[#3b1e34] font-semibold"
                  >
                    Reading Assistant
                  </button>
                </div>
              </div>
            )}

            {(step === "story" || step === "assistant") && (
              <div className="bg-white/95 rounded-2xl p-6 shadow-lg border border-purple-50">
                {/* header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-6xl">{story.image}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#2b1736]">{story.title}</h2>
                      <div className="text-xs text-gray-500">{story.content.split(" ").length} words</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setCurrentIdx((i) => (i - 1 + STORIES.length) % STORIES.length); }}
                      className="p-2 bg-white rounded-full shadow"
                      aria-label="Prev story"
                    >◀</button>
                    <button
                      onClick={() => { setCurrentIdx((i) => (i + 1) % STORIES.length); }}
                      className="p-2 bg-white rounded-full shadow"
                      aria-label="Next story"
                    >▶</button>
                  </div>
                </div>

                {/* story text with word highlights */}
                <div className="mt-6 bg-gradient-to-b from-white to-purple-50 p-5 rounded-xl border border-purple-100">
                  <p className="text-lg leading-relaxed text-[#2b1736]">
                    {splitToWords(story.content).map((w, i) => {
                      const status = liveWordStatuses[i] || "neutral";
                      const isHighlight = highlightIndex === i;
                      const base = "inline-block mr-1 mb-2 px-0.5";
                      const cls =
                        status === "correct"
                          ? "bg-green-100 text-green-800 rounded"
                          : status === "incorrect"
                          ? "bg-red-100 text-red-700 rounded"
                          : isHighlight
                          ? "bg-yellow-100 text-yellow-800 rounded"
                          : "text-[#2b1736]";
                      return (
                        <span key={`${w.raw}-${i}`} className={`${base} ${cls}`} style={{ transition: "all .18s" }}>
                          {w.raw}
                        </span>
                      );
                    })}
                  </p>

                  {/* waveform / micro mouth */}
                  <div className="mt-4 flex items-center justify-between gap-4">
                    {/* waveform bars */}
                    <div className="flex items-end gap-1 flex-1" style={{ minHeight: 42 }}>
                      {waveBars.length > 0 ? (
                        waveBars.map((v, idx) => (
                          <div key={idx} style={{
                            width: `${Math.max(4, 100 / waveBars.length - 2)}%`,
                            height: `${Math.round(v * 100)}%`,
                            background: idx === highlightIndex ? "linear-gradient(180deg,#ffd36b,#ffb84d)" : "#e6dff0",
                            borderRadius: 4,
                            transition: "height 120ms linear",
                          }} />
                        ))
                      ) : (
                        // placeholder animated bars while recording or idle
                        Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} style={{
                            width: `${Math.max(4, 100 / 12 - 2)}%`,
                            height: `${20 + (i % 4) * 12}%`,
                            background: "#efe6fb",
                            borderRadius: 4,
                            opacity: 0.9,
                          }} />
                        ))
                      )}
                    </div>

                    {/* mouth svg */}
                    <div style={{ width: 72, height: 48 }}>
                      <svg viewBox="0 0 72 48" width="72" height="48" aria-hidden>
                        <rect x="0" y="0" width="72" height="48" rx="8" fill="rgba(255,255,255,0.4)" />
                        {/* mouth: simple animated ellipse that opens when speaking */}
                        <ellipse cx="36" cy="26" rx="20" ry={isRecording || isPlayingRecording || isTTSPlaying ? 9 + (highlightIndex % 3) * 2 : 6} fill="#6b4a88" />
                        <ellipse cx="36" cy="26" rx="14" ry={isRecording || isPlayingRecording || isTTSPlaying ? 6 + (highlightIndex % 2) * 1.5 : 4} fill="#fff" opacity="0.18" />
                      </svg>
                    </div>

                    <div className="flex gap-2">
                      <div className="text-xs text-gray-500">Live</div>
                      <div className="text-sm font-semibold text-[#6b4a88]">{isRecording ? "Recording" : isPlayingRecording ? "Playing" : isTTSPlaying ? "Listening" : "Idle"}</div>
                    </div>
                  </div>
                </div>

                {/* controls */}
                <div className="mt-5 flex gap-3 flex-wrap items-center">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-[#9B7EBD] to-[#6b4a88] text-white inline-flex items-center gap-2"
                    >
                      <FaMicrophone /> Record
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-4 py-2 rounded-full bg-red-500 text-white inline-flex items-center gap-2"
                    >
                      <FaStop /> Stop
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (recordedBlobRef.current) playRecording();
                    }}
                    disabled={!recordedBlobRef.current}
                    className="px-3 py-2 rounded-full bg-white border text-[#2b1736] inline-flex items-center gap-2"
                  >
                    <FaPlay /> Play Recording
                  </button>

                  <button
                    onClick={() => {
                      // start assistant TTS
                      startAssistantTTS();
                      setStep("assistant");
                    }}
                    className="px-3 py-2 rounded-full bg-white border text-[#2b1736] inline-flex items-center gap-2"
                  >
                    <FaVolumeUp /> Reading Assistant
                  </button>

                  {isScoring && <div className="ml-2"><Spinner /></div>}
                </div>

                {/* scoring / accuracy display */}
                <div className="mt-4 flex items-center gap-4 justify-between flex-wrap">
                  <div>
                    <div className="text-xs text-gray-500">Latest accuracy</div>
                    <div className="text-lg font-bold text-[#2b1736]">{scoreValue != null ? `${scoreValue}%` : "—"}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500">Quick rating</div>
                    <div>{renderStars(scoreValue ?? 0)}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-500">History</div>
                    <div className="text-sm text-[#6b4a88]">{history.length} readings</div>
                  </div>
                </div>

                {/* advanced JSON preview (collapsible) */}
                <div className="mt-4">
                  <details>
                    <summary className="cursor-pointer text-xs text-gray-500">Advanced (raw server result)</summary>
                    <pre style={{ whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto", background: "#f7f7fb", padding: 8, marginTop: 8, borderRadius: 6 }}>
                      {scoreResult ? JSON.stringify(scoreResult, null, 2) : "No server result yet."}
                    </pre>
                  </details>
                </div>
              </div>
            )}

            {step === "feedback" && (
              <div className="bg-white/95 rounded-2xl p-6 shadow-lg border border-purple-100">
                <h3 className="text-2xl font-bold text-[#2b1736]">Reading Summary</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-xs text-gray-500">Accuracy</div>
                    <div className="text-xl font-bold text-[#2b1736]">{scoreValue ?? "—"}%</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-xs text-gray-500">Words</div>
                    <div className="text-xl font-bold text-[#2b1736]">{words.length}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-xs text-gray-500">Date</div>
                    <div className="text-xl font-bold text-[#2b1736]">{new Date().toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <button onClick={() => setStep("story")} className="px-4 py-2 rounded-full bg-gradient-to-r from-[#9B7EBD] to-[#6b4a88] text-white">Continue</button>
                </div>
              </div>
            )}
          </main>

          {/* Right — sidebar with history & trends */}
          <aside className="w-full lg:w-96">
            <div className="bg-white/95 rounded-2xl p-4 shadow-lg border border-purple-50 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-500">Reading History</div>
                  <div className="text-lg font-semibold text-[#2b1736]">{history.length} entries</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Trend</div>
                  <Sparkline data={history.slice(0, 8).reverse()} />
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-auto">
                {history.length === 0 ? (
                  <div className="text-sm text-gray-500">No readings yet. Try a round!</div>
                ) : (
                  history.slice(0, 12).map((h) => (
                    <div key={h.id} className="p-2 rounded-md bg-gray-50 flex items-center justify-between">
                      <div style={{ minWidth: 0 }}>
                        <div className="text-sm font-semibold text-[#2b1736] truncate">{h.title}</div>
                        <div className="text-xs text-gray-500">{new Date(h.date).toLocaleString()}</div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-bold text-[#6b4a88]">{h.accuracy}%</div>
                        <div className="text-xs text-gray-400">acc</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4">
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
              </div>
            </div>

            {/* Quick tips */}
            <div className="mt-4 bg-white/95 rounded-2xl p-4 shadow-lg border border-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#2b1736]">Tips for great reading</div>
                  <div className="text-xs text-gray-500">Short & focused practice sessions work best.</div>
                </div>
                <div className="text-xl">📖</div>
              </div>

              <ul className="mt-3 text-sm text-[#2b1736] space-y-2">
                <li>• Read slowly and clearly at first.</li>
                <li>• Focus on tricky words and repeat them.</li>
                <li>• Use the assistant to hear ideal pacing.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
