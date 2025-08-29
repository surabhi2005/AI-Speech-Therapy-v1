// src/Pages/AIassistant.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaStop, FaRobot, FaUser, FaVolumeUp, FaArrowRight } from "react-icons/fa";

/*
  === EDIT MARKER START ===
  Changes:
   - Added automatic silence-based stop (VAD-like) while recording.
   - Added centralized playback control to prevent overlapping audio (HTML Audio & speechSynthesis).
   - Minor UX: disable Next while recording/loading; stop playback when recording starts or next is clicked.
  Purpose: fix "audios mixing" and "manual stop" problems you reported.
  === EDIT MARKER END ===
*/

export default function AIassistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Welcome! I'm your pronunciation coach. Press the microphone button and read the phrase aloud. I'll analyze your pronunciation and provide feedback.",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatContainerRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const canvasRef = useRef(null);

  // New refs for silence detection and playback management
  const silenceIntervalRef = useRef(null);
  const lastLoudAtRef = useRef(0);
  const recordingStartAtRef = useRef(0);
  const playbackRef = useRef(null); // { type: 'audio'|'synth', audio, url } or null

  // Pronunciation exercises
  const exercises = [
    { title: "Common Phrases", phrase: "She sells seashells by the seashore" },
    { title: "Vowel Sounds", phrase: "The blue moon blew through the roof" },
    { title: "Consonant Practice", phrase: "Freshly squeezed orange juice" },
    { title: "Complex Sentences", phrase: "The psychologist wrote a prescription for the phenomenon" }
  ];

  // API base URL (change via env if needed)
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup on unmount: stop playback, clear intervals
  useEffect(() => {
    return () => {
      // cancel waveform animation
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      // stop playback if any
      stopPlayback();
      // clear interval
      if (silenceIntervalRef.current) {
        clearInterval(silenceIntervalRef.current);
        silenceIntervalRef.current = null;
      }
      // close audio context
      try {
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Waveform animation during recording
  useEffect(() => {
    if (isRecording) {
      const drawWaveform = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#3B1E54";
        ctx.beginPath();

        const sliceWidth = width / dataArrayRef.current.length;
        let x = 0;

        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const v = dataArrayRef.current[i] / 128.0;
          const y = v * height / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.stroke();

        // Center line
        ctx.beginPath();
        ctx.strokeStyle = "#D4BEE4";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        animationRef.current = requestAnimationFrame(drawWaveform);
      };

      animationRef.current = requestAnimationFrame(drawWaveform);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording]);

  // === Helper utilities (audio conversion & playback) ===

  // Convert Float32 samples [-1..1] to 16-bit PCM and create WAV Blob
  const audioBufferToWavBlob = (audioBuffer) => {
    const numChannels = Math.min(1, audioBuffer.numberOfChannels); // force mono
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const result = new Float32Array(length);
    if (audioBuffer.numberOfChannels === 1) {
      result.set(audioBuffer.getChannelData(0));
    } else {
      // average channels
      const chCount = audioBuffer.numberOfChannels;
      for (let ch = 0; ch < chCount; ch++) {
        const data = audioBuffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          result[i] = (result[i] || 0) + data[i] / chCount;
        }
      }
    }
    // Convert to 16-bit PCM
    const buffer = new ArrayBuffer(44 + result.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, "RIFF");
    /* file length */
    view.setUint32(4, 36 + result.length * 2, true);
    /* RIFF type */
    writeString(view, 8, "WAVE");
    /* format chunk identifier */
    writeString(view, 12, "fmt ");
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channels * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, "data");
    /* data chunk length */
    view.setUint32(40, result.length * 2, true);

    // write the PCM samples
    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, result[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset, s, true);
    }

    return new Blob([view], { type: "audio/wav" });
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Convert recorded blob (any mime) -> resampled WAV Blob at 16000 Hz mono (if possible)
  const convertRecordedBlobToWav = async (blob, targetSampleRate = 16000) => {
    try {
      // Ensure there's an AudioContext to decode
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const arrayBuffer = await blob.arrayBuffer();
      // decode into AudioBuffer
      const decoded = await audioContextRef.current.decodeAudioData(arrayBuffer.slice(0));

      // If sample rate already matches, use it (but we still downmix to mono)
      if (Math.abs(decoded.sampleRate - targetSampleRate) < 1e-6) {
        return audioBufferToWavBlob(decoded);
      }

      // Try resampling using OfflineAudioContext
      try {
        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
          1,
          Math.ceil(decoded.duration * targetSampleRate),
          targetSampleRate
        );
        const bufferSource = offlineCtx.createBufferSource();
        bufferSource.buffer = decoded;
        bufferSource.connect(offlineCtx.destination);
        bufferSource.start(0);
        const rendered = await offlineCtx.startRendering();
        return audioBufferToWavBlob(rendered);
      } catch (err) {
        // If resampling fails, fallback to returning original sample rate WAV (server will resample)
        console.warn("OfflineAudioContext/resample failed, falling back to original sample rate WAV:", err);
        return audioBufferToWavBlob(decoded);
      }
    } catch (err) {
      console.error("convertRecordedBlobToWav error:", err);
      throw err;
    }
  };

  // base64 -> Blob helper
  const base64ToBlob = (b64, mime = "audio/wav") => {
    const binary = atob(b64);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) buffer[i] = binary.charCodeAt(i);
    return new Blob([buffer.buffer], { type: mime });
  };

  // Centralized playback stop helper
  const stopPlayback = () => {
    try {
      if (playbackRef.current) {
        if (playbackRef.current.type === "audio" && playbackRef.current.audio) {
          try {
            playbackRef.current.audio.pause();
          } catch (e) {
            // ignore
          }
          try {
            URL.revokeObjectURL(playbackRef.current.url);
          } catch (e) {
            // ignore
          }
        } else if (playbackRef.current.type === "synth") {
          try {
            // cancel all queued/playing synth utterances
            window.speechSynthesis.cancel();
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore
    } finally {
      playbackRef.current = null;
    }
  };

  // Play a base64-encoded WAV returned by backend (uses centralized playback)
  const playBase64Audio = (b64) => {
    try {
      stopPlayback(); // ensure nothing else is playing
      const blob = base64ToBlob(b64, "audio/wav");
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      playbackRef.current = { type: "audio", audio, url };
      audio.play().catch((e) => console.warn("Playback failed:", e));
      audio.onended = () => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
        if (playbackRef.current && playbackRef.current.type === "audio") playbackRef.current = null;
      };
    } catch (err) {
      console.warn("playBase64Audio failed:", err);
    }
  };

  // Synthesis via browser TTS with central playback handling
  const speakWithBrowserTTS = (text, rate = 1.0) => {
    try {
      stopPlayback();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      playbackRef.current = { type: "synth" };
      utterance.onend = () => {
        if (playbackRef.current && playbackRef.current.type === "synth") playbackRef.current = null;
      };
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("speakWithBrowserTTS failed:", e);
    }
  };

  // === END helpers ===

  const startRecording = async () => {
    try {
      // Stop any playing audio before recording
      stopPlayback();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio analysis setup
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      // Media recorder
      // prefer 'audio/webm' if available, but we will decode and convert to WAV on client
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/wav";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Keep previous behavior of adding a user bubble, then run backend pipeline
      mediaRecorderRef.current.onstop = async () => {
        addMessage("Just recorded my pronunciation", "user");

        // stop and clear silence interval (safety)
        if (silenceIntervalRef.current) {
          clearInterval(silenceIntervalRef.current);
          silenceIntervalRef.current = null;
        }

        // kick off analysis (this will update UI and add AI reply)
        try {
          await processRecordingAndSend();
        } catch (err) {
          console.error("Processing/analysis failed:", err);
          addMessage("Sorry — analysis failed. Please try again.", "ai");
        } finally {
          // close audio context now that we're done (free resources)
          try {
            if (audioContextRef.current) {
              await audioContextRef.current.close();
              audioContextRef.current = null;
            }
          } catch (e) {
            audioContextRef.current = null;
          }
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // setup silence detection
      lastLoudAtRef.current = performance.now();
      recordingStartAtRef.current = performance.now();

      const SILENCE_THRESHOLD = 0.02; // RMS threshold (tune if needed)
      const SILENCE_MS = 800; // stop after 800 ms of silence
      const MIN_RECORD_MS = 300; // minimum recording length to accept auto-stop

      // polling checker (lightweight)
      silenceIntervalRef.current = setInterval(() => {
        try {
          if (!analyserRef.current || !dataArrayRef.current) return;
          analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const v = (dataArrayRef.current[i] - 128) / 128.0;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArrayRef.current.length);
          if (rms > SILENCE_THRESHOLD) {
            lastLoudAtRef.current = performance.now();
          }
          const silenceElapsed = performance.now() - lastLoudAtRef.current;
          const recordedMs = performance.now() - recordingStartAtRef.current;
          if (silenceElapsed > SILENCE_MS && recordedMs > MIN_RECORD_MS) {
            // auto-stop
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              try {
                // stopRecording will clear tracks & set state
                stopRecording();
              } catch (e) {
                // ignore
              }
            }
          }
        } catch (e) {
          // ignore occasional errors
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      addMessage("Unable to access microphone. Please check permissions.", "ai");
    }
  };

  const stopRecording = () => {
    if (!(mediaRecorderRef.current && isRecording)) return;
    try {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {
      // ignore
    }
    setIsRecording(false);
    try {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      // ignore
    }
    // clear silence interval
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
  };

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender, timestamp: new Date() }]);
  };

  // compatibility wrapper kept for previous naming
  const simulateAIResponse = async () => {
    await processRecordingAndSend();
  };

  // Main pipeline: convert recorded chunks -> WAV -> POST /score -> POST /feedback -> update UI & play audio
  const processRecordingAndSend = async () => {
    setIsLoading(true);
    // show typing UI
    addMessage("Analyzing your pronunciation...", "ai");

    try {
      // Build Blob from chunks
      const recordedBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || "audio/webm" });

      // Convert to WAV (resampled to 16k if possible)
      const wavBlob = await convertRecordedBlobToWav(recordedBlob, 16000);

      // Prepare multipart form for /score
      const fd = new FormData();
      fd.append("expected", exercises[currentExercise].phrase);
      fd.append("audio", wavBlob, "recording.wav");

      // POST /score
      const scoreResp = await fetch(`${API_BASE}/score`, {
        method: "POST",
        body: fd
      });

      if (!scoreResp.ok) {
        const txt = await scoreResp.text();
        throw new Error(`/score failed: ${scoreResp.status} ${txt}`);
      }
      const scoringResult = await scoreResp.json();

      // POST /feedback - send scoring JSON (and optionally an age param)
      const fbResp = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoring_result: scoringResult, age: "adult" })
      });

      if (!fbResp.ok) {
        const txt = await fbResp.text();
        throw new Error(`/feedback failed: ${fbResp.status} ${txt}`);
      }
      const fbJson = await fbResp.json();

      // fbJson expected: { text: "...", audio_base64: "..." } (audio_base64 optional)
      const feedbackText = fbJson.text || fbJson.feedback || "Great job!";

      // Replace the "Analyzing..." AI bubble with real feedback
      setMessages(prev => {
        const foundIndex = prev.findIndex((m) => m.sender === "ai" && m.text && m.text.startsWith("Analyzing your pronunciation"));
        if (foundIndex >= 0) {
          const newArr = [...prev];
          newArr[foundIndex] = { id: Date.now(), text: feedbackText, sender: "ai", timestamp: new Date() };
          return newArr;
        } else {
          return [...prev, { id: Date.now(), text: feedbackText, sender: "ai", timestamp: new Date() }];
        }
      });

      // Play audio if returned; ensure we stop any existing playback first
      if (fbJson.audio_base64) {
        try {
          playBase64Audio(fbJson.audio_base64);
        } catch (e) {
          console.warn("Playing base64 audio failed, falling back to browser TTS.", e);
          speakWithBrowserTTS(feedbackText, 1.0);
        }
      } else {
        // No server audio, fallback to browser TTS
        speakWithBrowserTTS(feedbackText, 1.0);
      }

      // Clear recorded chunks so the next recording starts fresh
      audioChunksRef.current = [];
    } catch (err) {
      console.error("processRecordingAndSend error:", err);
      // replace the "Analyzing..." bubble with failure message
      setMessages(prev => {
        const foundIndex = prev.findIndex((m) => m.sender === "ai" && m.text && m.text.startsWith("Analyzing your pronunciation"));
        if (foundIndex >= 0) {
          const newArr = [...prev];
          newArr[foundIndex] = { id: Date.now(), text: "Sorry — analysis failed. Please try again.", sender: "ai", timestamp: new Date() };
          return newArr;
        }
        return [...prev, { id: Date.now(), text: "Sorry — analysis failed. Please try again.", sender: "ai", timestamp: new Date() }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Next exercise: stop playback, announce, and add message. Disable while recording/loading.
  const nextExercise = () => {
    if (isRecording || isLoading) return;
    stopPlayback();
    const nextIndex = (currentExercise + 1) % exercises.length;
    setCurrentExercise(nextIndex);
    const msg = `Let's try this phrase: "${exercises[nextIndex].phrase}"`;
    addMessage(msg, "ai");
    // Use browser TTS for prompt (centralized)
    speakWithBrowserTTS(msg, 0.95);
  };

  const playExample = () => {
    if (isRecording || isLoading) return;
    stopPlayback();
    const phrase = exercises[currentExercise].phrase;
    speakWithBrowserTTS(phrase, 0.9);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1E54] to-[#9B7EBD] p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B1E54] to-[#9B7EBD] text-white p-5 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mr-3">
              <FaRobot className="text-[#3B1E54] text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pronunciation Coach</h1>
              <p className="text-[#D4BEE4]">Practice and improve your speaking skills</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Exercise Panel */}
          <div className="w-full md:w-2/5 bg-gradient-to-b from-[#D4BEE4] to-[#9B7EBD] p-5 flex flex-col min-w-[260px] h-full">
            <div className="flex flex-col h-full">
              {/* Phrase & Example */}
              <div className="bg-white rounded-xl p-4 shadow-md flex flex-col mb-4">
                <h2 className="text-xl font-bold text-[#3B1E54] mb-2">Current Practice</h2>
                <div className="bg-[#EEEEEE] rounded-lg p-4 mb-4 flex flex-col items-center max-h-40 overflow-y-auto">
                  <p
                    className="text-lg font-medium text-[#3B1E54] text-center break-words"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      maxWidth: "100%",
                      minHeight: "2.5rem",
                      padding: "0.5rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {exercises[currentExercise].phrase}
                  </p>
                </div>
                <button
                  onClick={playExample}
                  disabled={isRecording || isLoading}
                  className={`flex items-center justify-center w-full bg-[#3B1E54] text-white py-2 rounded-lg mb-2 hover:bg-[#9B7EBD] transition-colors ${isRecording || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <FaVolumeUp className="mr-2" /> Hear Example
                </button>
              </div>
              {/* Tips - always visible, sticky on bottom for tall paragraphs */}
              <div className="bg-white rounded-xl p-4 shadow-md mt-auto">
                <h3 className="font-semibold text-[#3B1E54] mb-3">Tips</h3>
                <ul className="text-sm text-[#3B1E54] space-y-2">
                  <li>• Speak slowly and clearly</li>
                  <li>• Articulate each sound</li>
                  <li>• Record multiple times</li>
                  <li>• Practice regularly</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="w-full md:w-3/5 flex flex-col">
            <div ref={chatContainerRef} className="flex-1 p-5 overflow-y-auto bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "ai" && (
                    <div className="w-10 h-10 rounded-full bg-[#3B1E54] flex items-center justify-center mr-3 flex-shrink-0">
                      <FaRobot className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-xs md:max-w-md rounded-2xl p-4 ${
                      message.sender === "user"
                        ? "bg-[#D4BEE4] text-[#3B1E54]"
                        : "bg-white text-[#3B1E54] shadow-md"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.text}</p>
                  </div>
                  {message.sender === "user" && (
                    <div className="w-10 h-10 rounded-full bg-[#9B7EBD] flex items-center justify-center ml-3 flex-shrink-0">
                      <FaUser className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex mb-4 justify-start">
                  <div className="w-10 h-10 rounded-full bg-[#3B1E54] flex items-center justify-center mr-3">
                    <FaRobot className="text-white" />
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-[#3B1E54] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#3B1E54] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-[#3B1E54] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="p-5 bg-white border-t border-gray-200 flex flex-col items-center">
              {isRecording && (
                <div className="w-full mb-4 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
                  <canvas ref={canvasRef} className="w-full h-full" width={600} height={80} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[#3B1E54] bg-white/80 px-3 py-1 rounded-full text-sm font-medium">
                      Recording...
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-5 rounded-full text-white text-lg font-semibold flex items-center justify-center
                    ${isRecording ? "bg-red-500 animate-pulse" : "bg-[#3B1E54] hover:bg-[#9B7EBD]"} 
                    transition-all w-16 h-16`}
                >
                  {isRecording ? <FaStop /> : <FaMicrophone />}
                </button>
                <button
                  onClick={nextExercise}
                  disabled={isRecording || isLoading}
                  className={`p-4 rounded-full bg-[#9B7EBD] text-white hover:bg-[#3B1E54] transition-colors ${isRecording || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <FaArrowRight />
                </button>
              </div>
              <p className="text-center text-[#3B1E54] mt-3">
                {isRecording ? "Recording... Automatically stops when you pause" : "Click the microphone to start recording"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
