import React, { useEffect, useRef, useState } from "react";
import {
  FaMicrophone,
  FaStop,
  FaPlay,
  FaTrash,
  FaInfoCircle,
  FaDownload,
  FaCopy,
} from "react-icons/fa";
import AdultSidebar from "./AdultSidebar";

export default function Filler() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecognition, setHasRecognition] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [audioURL, setAudioURL] = useState("");
  const [duration, setDuration] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const FILLERS = [
    { key: "um", label: "um" },
    { key: "uh", label: "uh" },
    { key: "like", label: "like" },
    { key: "you know", label: "you know" },
    { key: "so", label: "so" },
    { key: "actually", label: "actually" },
    { key: "basically", label: "basically" },
    { key: "literally", label: "literally" },
    { key: "kind of", label: "kind of" },
    { key: "sort of", label: "sort of" },
  ];

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (SR) {
      setHasRecognition(true);
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (e) => {
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

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mr.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mr.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioURL(URL.createObjectURL(audioBlob));
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
      alert("Microphone access is required to record audio.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (hasRecognition && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    setInterim("");
  };

  const clearSession = () => {
    setIsRecording(false);
    setTranscript("");
    setInterim("");
    setAudioURL("");
    setDuration(0);
    setAnalysis(null);
  };

  const analyzeText = (text) => {
    const clean = text.toLowerCase().replace(/[^\w\s']/g, " ").replace(/\s+/g, " ").trim();
    const words = clean.length ? clean.split(" ") : [];
    const totalWords = words.length;

    const counts = {};
    FILLERS.forEach((f) => (counts[f.key] = 0));
    let remaining = clean;

    const multi = FILLERS.filter((f) => f.key.includes(" "));
    multi.forEach(({ key }) => {
      const regex = new RegExp(`\\b${escapeRegExp(key)}\\b`, "g");
      const matches = remaining.match(regex);
      if (matches) counts[key] += matches.length;
      remaining = remaining.replace(regex, " ");
    });

    const singles = FILLERS.filter((f) => !f.key.includes(" ")).map((f) => f.key);
    remaining.split(" ").filter(Boolean).forEach((w) => {
      if (singles.includes(w)) counts[w] += 1;
    });

    const totalFillers = Object.values(counts).reduce((a, b) => a + b, 0);
    const per100 = totalWords ? Math.round((totalFillers / totalWords) * 10000) / 100 : 0;

    const tips = [];
    if (per100 > 6)
      tips.push("Practice silent pauses: count 'one-two' in your head instead of saying 'um/uh'.");
    if ((counts["like"] || 0) > 2)
      tips.push("Replace casual 'like' with precise words. Rehearse sentences before speaking.");
    if ((counts["you know"] || 0) > 1)
      tips.push("Ask yourself: 'What exactly do I want to say?' Finish thoughts cleanly without 'you know'.");
    if (totalFillers === 0)
      tips.push("Excellent control! Keep your pacing steady and continue practicing clarity.");
    else tips.push("Slow your pace by 10–15%. Breathe every 1–2 sentences to reset.");

    return { counts, totalFillers, totalWords, per100, tips };
  };

  const handleAnalyze = () => {
    const fullText = [transcript, interim].filter(Boolean).join(" ").trim();
    if (!fullText) {
      alert("No transcript found. Speak while recording or paste text manually.");
      return;
    }
    setAnalysis(analyzeText(fullText));
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText([transcript, interim].filter(Boolean).join(" ").trim());
      alert("Transcript copied to clipboard.");
    } catch {
      alert("Copy failed. Select and copy manually.");
    }
  };

  const downloadReport = async () => {
    if (!analysis) return;
    setDownloading(true);
    try {
      const data = {
        createdAt: new Date().toISOString(),
        durationSec: duration,
        transcript: [transcript, interim].filter(Boolean).join(" ").trim(),
        ...analysis,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "filler-report.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const Meter = ({ value = 0, max = 100, label }) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div className="w-full">
        <div className="flex justify-between text-sm text-[#3B1E54] mb-1">
          <span className="font-medium">{label}</span>
          <span>{value}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[#EEEEEE]">
          <div className="h-3 rounded-full bg-[#3B1E54]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  const pad2 = (n) => String(n).padStart(2, "0");
  const mmss = (s) => `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
  const fullTranscript = [transcript, interim].filter(Boolean).join(" ").trim();

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#D4BEE4] text-[#3B1E54]">
      <AdultSidebar />
      <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Filler Word Detection</h1>
            <p className="text-[#9B7EBD]">
              Detects “um”, “uh”, “like”, “you know”, and more—then gives calm, practical tips.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#9B7EBD]">
            <FaInfoCircle />
            {hasRecognition ? (
              <span>Live transcription enabled (Web Speech API)</span>
            ) : (
              <span>Live transcription not supported. Paste or edit transcript manually below.</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left */}
          <section className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">1) Record & Transcribe</h2>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {!isRecording ? (
                <button onClick={startRecording} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B1E54] text-white hover:opacity-90">
                  <FaMicrophone /> Start
                </button>
              ) : (
                <button onClick={stopRecording} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:opacity-90">
                  <FaStop /> Stop
                </button>
              )}
              <button onClick={clearSession} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EEEEEE] text-[#3B1E54] hover:bg-[#D4BEE4]">
                <FaTrash /> Clear
              </button>
              <div className="ml-auto text-sm">Duration: <span className="font-semibold">{mmss(duration)}</span></div>
            </div>

            {audioURL ? (
              <div className="bg-[#EEEEEE] p-3 rounded-xl flex items-center gap-3 mb-4">
                <FaPlay />
                <audio controls src={audioURL} className="w-full" />
              </div>
            ) : (
              <div className="bg-[#EEEEEE] p-3 rounded-xl text-sm text-[#9B7EBD] mb-4">
                No recording yet. Click <span className="font-semibold">Start</span> to speak.
              </div>
            )}

            <label className="block text-sm font-medium mb-2">Transcript</label>
            <textarea
              className="w-full h-40 rounded-xl border border-[#D4BEE4] p-3 outline-none focus:ring-2 focus:ring-[#9B7EBD]"
              placeholder="Your transcript will appear here. You can also paste/edit manually."
              value={fullTranscript}
              onChange={(e) => { setInterim(""); setTranscript(e.target.value); }}
            />
            <div className="flex gap-3 mt-3">
              <button onClick={copyTranscript} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#D4BEE4] text-[#3B1E54] hover:bg-[#EEEEEE]"><FaCopy /> Copy</button>
              <button onClick={handleAnalyze} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B1E54] text-white hover:opacity-90">Analyze Fillers</button>
            </div>
          </section>

          {/* Right */}
          <section className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">2) Analytics & Feedback</h2>

            {!analysis ? (
              <div className="bg-[#EEEEEE] p-4 rounded-xl text-[#9B7EBD]">
                Run an analysis to see filler counts, rate per 100 words, and personalized tips.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-[#EEEEEE] rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">{analysis.totalFillers}</div>
                    <div className="text-xs text-[#9B7EBD]">Total Fillers</div>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">{analysis.totalWords}</div>
                    <div className="text-xs text-[#9B7EBD]">Total Words</div>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">{analysis.per100}%</div>
                    <div className="text-xs text-[#9B7EBD]">Fillers / 100 words</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {FILLERS.map((f) => {
                    const count = analysis.counts[f.key] || 0;
                    const maxForScale = Math.max(5, count * 1.5);
                    return <Meter key={f.key} value={count} max={maxForScale} label={f.label} />;
                  })}
                </div>

                <div className="bg-[#D4BEE4] rounded-xl p-4">
                  <div className="font-semibold mb-2">Suggestions</div>
                  <ul className="list-disc pl-5 text-[#3B1E54]">
                    {analysis.tips.map((t, i) => <li key={i} className="mb-1">{t}</li>)}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  <button onClick={downloadReport} disabled={downloading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B1E54] text-white hover:opacity-90 disabled:opacity-60">
                    <FaDownload /> {downloading ? "Preparing…" : "Download Report"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Practice Prompts */}
        <section className="mt-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">3) Practice Prompts</h3>
            <p className="text-sm text-[#9B7EBD] mb-4">
              Read aloud. Focus on *silent pauses* instead of fillers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <PromptCard text="In the meeting today, I will outline three priorities and then open the floor for questions." />
              <PromptCard text="Thank you for joining. I'll start with a brief overview, followed by key findings and next steps." />
              <PromptCard text="Let me summarize: our goal is clarity, our plan is simple, and our timeline is realistic." />
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}

function PromptCard({ text }) {
  return (
    <div className="bg-[#EEEEEE] p-4 rounded-xl text-[#3B1E54] shadow-sm">
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
