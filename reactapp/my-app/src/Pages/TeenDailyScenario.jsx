import React, { useState } from "react";
import TeenSidebar from "./TeenSidebar"; // Make sure the path is correct
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaArrowRight,
  FaHome,
  FaStar,
  FaVolumeUp
} from "react-icons/fa";

const mockScenario = {
  title: "At the School",
  description: "Practice how to reply in common school situations",
  steps: [
    {
      prompt: "Teacher: Good morning! How are you today?",
      expected: "Good morning! I am fine, thank you.",
    },
    {
      prompt: "Teacher: Did you complete your homework?",
      expected: "Yes, I did my homework yesterday.",
    },
  ],
};

const svgPattern = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239A3F3F' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

const DailyScenario = () => {
  const [step, setStep] = useState("intro");
  const [currentLine, setCurrentLine] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const handleStart = () => setStep("practice");

  const handleNext = () => {
    if (currentLine < mockScenario.steps.length - 1) {
      setCurrentLine(currentLine + 1);
    } else {
      setStep("feedback");
    }
  };

  const toggleRecording = () => setIsRecording(!isRecording);

  return (
    <div className="flex min-h-screen">
      {/* Teen Sidebar */}
      <TeenSidebar />

      {/* Main Content */}
      <div className="relative flex-1 p-6 overflow-hidden" style={{ backgroundColor: "#EEEEEE" }}>
        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10 z-0"
          style={{ backgroundImage: `url("${svgPattern}")` }}
        ></div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          {/* Intro */}
          {step === "intro" && (
            <div className="text-center max-w-md bg-[#D4BEE4]/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-[#9B7EBD]/50 transform hover:scale-105 transition-transform duration-300">
              <div className="mb-6">
                <div className="text-6xl mb-4">🏫</div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#3B1E54] to-[#9B7EBD] bg-clip-text text-transparent">
                  Daily Scenario Practice
                </h1>
                <h2 className="text-xl font-semibold text-[#3B1E54] mb-2">{mockScenario.title}</h2>
                <p className="mb-6 text-[#3B1E54]">{mockScenario.description}</p>
              </div>
              
              <div className="flex justify-center mb-8">
                <div className="bg-[#9B7EBD]/50 p-6 rounded-2xl border border-[#3B1E54]/50">
                  <div className="text-5xl">👩‍🏫</div>
                </div>
              </div>
              
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-gradient-to-r from-[#3B1E54] to-[#9B7EBD] text-white rounded-2xl shadow-lg hover:from-[#9B7EBD] hover:to-[#3B1E54] transition-all duration-300 flex items-center justify-center gap-2 mx-auto font-semibold text-lg hover:shadow-xl"
              >
                Start Practice <FaArrowRight />
              </button>
            </div>
          )}

          {/* Practice */}
          {step === "practice" && (
            <div className="bg-[#D4BEE4]/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-2xl text-center border-2 border-[#9B7EBD]/50">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-[#3B1E54] bg-[#EEEEEE] px-3 py-1 rounded-full">
                  Question {currentLine + 1} of {mockScenario.steps.length}
                </span>
                <button 
                  onClick={() => setStep("intro")}
                  className="text-[#3B1E54] hover:text-[#9B7EBD] p-2 rounded-full hover:bg-[#EEEEEE]"
                >
                  <FaHome />
                </button>
              </div>
              
              <div className="mb-8 p-6 bg-[#EEEEEE]/80 rounded-2xl border border-[#9B7EBD]/50">
                <div className="flex items-start justify-center gap-2 mb-4">
                  <div className="text-[#3B1E54] text-xl mt-1">
                    <FaVolumeUp />
                  </div>
                  <p className="text-lg font-medium text-[#3B1E54] text-left">
                    {mockScenario.steps[currentLine].prompt}
                  </p>
                </div>
                
                <div className="bg-[#EEEEEE] p-4 rounded-xl border border-[#9B7EBD]/50">
                  <p className="text-[#9B7EBD] font-medium mb-1">Try saying:</p>
                  <p className="text-[#3B1E54] italic">
                    "{mockScenario.steps[currentLine].expected}"
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={toggleRecording}
                  className={`p-5 rounded-full text-white shadow-lg transition-all duration-300 ${
                    isRecording 
                      ? 'bg-[#3B1E54] animate-pulse' 
                      : 'bg-gradient-to-r from-[#9B7EBD] to-[#D4BEE4] hover:from-[#3B1E54] hover:to-[#9B7EBD]'
                  } hover:shadow-xl`}
                >
                  {isRecording ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
                </button>
                
                <p className="text-sm text-[#3B1E54]">
                  {isRecording ? "Recording... Speak now" : "Tap to record your response"}
                </p>
              </div>

              <button
                onClick={handleNext}
                disabled={isRecording}
                className="mt-8 px-8 py-3 bg-gradient-to-r from-[#9B7EBD] to-[#D4BEE4] text-[#3B1E54] rounded-2xl shadow hover:from-[#3B1E54] hover:to-[#9B7EBD] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto font-semibold hover:shadow-xl"
              >
                {currentLine < mockScenario.steps.length - 1
                  ? "Next Question"
                  : "Finish & Get Feedback"}
                <FaArrowRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyScenario;
