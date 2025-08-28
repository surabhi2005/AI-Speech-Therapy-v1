import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaStop, FaPaperPlane, FaUser, FaRobot } from "react-icons/fa";

export default function AIassistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi there! I'm your pronunciation assistant. Record your speech and I'll provide feedback to help you improve.",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        addMessage("🎤 Audio recording sent", "user");
        simulateAIResponse();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      addMessage("Recording started... Speak now", "user");
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
    const newMessage = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateAIResponse = () => {
    setIsLoading(true);
    setTimeout(() => {
      const feedbackOptions = [
        {
          accuracy: 92,
          mispronounced: [],
          tip: "Excellent pronunciation! Your speech is clear and easy to understand.",
          encouragement: "Keep up the great work! 🎉"
        },
        {
          accuracy: 78,
          mispronounced: ["th", "r"],
          tip: "Try to soften your 'th' sound and roll your 'r' more naturally.",
          encouragement: "Good effort! Practice makes perfect. 💪"
        },
        {
          accuracy: 85,
          mispronounced: ["s"],
          tip: "Your 's' sounds are slightly sharp. Try making them softer.",
          encouragement: "You're making great progress! 🌟"
        },
        {
          accuracy: 65,
          mispronounced: ["th", "w", "v"],
          tip: "Focus on differentiating between 'w' and 'v' sounds, and practice the 'th' sound.",
          encouragement: "Don't worry, everyone starts somewhere! Keep practicing. 📚"
        }
      ];

      const randomFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];

      addMessage(`I've analyzed your pronunciation. Here's my feedback:\n
Accuracy: ${randomFeedback.accuracy}%
${randomFeedback.mispronounced.length > 0 ? 
`Sounds to practice: ${randomFeedback.mispronounced.join(", ")}` : 
"All sounds were clear!"}

Tip: ${randomFeedback.tip}

${randomFeedback.encouragement}`, "ai");

      setIsLoading(false);
    }, 2000);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      addMessage(inputText, "user");
      setInputText("");
      setIsLoading(true);
      setTimeout(() => {
        const responses = [
          "I'm here to help with your pronunciation. Try recording some speech for me to analyze!",
          "You can send me audio recordings by pressing the microphone button.",
          "I specialize in helping improve pronunciation. Record a sentence or two for feedback.",
          "Let me know if you have any specific sounds or words you'd like to practice!"
        ];
        addMessage(responses[Math.floor(Math.random() * responses.length)], "ai");
        setIsLoading(false);
      }, 1000);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#D4BEE4] p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-[#3B1E54] mb-2 mt-4">AI Pronunciation Assistant</h1>
      <p className="text-[#9B7EBD] mb-6">Chat with me and I'll help improve your pronunciation</p>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg flex flex-col h-[70vh] mb-4">
        <div className="bg-[#3B1E54] text-white p-4 rounded-t-2xl flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
          <span className="font-semibold">AI Pronunciation Coach</span>
        </div>

        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "ai" && (
                <div className="w-8 h-8 rounded-full bg-[#3B1E54] flex items-center justify-center mr-2 flex-shrink-0">
                  <FaRobot className="text-white" />
                </div>
              )}

              <div className={`max-w-xs md:max-w-md rounded-2xl p-3 ${message.sender === "user" ? "bg-[#D4BEE4] text-[#3B1E54]" : "bg-[#EEEEEE] text-[#3B1E54]"}`}>
                <p className="whitespace-pre-line">{message.text}</p>
                <span className="text-xs opacity-70 block mt-1">{formatTime(message.timestamp)}</span>
              </div>

              {message.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-[#9B7EBD] flex items-center justify-center ml-2 flex-shrink-0">
                  <FaUser className="text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex mb-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#3B1E54] flex items-center justify-center mr-2">
                <FaRobot className="text-white" />
              </div>
              <div className="bg-[#EEEEEE] rounded-2xl p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-[#3B1E54] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#3B1E54] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-[#3B1E54] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleTextSubmit} className="flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message or record audio..."
              className="flex-1 bg-gray-100 rounded-l-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#3B1E54]"
              disabled={isRecording}
            />

            <button
              type="submit"
              className="bg-[#3B1E54] text-white p-2 rounded-r-xl hover:bg-[#9B7EBD] transition-colors"
              disabled={isRecording || !inputText.trim()}
            >
              <FaPaperPlane />
            </button>

            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`ml-2 p-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-[#3B1E54]"} text-white hover:opacity-90 transition-all`}
            >
              {isRecording ? <FaStop /> : <FaMicrophone />}
            </button>
          </form>

          {isRecording && (
            <div className="mt-2 text-center">
              <div className="flex justify-center items-center text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span>Recording... Click to stop</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {audioURL && (
        <div className="bg-white p-4 rounded-2xl shadow-md w-full max-w-md mb-4">
          <h3 className="text-lg font-semibold text-[#3B1E54] mb-2">Your Recording</h3>
          <audio controls src={audioURL} className="w-full" />
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-md w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#3B1E54] mb-2">💡 Tips for best results</h3>
        <ul className="list-disc list-inside text-[#9B7EBD] space-y-1">
          <li>Speak clearly and at a natural pace</li>
          <li>Record in a quiet environment</li>
          <li>Practice challenging sounds multiple times</li>
          <li>Try reading sentences from books or articles</li>
        </ul>
      </div>
    </div>
  );
}
