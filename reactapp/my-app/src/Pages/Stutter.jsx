import React, { useEffect, useRef, useState } from "react";
import {
  FaMicrophone,
  FaStop,
  FaPlay,
  FaTrash,
  FaLightbulb,
  FaDownload,
} from "react-icons/fa";

/**
 * KidsDashboard.jsx - Stutter Detection & Support
 * Palette: #3B1E54, #9B7EBD, #D4BEE4, #EEEEEE
 * No lucide-react used.
 */

export default function Stutter() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [hasRecognition, setHasRecognition] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize speech recognition if supported
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (SR) {
      setHasRecognition(true);
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = "en-US";

      r.onresult = (e) => {
        let finalText = "";
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const chunk = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += chunk + " ";
          else interimText += chunk + " ";
        }
        if (finalText) setTranscript((prev) => (prev + " " + finalText).trim());
        setInterim(interimText.trim());
      };

      recognitionRef.current = r;
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Format seconds to mm:ss
  const mmss = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      };

      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setDuration(0);

      if (hasRecognition && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    } catch (err) {
      alert("Microphone permission required to record.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (hasRecognition && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    setInterim("");
  };

  const clearAll = () => {
    setIsRecording(false);
    setAudioURL("");
    setTranscript("");
    setInterim("");
    setDuration(0);
    setAnalysis(null);
  };

  // Stutter detection algorithm
  function analyzeStutter(text) {
    const raw = (text || "").trim();
    if (!raw) return null;

    const normalized = raw
      .replace(/\u2019/g, "'")
      .replace(/[^\w\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    const words = normalized.split(" ").filter(Boolean);

    // Repetition detection
    const repetitionOccurrences = [];
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] === words[i + 1]) {
        let j = i + 1;
        while (j < words.length && words[j] === words[i]) j++;
        const count = j - i;
        const contextStart = Math.max(0, i - 3);
        const contextEnd = Math.min(words.length, j + 3);
        repetitionOccurrences.push({
          kind: "repetition",
          token: words[i],
          startIndex: i,
          length: count,
          context: words.slice(contextStart, contextEnd).join(" "),
        });
        i = j - 1;
      }
    }

    // Prolongation detection
    const prolongationOccurrences = [];
    words.forEach((w, idx) => {
      const match = w.match(/([a-z])\1{2,}/);
      if (match) {
        const ch = match[1];
        const contextStart = Math.max(0, idx - 3);
        const contextEnd = Math.min(words.length, idx + 3);
        prolongationOccurrences.push({
          kind: "prolongation",
          token: w,
          char: ch,
          index: idx,
          context: words.slice(contextStart, contextEnd).join(" "),
        });
      }
    });

    // Hyphenated syllable repeats
    const hyphenatedOccurrences = [];
    const rawTokens = raw.split(/\s+/);
    rawTokens.forEach((tk, idx) => {
      const lower = tk.toLowerCase();
      const parts = lower.split(/[-–—]+/).filter(Boolean);
      if (parts.length >= 2 && parts[0] === parts[1]) {
        hyphenatedOccurrences.push({
          kind: "hyphen-repeat",
          token: tk,
          parts,
          index: idx,
          context: rawTokens.slice(Math.max(0, idx - 3), idx + 4).join(" "),
        });
      }
    });

    const totalReps = repetitionOccurrences.length + hyphenatedOccurrences.length;
    const totalProlong = prolongationOccurrences.length;
    const totalStutterLike = totalReps + totalProlong;

    const suggestions = [];
    if (totalReps > 1)
      suggestions.push(
        "We noticed repeated word starts (e.g., 'I I I'). Try gentle pacing: inhale, then speak the next phrase."
      );
    if (totalProlong > 0)
      suggestions.push(
        "Prolongations detected (e.g., stretched sounds). Practice light articulatory contact and pause to reset your airflow."
      );
    if (hyphenatedOccurrences.length > 0)
      suggestions.push(
        "Syllable repetitions like 'ba-ba-' found. Try practicing syllable-by-syllable slowing, then blend smoothly."
      );
    if (totalStutterLike === 0)
      suggestions.push(
        "No stutter-like patterns detected in this clip — great control! Keep practicing fluency drills."
      );
    else
      suggestions.push(
        "Try slow-reading exercises (1. slow, 2. normal, 3. fast) focusing on breath control."
      );

    return {
      totalRepetitions: totalReps,
      totalProlongations: totalProlong,
      totalHyphenRepeats: hyphenatedOccurrences.length,
      totalDetected: totalStutterLike,
      repetitions: repetitionOccurrences,
      prolongations: prolongationOccurrences,
      hyphenated: hyphenatedOccurrences,
      suggestions,
      normalized,
    };
  }

  const handleAnalyze = () => {
    const txt = [transcript, interim].filter(Boolean).join(" ").trim();
    if (!txt) {
      alert("No transcript to analyze. Record or paste text into the transcript box.");
      return;
    }
    setAnalysis(analyzeStutter(txt));
  };

  const downloadReport = () => {
    if (!analysis) return;
    setDownloading(true);
    const payload = {
      createdAt: new Date().toISOString(),
      duration,
      transcript: [transcript, interim].filter(Boolean).join(" ").trim(),
      analysis,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stutter-report.json";
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "#EEEEEE", color: "#3B1E54" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stutter Detection & Support</h1>
            <p className="text-sm mt-1" style={{ color: "#9B7EBD" }}>
              Detects repetitions and prolongations, then gives supportive, practical tips.
            </p>
          </div>
          <div className="text-sm text-[#9B7EBD]">
            {hasRecognition
              ? "Live transcription enabled"
              : "Live transcription not supported — paste transcript"}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Recorder & Transcript */}
          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold mb-3">1) Record / Transcribe</h2>
            <div className="flex items-center gap-3 mb-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B1E54] text-white"
                >
                  <FaMicrophone /> Start
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white"
                >
                  <FaStop /> Stop
                </button>
              )}

              <button
                onClick={() => {
                  setTranscript("");
                  setInterim("");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EEEEEE] text-[#3B1E54] border border-[#D4BEE4]"
              >
                <FaTrash /> Clear Text
              </button>

              <div className="ml-auto text-sm text-[#9B7EBD]">Duration: {mmss(duration)}</div>
            </div>

            {/* Audio playback */}
            <div className="mb-4">
              {audioURL ? (
                <div className="bg-[#EEEEEE] p-3 rounded-xl flex items-center gap-3">
                  <FaPlay />
                  <audio controls src={audioURL} className="w-full" />
                </div>
              ) : (
                <div className="bg-[#EEEEEE] p-3 rounded-xl text-sm text-[#9B7EBD]">
                  No recording yet — click Start to record.
                </div>
              )}
            </div>

            <label className="block text-sm font-medium mb-2">Transcript</label>
            <textarea
              value={[transcript, interim].filter(Boolean).join(" ").trim()}
              onChange={(e) => {
                setTranscript(e.target.value);
                setInterim("");
              }}
              placeholder="Transcript will appear (or paste/enter text here)."
              className="w-full h-40 p-3 rounded-xl border border-[#D4BEE4] focus:ring-2 focus:ring-[#9B7EBD] outline-none"
            />

            <div className="flex gap-3 mt-3">
              <button
                onClick={handleAnalyze}
                className="px-4 py-2 rounded-lg bg-[#3B1E54] text-white"
              >
                Analyze Stutter
              </button>
            </div>
          </section>

          {/* Right: Results & Tips */}
          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold mb-3">2) Results & Support</h2>

            {!analysis ? (
              <div className="bg-[#EEEEEE] p-4 rounded-xl text-[#9B7EBD]">
                Run analysis to see repetitions, prolongations, context examples and supportive guidance.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-[#EEEEEE] rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">{analysis.totalRepetitions}</div>
                    <div className="text-sm text-[#9B7EBD]">Repetitions</div>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">{analysis.totalProlongations}</div>
                    <div className="text-sm text-[#9B7EBD]">Prolongations</div>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">{analysis.totalHyphenRepeats}</div>
                    <div className="text-sm text-[#9B7EBD]">Syllable Repeats</div>
                  </div>
                </div>

                {/* Lists of occurrences */}
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Detected Examples</h3>

                  {analysis.repetitions.length === 0 &&
                    analysis.prolongations.length === 0 &&
                    analysis.hyphenated.length === 0 && (
                      <div className="text-sm text-[#3B1E54]">No stutter-like patterns found in the transcript.</div>
                    )}

                  {analysis.repetitions.map((r, idx) => (
                    <div key={"rep-" + idx} className="p-3 mb-2 rounded-lg bg-[#EEEEEE]">
                      <div className="text-sm text-[#3B1E54]">
                        🔁 Repetition of "<span className="font-semibold">{r.token}</span>" ×{r.length}
                      </div>
                      <div className="text-xs text-[#9B7EBD] mt-1">Context: {r.context}</div>
                    </div>
                  ))}

                  {analysis.hyphenated.map((h, idx) => (
                    <div key={"hy-" + idx} className="p-3 mb-2 rounded-lg bg-[#EEEEEE]">
                      <div className="text-sm text-[#3B1E54]">🔁 Syllable-repeat: <span className="font-semibold">{h.token}</span></div>
                      <div className="text-xs text-[#9B7EBD] mt-1">Context: {h.context}</div>
                    </div>
                  ))}

                  {analysis.prolongations.map((p, idx) => (
                    <div key={"pro-" + idx} className="p-3 mb-2 rounded-lg bg-[#EEEEEE]">
                      <div className="text-sm text-[#3B1E54]">➰ Prolongation in "<span className="font-semibold">{p.token}</span>"</div>
                      <div className="text-xs text-[#9B7EBD] mt-1">Context: {p.context}</div>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                <div className="bg-[#D4BEE4] p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FaLightbulb className="text-[#3B1E54]" />
                    <h4 className="font-semibold">Supportive Suggestions</h4>
                  </div>
                  <ul className="list-disc pl-5 text-[#3B1E54]">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="mb-1 text-sm">{s}</li>
                    ))}
                  </ul>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={downloadReport}
                      className="px-3 py-2 rounded-lg bg-[#3B1E54] text-white disabled:opacity-60"
                      disabled={downloading}
                    >
                      <FaDownload /> {downloading ? "Preparing…" : "Download Report"}
                    </button>

                    <button
                      onClick={() => {
                        alert("Try the 'stretch-release' drill: say gentle syllables (pa-pa-pa) slowly, then blend.");
                      }}
                      className="px-3 py-2 rounded-lg bg-[#EEEEEE] text-[#3B1E54] border border-[#D4BEE4]"
                    >
                      Practice Drill
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Practice Prompts */}
        <section className="mt-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold mb-2">Practice Prompts</h3>
            <p className="text-sm text-[#9B7EBD] mb-4">
              Use calming, short drills. Focus on breath before speaking and gentle, continuous airflow.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <PracticeCard text="Pa-pa-pa — lighting, landing, lively." />
              <PracticeCard text="Take a breath — then: 'I will present the plan clearly.'" />
              <PracticeCard text="Slow blend: 'ba—na—na' then 'banana'." />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Practice card component
function PracticeCard({ text }) {
  return (
    <div className="bg-[#EEEEEE] p-4 rounded-xl text-[#3B1E54] shadow-sm">
      <p className="text-sm">{text}</p>
    </div>
  );
}
