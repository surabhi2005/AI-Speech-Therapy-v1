// import React, { useState, useRef, useEffect } from "react";
// import { FaMicrophone, FaStop, FaPaperPlane, FaUser, FaRobot } from "react-icons/fa";

// export default function AIassistant() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioURL, setAudioURL] = useState("");
//   const [messages, setMessages] = useState([
//     {
//       id: 1,
//       text: "Hi there! I'm your pronunciation assistant. Record your speech and I'll provide feedback to help you improve.",
//       sender: "ai",
//       timestamp: new Date()
//     }
//   ]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [inputText, setInputText] = useState("");
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);
//   const chatContainerRef = useRef(null);

//   useEffect(() => {
//     if (chatContainerRef.current) {
//       chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
//     }
//   }, [messages]);

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       mediaRecorderRef.current = new MediaRecorder(stream);
//       audioChunksRef.current = [];

//       mediaRecorderRef.current.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorderRef.current.onstop = () => {
//         const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
//         const url = URL.createObjectURL(audioBlob);
//         setAudioURL(url);

//         addMessage("🎤 Audio recording sent", "user");
//         simulateAIResponse();
//       };

//       mediaRecorderRef.current.start();
//       setIsRecording(true);
//       addMessage("Recording started... Speak now", "user");
//     } catch (error) {
//       console.error("Error accessing microphone:", error);
//       addMessage("Unable to access microphone. Please check permissions.", "ai");
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//       mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
//     }
//   };

//   const addMessage = (text, sender) => {
//     const newMessage = {
//       id: Date.now(),
//       text,
//       sender,
//       timestamp: new Date()
//     };
//     setMessages(prev => [...prev, newMessage]);
//   };

//   const simulateAIResponse = () => {
//     setIsLoading(true);
//     setTimeout(() => {
//       const feedbackOptions = [
//         {
//           accuracy: 92,
//           mispronounced: [],
//           tip: "Excellent pronunciation! Your speech is clear and easy to understand.",
//           encouragement: "Keep up the great work! 🎉"
//         },
//         {
//           accuracy: 78,
//           mispronounced: ["th", "r"],
//           tip: "Try to soften your 'th' sound and roll your 'r' more naturally.",
//           encouragement: "Good effort! Practice makes perfect. 💪"
//         },
//         {
//           accuracy: 85,
//           mispronounced: ["s"],
//           tip: "Your 's' sounds are slightly sharp. Try making them softer.",
//           encouragement: "You're making great progress! 🌟"
//         },
//         {
//           accuracy: 65,
//           mispronounced: ["th", "w", "v"],
//           tip: "Focus on differentiating between 'w' and 'v' sounds, and practice the 'th' sound.",
//           encouragement: "Don't worry, everyone starts somewhere! Keep practicing. 📚"
//         }
//       ];

//       const randomFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];

//       addMessage(`I've analyzed your pronunciation. Here's my feedback:\n
// Accuracy: ${randomFeedback.accuracy}%
// ${randomFeedback.mispronounced.length > 0 ? 
// `Sounds to practice: ${randomFeedback.mispronounced.join(", ")}` : 
// "All sounds were clear!"}

// Tip: ${randomFeedback.tip}

// ${randomFeedback.encouragement}`, "ai");

//       setIsLoading(false);
//     }, 2000);
//   };

//   const handleTextSubmit = (e) => {
//     e.preventDefault();
//     if (inputText.trim()) {
//       addMessage(inputText, "user");
//       setInputText("");
//       setIsLoading(true);
//       setTimeout(() => {
//         const responses = [
//           "I'm here to help with your pronunciation. Try recording some speech for me to analyze!",
//           "You can send me audio recordings by pressing the microphone button.",
//           "I specialize in helping improve pronunciation. Record a sentence or two for feedback.",
//           "Let me know if you have any specific sounds or words you'd like to practice!"
//         ];
//         addMessage(responses[Math.floor(Math.random() * responses.length)], "ai");
//         setIsLoading(false);
//       }, 1000);
//     }
//   };

//   const formatTime = (date) => {
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#D4BEE4] p-4 flex flex-col items-center">
//       <h1 className="text-3xl font-bold text-[#3B1E54] mb-2 mt-4">AI Pronunciation Assistant</h1>
//       <p className="text-[#9B7EBD] mb-6">Chat with me and I'll help improve your pronunciation</p>

//       <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg flex flex-col h-[70vh] mb-4">
//         <div className="bg-[#3B1E54] text-white p-4 rounded-t-2xl flex items-center">
//           <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
//           <span className="font-semibold">AI Pronunciation Coach</span>
//         </div>

//         <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
//           {messages.map((message) => (
//             <div
//               key={message.id}
//               className={`flex mb-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
//             >
//               {message.sender === "ai" && (
//                 <div className="w-8 h-8 rounded-full bg-[#3B1E54] flex items-center justify-center mr-2 flex-shrink-0">
//                   <FaRobot className="text-white" />
//                 </div>
//               )}

//               <div className={`max-w-xs md:max-w-md rounded-2xl p-3 ${message.sender === "user" ? "bg-[#D4BEE4] text-[#3B1E54]" : "bg-[#EEEEEE] text-[#3B1E54]"}`}>
//                 <p className="whitespace-pre-line">{message.text}</p>
//                 <span className="text-xs opacity-70 block mt-1">{formatTime(message.timestamp)}</span>
//               </div>

//               {message.sender === "user" && (
//                 <div className="w-8 h-8 rounded-full bg-[#9B7EBD] flex items-center justify-center ml-2 flex-shrink-0">
//                   <FaUser className="text-white" />
//                 </div>
//               )}
//             </div>
//           ))}

//           {isLoading && (
//             <div className="flex mb-4 justify-start">
//               <div className="w-8 h-8 rounded-full bg-[#3B1E54] flex items-center justify-center mr-2">
//                 <FaRobot className="text-white" />
//               </div>
//               <div className="bg-[#EEEEEE] rounded-2xl p-3">
//                 <div className="flex space-x-2">
//                   <div className="w-2 h-2 bg-[#3B1E54] rounded-full animate-bounce"></div>
//                   <div className="w-2 h-2 bg-[#3B1E54] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
//                   <div className="w-2 h-2 bg-[#3B1E54] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="p-4 border-t border-gray-200">
//           <form onSubmit={handleTextSubmit} className="flex items-center">
//             <input
//               type="text"
//               value={inputText}
//               onChange={(e) => setInputText(e.target.value)}
//               placeholder="Type a message or record audio..."
//               className="flex-1 bg-gray-100 rounded-l-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#3B1E54]"
//               disabled={isRecording}
//             />

//             <button
//               type="submit"
//               className="bg-[#3B1E54] text-white p-2 rounded-r-xl hover:bg-[#9B7EBD] transition-colors"
//               disabled={isRecording || !inputText.trim()}
//             >
//               <FaPaperPlane />
//             </button>

//             <button
//               type="button"
//               onClick={isRecording ? stopRecording : startRecording}
//               className={`ml-2 p-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-[#3B1E54]"} text-white hover:opacity-90 transition-all`}
//             >
//               {isRecording ? <FaStop /> : <FaMicrophone />}
//             </button>
//           </form>

//           {isRecording && (
//             <div className="mt-2 text-center">
//               <div className="flex justify-center items-center text-red-500">
//                 <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
//                 <span>Recording... Click to stop</span>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {audioURL && (
//         <div className="bg-white p-4 rounded-2xl shadow-md w-full max-w-md mb-4">
//           <h3 className="text-lg font-semibold text-[#3B1E54] mb-2">Your Recording</h3>
//           <audio controls src={audioURL} className="w-full" />
//         </div>
//       )}

//       <div className="bg-white p-4 rounded-2xl shadow-md w-full max-w-md">
//         <h3 className="text-lg font-semibold text-[#3B1E54] mb-2">💡 Tips for best results</h3>
//         <ul className="list-disc list-inside text-[#9B7EBD] space-y-1">
//           <li>Speak clearly and at a natural pace</li>
//           <li>Record in a quiet environment</li>
//           <li>Practice challenging sounds multiple times</li>
//           <li>Try reading sentences from books or articles</li>
//         </ul>
//       </div>
//     </div>
//   );
// }


import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaStop, FaRobot, FaUser, FaVolumeUp, FaArrowRight } from "react-icons/fa";

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
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        addMessage("Just recorded my pronunciation", "user");
        simulateAIResponse();

        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
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
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender, timestamp: new Date() }]);
  };

  const simulateAIResponse = () => {
    setIsLoading(true);
    setTimeout(() => {
      const feedbackOptions = [
        { accuracy: 92, mispronounced: [], tip: "Excellent pronunciation!", encouragement: "Keep it up! 🎉" },
        { accuracy: 85, mispronounced: ["s"], tip: "Soften your 's' sounds.", encouragement: "You're improving! 🌟" },
        { accuracy: 78, mispronounced: ["th", "r"], tip: "Relax your 'th' and roll your 'r'.", encouragement: "Keep practicing! 💪" }
      ];

      const feedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];

      addMessage(
        `I've analyzed your pronunciation:\n\nAccuracy: ${feedback.accuracy}%\n` +
        (feedback.mispronounced.length ? `Sounds to practice: ${feedback.mispronounced.join(", ")}\n` : "All sounds were clear!\n") +
        `Tip: ${feedback.tip}\n\n${feedback.encouragement}`,
        "ai"
      );

      setIsLoading(false);
    }, 2000);
  };

  const nextExercise = () => {
    const nextIndex = (currentExercise + 1) % exercises.length;
    setCurrentExercise(nextIndex);
    addMessage(`Let's try this phrase: "${exercises[nextIndex].phrase}"`, "ai");
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
