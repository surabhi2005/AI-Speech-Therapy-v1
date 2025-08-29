import React, { useState, useEffect, useRef } from "react";
import KidsSidebar from "./KidsSidebar"; // <-- Import KidsSidebar
import axios from "axios";

/*
  === EDIT MARKER START ===
  This file was revised to replace the browser-only webkitSpeechRecognition approach
  with a robust recording -> server scoring pipeline. The component:
    - Records microphone audio via MediaRecorder
    - Converts the recording to 16kHz mono WAV in-browser (OfflineAudioContext)
    - Posts audio + expected text to the ML API /score endpoint
    - Uses responses (_meta.asr_text when available) to decide correctness
    - Requests feedback via /feedback and plays TTS (when available)
    - Handles errors and provides UX feedback
  Notes:
    - The backend base URL is taken from REACT_APP_API_URL or defaults to http://localhost:8000
    - No external files modified; everything is self-contained in this single file
  === EDIT MARKER END ===
*/

// Vocacare color palette
const colors = {
  primary: "#3B1E54",
  secondary: "#9B7EBD",
  accent: "#D4BEE4",
  background: "#EEEEEE",
};

// Environment icons
const environmentIcons = {
  Forest: "fa-tree",
  Farm: "fa-tractor",
  Garden: "fa-seedling",
  Playground: "fa-sliders",
  Farmyard: "fa-cow",
  "Sports Field": "fa-running",
  Classroom: "fa-book",
  "Magic Forest": "fa-dragon",
};

// Levels data
const levels = [
  {
    id: 1,
    title: "Level 1: Single-Syllable Words",
    environment: "Forest",
    prompts: ["cat", "dog", "sun", "hat", "cup"],
    unlocked: true,
  },
  {
    id: 2,
    title: "Level 2: Two-Syllable Words",
    environment: "Farm",
    prompts: ["apple", "bunny", "cookie", "flower", "puppy", "tiger"],
    unlocked: false,
  },
  {
    id: 3,
    title: "Level 3: Short Phrases",
    environment: "Garden",
    prompts: ["I see a cat", "The dog runs", "Pick the ball", "The sun is hot"],
    unlocked: false,
  },
  {
    id: 4,
    title: "Level 4: Descriptive Words",
    environment: "Playground",
    prompts: ["The cat is big", "The dog is small", "I am happy", "I am sad"],
    unlocked: false,
  },
  {
    id: 5,
    title: "Level 5: Animals & Sounds",
    environment: "Farmyard",
    prompts: ["The cow says moo", "The dog barks", "The bird sings"],
    unlocked: false,
  },
  {
    id: 6,
    title: "Level 6: Actions & Verbs",
    environment: "Sports Field",
    prompts: ["I jump high", "I run fast", "I clap my hands", "The dog sleeps"],
    unlocked: false,
  },
  {
    id: 7,
    title: "Level 7: Questions & Answers",
    environment: "Classroom",
    prompts: ["Where is the cat?", "What is in the box?", "Who is running?"],
    unlocked: false,
  },
  {
    id: 8,
    title: "Level 8: Story Sentences",
    environment: "Magic Forest",
    prompts: [
      "I saw a cat chasing a butterfly",
      "The dog is playing with a ball",
      "I like to eat apples",
    ],
    unlocked: false,
  },
];

////////////////////////////////////////////////////////////////////////////////
// API client (single-file)
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
});

////////////////////////////////////////////////////////////////////////////////
// Helper utilities for audio conversion (in-browser WAV encode & resample)
// These functions are safe and used to convert MediaRecorder blobs to 16kHz WAV
// (kept unchanged from previous version)
async function decodeAudioBlobToAudioBuffer(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new (window.OfflineAudioContext ||
    window.webkitOfflineAudioContext ||
    window.AudioContext)();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

async function convertBlobToWav16k(blob) {
  const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const decoded = await tempCtx.decodeAudioData(arrayBuffer);
  tempCtx.close?.();

  const targetRate = 16000;
  const numberOfChannels = 1;
  const duration = decoded.duration;
  const offline = new (window.OfflineAudioContext ||
    window.webkitOfflineAudioContext)(
    numberOfChannels,
    Math.ceil(duration * targetRate),
    targetRate
  );

  const buffer = offline.createBuffer(
    numberOfChannels,
    Math.ceil(duration * targetRate),
    targetRate
  );
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const inputData =
      decoded.numberOfChannels > ch
        ? decoded.getChannelData(ch)
        : decoded.getChannelData(0);
    const outputData = buffer.getChannelData(ch);
    const ratio = decoded.sampleRate / targetRate;
    for (let i = 0; i < outputData.length; i++) {
      const srcIndex = Math.floor(i * ratio);
      outputData[i] = inputData[srcIndex] || 0;
    }
  }

  const src = offline.createBufferSource();
  src.buffer = buffer;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();
  const wavArrayBuffer = encodeWAV(rendered.getChannelData(0), targetRate);
  return new Blob([wavArrayBuffer], { type: "audio/wav" });
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    output.setInt16(offset, s, true);
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunkSize
  view.setUint16(20, 1, true); // audioFormat = PCM
  view.setUint16(22, 1, true); // numChannels
  view.setUint32(24, sampleRate, true); // sampleRate
  view.setUint32(28, sampleRate * 2, true); // byteRate (sampleRate * blockAlign)
  view.setUint16(32, 2, true); // blockAlign (channels * bytesPerSample)
  view.setUint16(34, 16, true); // bitsPerSample
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view.buffer;
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

////////////////////////////////////////////////////////////////////////////////
// Utility: normalize text for simple matching
function normalizeText(t = "") {
  return String(t || "")
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

////////////////////////////////////////////////////////////////////////////////
// Component
const SpeechGames = () => {
  // game state
  const [levelIndex, setLevelIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);

  // server & scoring states
  const [lastASR, setLastASR] = useState("");
  const [scoreResult, setScoreResult] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackPlaying, setFeedbackPlaying] = useState(false);
  const [error, setError] = useState("");

  // refs for MediaRecorder workflow
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const currentLevel = levels[levelIndex];
  const currentPrompt = currentLevel.prompts[promptIndex];

  useEffect(() => {
    // auto-unlock current level on change (keeps unlockedLevels in sync)
    setUnlockedLevels((prev) => {
      const lvlId = levelIndex + 1;
      if (!prev.includes(lvlId)) return [...prev, lvlId];
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  // progress computation
  const progressPercentage =
    ((levelIndex + promptIndex / currentLevel.prompts.length) / levels.length) *
    100;

  // -------- Recording handlers --------
  const startRecording = async () => {
    setError("");
    setMessage("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Microphone access is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const options = { mimeType: "audio/webm" };
      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        setIsListening(false);
        try {
          const blob = new Blob(chunksRef.current, {
            type: chunksRef.current[0]?.type || "audio/webm",
          });
          // convert to 16k WAV for backend compatibility
          const wavBlob = await convertBlobToWav16k(blob);
          await postScore(wavBlob);
        } catch (err) {
          console.error("Recording processing failed:", err);
          setError("Failed to process recording. Try again.");
        } finally {
          // cleanup media tracks
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
          chunksRef.current = [];
        }
      };

      mr.start();
      setIsListening(true);
      // UI guidance
      setMessage("Recording... Speak now");
    } catch (err) {
      console.error("startRecording error:", err);
      setError("Could not start microphone. Check permissions.");
      setIsListening(false);
    }
  };

  const stopRecording = () => {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        setMessage("Processing...");
      } else {
        setMessage("");
      }
    } catch (err) {
      console.error("stopRecording error:", err);
      setError("Failed to stop recording.");
    }
  };

  // -------- POST to /score (primary flow) --------
  const postScore = async (wavBlob) => {
    setError("");
    setScoreResult(null);
    setLastASR("");
    setFeedbackText("");
    try {
      const form = new FormData();
      form.append("expected", currentPrompt);
      form.append("audio", wavBlob, "utterance.wav");

      // POST to /score
      const res = await api.post("/score", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = res.data || {};
      setScoreResult(result);

      // extract ASR if present
      const asrText = result?._meta?.asr_text || result?.asr_text || "";
      setLastASR(asrText);

      // Decide correctness:
      const cleanedASR = normalizeText(asrText);
      const cleanedExpected = normalizeText(currentPrompt);

      let correct = false;
      // 1) If ASR contains expected string -> correct
      if (
        cleanedASR &&
        cleanedExpected &&
        cleanedASR.includes(cleanedExpected)
      ) {
        correct = true;
      }

      // 2) If scorer returned numeric score-like fields, use them cautiously
      const numericScoreCandidates = [
        result?.score,
        result?.overall_score,
        result?.score_percent,
        result?.accuracy,
      ];
      for (const s of numericScoreCandidates) {
        if (typeof s === "number" && !Number.isNaN(s)) {
          // normalize typical scores into 0..1 if >1 assume percent
          let val = s;
          if (val > 1) val = val / 100;
          if (val >= 0.7) {
            correct = true;
            break;
          }
        }
      }

      // 3) fallback: match majority of words
      if (!correct && cleanedASR && cleanedExpected) {
        const expectedWords = cleanedExpected.split(" ").filter(Boolean);
        const matched = expectedWords.filter((w) =>
          cleanedASR.includes(w)
        ).length;
        if (expectedWords.length > 0 && matched / expectedWords.length >= 0.6)
          correct = true;
      }

      if (correct) {
        setMessage("🎉 Great job!");
        setScore((s) => s + 1);
        // unlock next level if finishing prompt set
        setTimeout(() => {
          setMessage("");
          if (promptIndex + 1 < currentLevel.prompts.length) {
            setPromptIndex((p) => p + 1);
          } else if (levelIndex + 1 < levels.length) {
            setLevelIndex((l) => l + 1);
            setPromptIndex(0);
            setUnlockedLevels((prev) =>
              prev.includes(levelIndex + 2) ? prev : [...prev, levelIndex + 2]
            );
          } else {
            setMessage("🏆 Adventure Completed!");
          }
        }, 3000);
      } else {
        setMessage("❌ Try Again!");
        setTimeout(() => setMessage(""), 2400);
      }
    } catch (err) {
      console.error("postScore error:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data ||
        err?.message;
      setError(String(serverMsg || "Scoring failed."));
      setMessage("");
    }
  };

  // -------- Feedback (POST /feedback) --------
  const requestFeedback = async () => {
    setError("");
    setFeedbackText("");
    if (!scoreResult) {
      setError("Please record & score before requesting feedback.");
      return;
    }
    try {
      const body = { scoring_result: scoreResult, age: "kid" };
      const res = await api.post("/feedback", body);
      const data = res.data || {};
      setFeedbackText(data.text || "No textual feedback.");
      if (data.audio_base64) {
        const wavBlob = base64ToBlob(data.audio_base64, "audio/wav");
        const url = URL.createObjectURL(wavBlob);
        setFeedbackPlaying(true);
        const audio = new Audio(url);
        audio.onended = () => {
          setFeedbackPlaying(false);
          URL.revokeObjectURL(url);
        };
        await audio.play().catch((e) => {
          console.warn("Playback failed:", e);
          setFeedbackPlaying(false);
        });
      }
    } catch (err) {
      console.error("requestFeedback error:", err);
      const serverMsg =
        err?.response?.data?.message || err?.message || "Feedback failed.";
      setError(String(serverMsg));
    }
  };

  // -------- Level selection --------
  const selectLevel = (index) => {
    if (unlockedLevels.includes(index + 1)) {
      setLevelIndex(index);
      setPromptIndex(0);
      setMessage("");
      setScoreResult(null);
      setLastASR("");
      setFeedbackText("");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (mediaStreamRef.current)
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
    };
  }, []);

  // -------- Render --------
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "linear-gradient(to bottom, #3B1E54, #9B7EBD)" }}
    >
      {/* Kids Sidebar */}
      <KidsSidebar />

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-md mt-4">
            Vocacare: Speech Games
          </h1>
          <p className="text-xl text-white mt-2">
            Learn words through fun adventures!
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center mb-6">
              <div className="environment-icon mb-4">
                <i
                  className={`fas ${
                    environmentIcons[currentLevel.environment]
                  } text-4xl`}
                  style={{ color: colors.primary }}
                ></i>
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: colors.primary }}
              >
                {currentLevel.title}
              </h2>
              <p className="text-lg mb-4" style={{ color: colors.secondary }}>
                {currentLevel.environment} Adventure
              </p>

              <div className="my-6">
                <div
                  className="w-28 h-28 mx-auto rounded-full flex items-center justify-center text-white text-5xl"
                  style={{
                    background: `linear-gradient(to bottom, ${colors.primary}, ${colors.secondary})`,
                  }}
                >
                  <i className="fas fa-child"></i>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-md mb-6 relative">
                <p
                  className="text-2xl font-bold"
                  style={{ color: colors.primary }}
                >
                  Say: "{currentPrompt}"
                </p>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-3">
                {/* Record Button */}
                <button
                  onClick={startRecording}
                  disabled={isListening}
                  className={`relative flex items-center justify-center font-semibold px-6 py-3 rounded-full text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed overflow-hidden group
      ${
        isListening
          ? "bg-gray-400"
          : "bg-gradient-to-r from-purple-700 to-[#3B1E54] hover:from-purple-600 hover:to-[#9B7EBD]"
      }`}
                >
                  {/* Animated pulse effect when not disabled */}
                  {!isListening && (
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-hover:animate-ping rounded-full"></span>
                  )}
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Record
                </button>

                {/* Stop Button */}
                <button
                  onClick={stopRecording}
                  disabled={!isListening}
                  className={`relative flex items-center justify-center font-semibold px-6 py-3 rounded-full text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600`}
                >
                  {/* Pulse animation when active */}
                  {!isListening && (
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-hover:animate-ping rounded-full"></span>
                  )}
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                  </svg>
                  Stop
                </button>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    setMessage("");
                    setLastASR("");
                    setScoreResult(null);
                  }}
                  className="relative flex items-center justify-center font-semibold px-5 py-2.5 rounded-full text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-hover:animate-ping rounded-full"></span>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset
                </button>
              </div>

              {/* status messages */}
              {message && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-4 mx-auto max-w-xl rounded-lg shadow-md flex items-start gap-3 p-3"
                  style={{
                    background:
                      message.toLowerCase().includes("great") ||
                      message.toLowerCase().includes("completed")
                        ? "linear-gradient(90deg,#e6fff2,#e6f7ff)" // success subtle
                        : "linear-gradient(90deg,#fff8e6,#fff1f0)", // neutral/warn subtle
                    border:
                      message.toLowerCase().includes("great") ||
                      message.toLowerCase().includes("completed")
                        ? "1px solid rgba(34,197,94,0.15)"
                        : "1px solid rgba(255,159,67,0.12)",
                    color:
                      message.toLowerCase().includes("great") ||
                      message.toLowerCase().includes("completed")
                        ? "#0f5132"
                        : "#7a4100",
                  }}
                >
                  {/* icon */}
                  <div
                    aria-hidden
                    className="flex-shrink-0 rounded-full flex items-center justify-center"
                    style={{
                      width: 44,
                      height: 44,
                      background:
                        message.toLowerCase().includes("great") ||
                        message.toLowerCase().includes("completed")
                          ? "linear-gradient(180deg,#34d399,#059669)"
                          : "linear-gradient(180deg,#ffb86b,#ff7a00)",
                      boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
                    }}
                  >
                    {/* inline SVG icons for crisp, dependency-free visuals */}
                    {message.toLowerCase().includes("great") ||
                    message.toLowerCase().includes("completed") ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="#fff"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M12 9v4"
                          stroke="#fff"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="#fff"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* content */}
                  <div className="flex-1">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "0.2px",
                          }}
                        >
                          {message.toLowerCase().includes("great") ||
                          message.toLowerCase().includes("completed")
                            ? "Well Done"
                            : "Note"}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 15,
                            fontWeight: 600,
                            color: "inherit",
                          }}
                        >
                          {/* keep the user-facing friendly text; remove any raw JSON/emoji */}
                          {message}
                        </div>
                      </div>

                      {/* dismiss */}
                      <button
                        onClick={() => setMessage("")}
                        aria-label="Dismiss message"
                        className="ml-2"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 6,
                          cursor: "pointer",
                          color: "rgba(15,23,42,0.6)",
                        }}
                        title="Dismiss"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* optional micro-help / hint line */}
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: "rgba(15,23,42,0.65)",
                      }}
                    >
                      {message.toLowerCase().includes("great") ||
                      message.toLowerCase().includes("completed")
                        ? "Keep going — try the next word for more points."
                        : "Tip: speak clearly and try again. You can press Record when you're ready."}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="mt-3 mx-auto max-w-xl rounded-lg border-l-4 p-3 flex items-start gap-3"
                  style={{
                    borderColor: "#ef4444",
                    background: "#fff5f5",
                    color: "#7f1d1d",
                    boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 8,
                      background: "#fecaca",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M12 8v4"
                        stroke="#7f1d1d"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 17h.01"
                        stroke="#7f1d1d"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="#7f1d1d"
                        strokeWidth="0"
                        fill="transparent"
                      />
                    </svg>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      Something went wrong
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>{error}</div>
                  </div>

                  <button
                    onClick={() => setError("")}
                    aria-label="Dismiss error"
                    title="Dismiss error"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 6,
                      color: "rgba(127,29,29,0.8)",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex items-center justify-center md:justify-start">
                  <div className="flex items-center bg-gradient-to-r from-indigo-50 to-white px-4 py-2.5 rounded-xl shadow-md border border-indigo-100">
                    <svg
                      className="w-5 h-5 text-indigo-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-lg font-bold text-gray-800">
                      Score:{" "}
                      <span style={{ color: colors.primary }}>{score}</span>
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 text-right">
                  <button
                    onClick={requestFeedback}
                    disabled={!scoreResult || feedbackPlaying}
                    className="relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transform transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md overflow-hidden group"
                  >
                    {/* Animated background effect on hover */}
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

                    {/* Icon with animation */}
                    <svg
                      className={`w-5 h-5 relative z-10 ${
                        feedbackPlaying
                          ? "animate-pulse"
                          : "group-hover:scale-110 transition-transform"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>

                    {/* Text with transition */}
                    <span className="relative z-10">
                      {feedbackPlaying ? (
                        <span className="flex items-center">
                          <span className="animate-pulse">
                            Playing feedback
                          </span>
                          <span className="ml-1.5 flex space-x-0.5">
                            <span
                              className="animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            >
                              .
                            </span>
                            <span
                              className="animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            >
                              .
                            </span>
                            <span
                              className="animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            >
                              .
                            </span>
                          </span>
                        </span>
                      ) : (
                        <span className="group-hover:tracking-wide transition-all">
                          Get Feedback
                        </span>
                      )}
                    </span>

                    {/* Shine effect on hover */}
                    <span className="absolute inset-0 -inset-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-40 transition-all duration-700 z-10"></span>
                  </button>
                </div>
              </div>

              {/* ASR Preview and Kid-Friendly Score Summary */}
              <div className="mt-6 text-left bg-gray-50 p-4 rounded-md">
                {/* friendly ASR bubble */}
                <div className="mb-3">
                  <strong className="block text-sm text-gray-700">
                    I heard:
                  </strong>
                  <div
                    className="mt-2 inline-block bg-white px-4 py-2 rounded-xl shadow-sm text-lg font-semibold"
                    style={{ color: colors.primary }}
                  >
                    {lastASR ? `"${lastASR}"` : "—"}
                  </div>
                </div>

                {/* cute summary badges */}
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  {/* Word accuracy */}
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold text-gray-800">Accuracy</div>
                    <div className="w-40 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        style={{
                          width: `${Math.round(
                            (scoreResult?.summary?.word_accuracy ?? 0) * 100
                          )}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${colors.secondary}, ${colors.primary})`,
                          transition: "width 500ms ease",
                        }}
                      />
                    </div>
                    <div
                      className="text-sm font-bold ml-2"
                      style={{ color: colors.primary }}
                    >
                      {Math.round(
                        (scoreResult?.summary?.word_accuracy ?? 0) * 100
                      )}
                      %
                    </div>
                  </div>

                  {/* correct words */}
                  <div className="flex items-center bg-gradient-to-r from-green-50 to-white px-3 py-1.5 rounded-full shadow-sm border border-green-100">
                    <svg
                      className="w-4 h-4 text-green-600 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      <span className="text-green-600 font-semibold">
                        {scoreResult?.summary?.correct_words ?? 0}
                      </span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-gray-600">
                        {scoreResult?.summary?.expected_words ?? 0}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">words</span>
                    </span>
                  </div>

                  {/* WPM */}
                  <div className="flex items-center bg-gradient-to-r from-blue-50 to-white px-3 py-1.5 rounded-full shadow-sm border border-blue-100">
                    <svg
                      className="w-4 h-4 text-blue-600 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {scoreResult?.summary?.wpm ? (
                        <span className="text-blue-600 font-semibold">
                          {Math.round(scoreResult.summary.wpm)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      <span className="text-xs text-gray-500 ml-1">wpm</span>
                    </span>
                  </div>
                  {/* Duration */}
                  <div className="flex items-center bg-gradient-to-r from-purple-50 to-white px-3 py-1.5 rounded-full shadow-sm border border-purple-100">
                    <svg
                      className="w-4 h-4 text-purple-600 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {scoreResult?.summary?.utterance_duration_s ? (
                        <span className="text-purple-600 font-semibold">
                          {scoreResult.summary.utterance_duration_s.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      <span className="text-xs text-gray-500 ml-0.5">s</span>
                    </span>
                  </div>
                </div>

                {/* per-word friendly chips */}
                {Array.isArray(scoreResult?.per_word) &&
                  scoreResult.per_word.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm text-gray-700 mb-2">Words</div>
                      <div className="flex gap-2 flex-wrap">
                        {scoreResult.per_word.map((pw, idx) => {
                          const op = pw?.op ?? "unknown";
                          const word =
                            pw?.expected ?? pw?.actual ?? `word${idx}`;
                          const cls =
                            op === "equal"
                              ? "bg-green-100 text-green-800"
                              : op === "replace" || op === "insert"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-700";
                          return (
                            <div
                              key={idx}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${cls} shadow-sm`}
                            >
                              {word}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* short textual feedback preview */}
                {feedbackText && (
                  <div className="mt-2 p-3 bg-white rounded-md shadow-sm">
                    <strong className="block text-sm text-gray-700">
                      Feedback
                    </strong>
                    <div className="mt-1 text-sm text-gray-800">
                      {feedbackText}
                    </div>
                  </div>
                )}

                {/* Advanced details (developer only, collapsed) */}
                <details className="mt-3 text-xs text-gray-600">
                  <summary className="cursor-pointer">
                    Advanced details (for developers)
                  </summary>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      maxHeight: 240,
                      overflow: "auto",
                    }}
                    className="mt-2 bg-white p-3 rounded"
                  >
                    {scoreResult
                      ? JSON.stringify(scoreResult, null, 2)
                      : "No score yet."}
                  </pre>
                </details>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3
                className="text-xl font-bold mb-4 text-center"
                style={{ color: colors.primary }}
              >
                Your Progress
              </h3>
              <div className="w-full h-5 bg-gray-200 rounded-full mb-2">
                <div
                  className="h-5 rounded-full transition-all duration-500 flex items-center justify-center text-xs text-white font-bold"
                  style={{
                    width: `${progressPercentage}%`,
                    background: `linear-gradient(to right, ${colors.secondary}, ${colors.primary})`,
                  }}
                >
                  {Math.round(progressPercentage)}%
                </div>
              </div>
              <p className="text-center" style={{ color: colors.secondary }}>
                Level {levelIndex + 1} of {levels.length}
              </p>
            </div>
          </div>

          {/* Right Column - Levels */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2
                className="text-2xl font-bold mb-6 text-center"
                style={{ color: colors.primary }}
              >
                Adventure Levels
              </h2>

              <div className="flex flex-wrap justify-center">
                {levels.map((level, index) => (
                  <div
                    key={level.id}
                    onClick={() => selectLevel(index)}
                    className={`relative w-32 h-32 rounded-2xl flex flex-col items-center justify-center m-2 cursor-pointer transition-all
                      ${
                        unlockedLevels.includes(level.id)
                          ? "bg-gradient-to-b from-[#9B7EBD] to-[#3B1E54] text-white shadow-md"
                          : "bg-gradient-to-b from-[#D4BEE4] to-[#9B7EBD] text-[#3B1E54] opacity-70 cursor-not-allowed"
                      }`}
                  >
                    <i
                      className={`fas ${
                        environmentIcons[level.environment]
                      } text-3xl mb-2`}
                    ></i>
                    <p className="text-center">Level {level.id}</p>
                    {unlockedLevels.includes(level.id) &&
                      level.id === currentLevel.id && (
                        <span className="absolute top-2 right-2 text-sm">
                          <i className="fas fa-star text-yellow-400"></i>
                        </span>
                      )}
                    {!unlockedLevels.includes(level.id) && (
                      <span className="absolute top-2 right-2">
                        <i className="fas fa-lock"></i>
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-lg" style={{ color: colors.secondary }}>
                  Complete levels to unlock new adventures!
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-10 mb-6">
          <p className="text-white">
            Designed especially for kids learning to speak and explore words!
          </p>
        </footer>
      </div>

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
};

export default SpeechGames;
