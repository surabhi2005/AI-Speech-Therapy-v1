// src/Pages/AIassistant.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaStop, FaRobot, FaUser, FaVolumeUp, FaArrowRight } from "react-icons/fa";

/*
  === EDIT MARKER START ===
  Changes: integrate frontend with ML API (/score + /feedback).
  - Convert MediaRecorder blob -> resampled WAV (16k, mono, 16-bit PCM)
  - POST to /score and /feedback (API base configurable)
  - Play returned base64 audio if present, fallback to speechSynthesis
  - Kept existing UI and minimal logic changes
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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatContainerRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const canvasRef = useRef(null);

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
    // If source is stereo or multi, mix down to mono
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

  // Play a base64-encoded WAV returned by backend
  const playBase64Audio = (b64) => {
    try {
      const blob = base64ToBlob(b64, "audio/wav");
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play().catch((e) => console.warn("Playback failed:", e));
      audio.onended = () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.warn("playBase64Audio failed:", err);
    }
  };

  // === END helpers ===

  const startRecording = async () => {
    try {
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
    } catch (error) {
      console.error("Error accessing microphone:", error);
      addMessage("Unable to access microphone. Please check permissions.", "ai");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      try {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        // ignore
      }
    }
  };

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender, timestamp: new Date() }]);
  };

  // === EDIT: replace simulateAIResponse with actual backend pipeline
  // keep function name simulateAIResponse to minimize changes elsewhere
  const simulateAIResponse = async () => {
    // acts as compatibility wrapper
    await processRecordingAndSend();
  };

  // Main pipeline: convert recorded chunks -> WAV -> POST /score -> POST /feedback -> update UI & play audio
  const processRecordingAndSend = async () => {
    setIsLoading(true);
    // show typing UI
    // (do not add AI bubble here; feedback will be added after result)
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

      // Optionally, show a short summary in chat (non-intrusive)
      // Remove the "Analyzing..." AI bubble we added earlier, replace with actual feedback later.
      // We'll append the official feedback paragraph from /feedback.

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
      // Replace last AI 'Analyzing...' message with real feedback to avoid duplicate AI bubbles
      setMessages(prev => {
        // find the last AI bubble that matches "Analyzing your pronunciation..." and replace it
        const foundIndex = prev.findIndex((m) => m.sender === "ai" && m.text && m.text.startsWith("Analyzing your pronunciation"));
        if (foundIndex >= 0) {
          const newArr = [...prev];
          newArr[foundIndex] = { id: Date.now(), text: feedbackText, sender: "ai", timestamp: new Date() };
          return newArr;
        } else {
          // fallback: append
          return [...prev, { id: Date.now(), text: feedbackText, sender: "ai", timestamp: new Date() }];
        }
      });

      // Play audio if returned
      if (fbJson.audio_base64) {
        try {
          playBase64Audio(fbJson.audio_base64);
        } catch (e) {
          console.warn("Playing base64 audio failed, falling back to speechSynthesis.", e);
          // fallback to TTS local speech
          try {
            const utterance = new SpeechSynthesisUtterance(feedbackText);
            speechSynthesis.speak(utterance);
          } catch (e2) {
            console.warn("speechSynthesis fallback failed:", e2);
          }
        }
      } else {
        // No server audio, fallback to browser TTS
        try {
          const utterance = new SpeechSynthesisUtterance(feedbackText);
          speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn("speechSynthesis playback failed:", e);
        }
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
      // keep audioContext closed (already closed in onstop handler finish)
    }
  };

  // === END EDIT ===

  const nextExercise = () => {
    const nextIndex = (currentExercise + 1) % exercises.length;
    setCurrentExercise(nextIndex);
    addMessage(`Let's try this phrase: "${exercises[nextIndex].phrase}"`, "ai");
    const utterance = new SpeechSynthesisUtterance(`Let's try this phrase: ${exercises[nextIndex].phrase}`);
    speechSynthesis.speak(utterance);
  };

  const playExample = () => {
    const utterance = new SpeechSynthesisUtterance(exercises[currentExercise].phrase);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
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
          <div className="w-full md:w-2/5 bg-gradient-to-b from-[#D4BEE4] to-[#9B7EBD] p-5 flex flex-col justify-between">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <h2 className="text-xl font-bold text-[#3B1E54] mb-2">Current Practice</h2>
              <div className="bg-[#EEEEEE] rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-[#3B1E54] mb-2">Try saying:</h3>
                <p className="text-lg font-medium text-center text-[#3B1E54]">
                  {exercises[currentExercise].phrase}
                </p>
              </div>
              <button
                onClick={playExample}
                className="flex items-center justify-center w-full bg-[#3B1E54] text-white py-2 rounded-lg mb-4 hover:bg-[#9B7EBD] transition-colors"
              >
                <FaVolumeUp className="mr-2" /> Hear Example
              </button>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <h3 className="font-semibold text-[#3B1E54] mb-3">Tips</h3>
              <ul className="text-sm text-[#3B1E54] space-y-2">
                <li>• Speak slowly and clearly</li>
                <li>• Articulate each sound</li>
                <li>• Record multiple times</li>
                <li>• Practice regularly</li>
              </ul>
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
                  className="p-4 rounded-full bg-[#9B7EBD] text-white hover:bg-[#3B1E54] transition-colors"
                >
                  <FaArrowRight />
                </button>
              </div>
              <p className="text-center text-[#3B1E54] mt-3">
                {isRecording ? "Recording... Click to stop" : "Click the microphone to start recording"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
