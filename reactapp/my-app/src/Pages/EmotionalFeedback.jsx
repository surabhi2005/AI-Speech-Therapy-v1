import React, { useState } from "react";
import { FaMicrophone, FaStop, FaSmile, FaLaugh, FaMeh, FaTired, FaVolumeUp } from "react-icons/fa";
import AdultSidebar from "./AdultSidebar";

const EmotionalFeedback = () => {
  const [recording, setRecording] = useState(false);
  const [results, setResults] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(false);

  const startRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setResults({
        Happy: 65,
        Excited: 15,
        Calm: 12,
        Nervous: 8,
      });
    }, 3000);
  };

  const getEmotionIcon = (emotion) => {
    switch(emotion) {
      case "Happy": return <FaLaugh className="text-yellow-500 text-2xl" />;
      case "Excited": return <FaSmile className="text-orange-500 text-2xl" />;
      case "Calm": return <FaMeh className="text-blue-500 text-2xl" />;
      case "Nervous": return <FaTired className="text-purple-500 text-2xl" />;
      default: return <FaSmile className="text-gray-500 text-2xl" />;
    }
  };

  const getFeedback = () => {
    if (!results) return "";
    const dominant = Object.keys(results).reduce((a, b) => results[a] > results[b] ? a : b);
    switch (dominant) {
      case "Happy":
        return "Wow! You sound so happy and cheerful! 😊 Keep spreading those good vibes!";
      case "Excited":
        return "You sound super excited! 🎉 That energy is contagious!";
      case "Calm":
        return "You have such a calm and peaceful voice! 🍃 Perfect for storytelling!";
      case "Nervous":
        return "It sounds like you might be a little nervous. Try taking a deep breath and smiling! 😊";
      default:
        return "Great job! Keep practicing to make your voice even more expressive!";
    }
  };

  const playExample = () => {
    setPlayingAudio(true);
    setTimeout(() => setPlayingAudio(false), 3000);
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#EEEEEE" }}>
      <AdultSidebar/>
      <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 text-center" style={{ backgroundColor: "#3B1E54" }}>
          <h1 className="text-3xl font-bold text-white mb-2">Emotion Detective 🕵‍♂</h1>
          <p className="text-[#D4BEE4]">Discover the emotions in your voice!</p>
        </div>

        {/* Main Content */}
        <div className="p-6" style={{ backgroundColor: "#D4BEE4" }}>
          {/* Recording Section */}
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6 text-center">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${recording ? 'bg-[#3B1E54]' : 'bg-[#EEEEEE]'}`}>
              {recording ? (
                <FaStop className="text-white text-3xl" />
              ) : (
                <FaMicrophone className="text-[#3B1E54] text-3xl" />
              )}
            </div>
            <button
              onClick={startRecording}
              disabled={recording}
              className="px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              style={{ backgroundColor: recording ? "#9B7EBD" : "#3B1E54", color: "#EEEEEE" }}
            >
              {recording ? (
                <span className="flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
                  Listening...
                </span>
              ) : "Start Detective Work!"}
            </button>
            {recording && <p className="mt-4 text-[#3B1E54]">Speak now... I'm listening carefully!</p>}
          </div>

          {/* Results Section */}
          {results && (
            <div className="space-y-6">
              {/* Emotion Bars */}
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6" style={{ color: "#3B1E54" }}>Emotion Report 📊</h2>
                <div className="space-y-4">
                  {Object.entries(results).map(([emotion, value]) => (
                    <div key={emotion} className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center mr-3">
                        {getEmotionIcon(emotion)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium" style={{ color: "#3B1E54" }}>{emotion}</span>
                          <span className="font-bold" style={{ color: "#9B7EBD" }}>{value}%</span>
                        </div>
                        <div className="w-full rounded-full h-4 bg-[#EEEEEE]">
                          <div
                            className="h-4 rounded-full transition-all duration-1000"
                            style={{ width: `${value}%`, backgroundColor: "#3B1E54" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: "#3B1E54" }}>
                  <span className="mr-2">💡</span> Detective's Findings
                </h3>
                <div className="p-4 rounded-xl bg-[#EEEEEE]">
                  <p className="text-lg" style={{ color: "#3B1E54" }}>{getFeedback()}</p>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-3" style={{ color: "#3B1E54" }}>Try this exercise:</h4>
                  <div className="flex items-start bg-[#EEEEEE] p-4 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: "#3B1E54" }}>"The happy hippo hopped hurriedly!"</p>
                      <p className="text-sm mt-1" style={{ color: "#9B7EBD" }}>Say this with different emotions!</p>
                    </div>
                    <button
                      onClick={playExample}
                      className="p-3 rounded-full ml-2"
                      style={{ backgroundColor: "#3B1E54", color: "#EEEEEE" }}
                      disabled={playingAudio}
                    >
                      <FaVolumeUp />
                    </button>
                  </div>
                </div>
              </div>

              {/* Try Again */}
              <div className="text-center">
                <button
                  onClick={() => setResults(null)}
                  className="px-6 py-3 rounded-full font-medium"
                  style={{ backgroundColor: "#9B7EBD", color: "#EEEEEE" }}
                >
                  Analyze Another Recording
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-sm" style={{ backgroundColor: "#3B1E54", color: "#D4BEE4" }}>
          <p>Keep practicing to become an emotion detection expert! 🌟</p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default EmotionalFeedback;
