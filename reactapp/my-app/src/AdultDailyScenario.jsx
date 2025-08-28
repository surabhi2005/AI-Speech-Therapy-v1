import React, { useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaArrowRight, FaRedo, FaHome, FaStar, FaVolumeUp } from "react-icons/fa";

const adultScenario = {
  title: "At the Workplace",
  description: "Practice responding in professional office situations",
  steps: [
    {
      prompt: "Manager: Good morning, did you review the report I sent yesterday?",
      expected: "Good morning! Yes, I reviewed it and noted a few points for discussion."
    },
    {
      prompt: "Colleague: Could you help me with the client presentation?",
      expected: "Of course! I can review your slides and provide feedback by noon."
    },
    {
      prompt: "HR: How do you feel about the upcoming team changes?",
      expected: "I think the changes are positive, and I'm ready to adapt and support the team."
    },
    {
      prompt: "Manager: We need to finalize the quarterly targets today.",
      expected: "Understood. I have prepared a draft and can present it in the meeting."
    }
  ]
};

const adultFeedback = [
  {
    score: 90,
    feedback: "Excellent! Professional tone and clear articulation.",
    strengths: ["Confident tone", "Correct grammar", "Structured response"],
    improvements: ["Maintain slightly slower pace for clarity"]
  },
  {
    score: 78,
    feedback: "Good attempt, clear willingness to help, but sentence could be more concise.",
    strengths: ["Polite", "Helpful attitude"],
    improvements: ["Make responses more concise"]
  },
  {
    score: 85,
    feedback: "Well done, optimistic and professional tone.",
    strengths: ["Positive tone", "Professional language"],
    improvements: ["Slightly reduce filler words"]
  },
  {
    score: 88,
    feedback: "Great preparation, clear structure.",
    strengths: ["Structured answer", "Confident"],
    improvements: ["Ensure concise phrasing for meetings"]
  }
];

const svgPattern = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239A3F3F' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

const AdultScenario = () => {
  const [step, setStep] = useState("intro");
  const [currentLine, setCurrentLine] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const handleStart = () => setStep("practice");

  const handleNext = () => {
    if (currentLine < adultScenario.steps.length - 1) {
      setCurrentLine(currentLine + 1);
    } else {
      setStep("feedback");
    }
  };

  const toggleRecording = () => setIsRecording(!isRecording);

  const renderScoreStars = (score) => {
    const stars = [];
    const starCount = Math.floor(score / 20);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={i < starCount ? "text-[#9B7EBD]" : "text-[#D4BEE4]"} 
        />
      );
    }
    return stars;
  };

  return (
    <div className="relative min-h-screen p-6 overflow-hidden" style={{ backgroundColor: "#EEEEEE" }}>
      <div
        className="absolute inset-0 opacity-10 z-0"
        style={{ backgroundImage: `url("${svgPattern}")` }}
      ></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        {/* Intro */}
        {step === "intro" && (
          <div className="text-center max-w-md bg-[#D4BEE4]/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-[#9B7EBD]/50 transform hover:scale-105 transition-transform duration-300">
            <div className="mb-6">
              <div className="text-6xl mb-4">💼</div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#3B1E54] to-[#9B7EBD] bg-clip-text text-transparent">
                Adult Scenario Practice
              </h1>
              <h2 className="text-xl font-semibold text-[#3B1E54] mb-2">{adultScenario.title}</h2>
              <p className="mb-6 text-[#3B1E54]">{adultScenario.description}</p>
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
          <div className="bg-[#D4BEE4]/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-3xl text-center border-2 border-[#9B7EBD]/50">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-[#3B1E54] bg-[#EEEEEE] px-3 py-1 rounded-full">
                Question {currentLine + 1} of {adultScenario.steps.length}
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
                  {adultScenario.steps[currentLine].prompt}
                </p>
              </div>
              
              <div className="bg-[#EEEEEE] p-4 rounded-xl border border-[#9B7EBD]/50">
                <p className="text-[#9B7EBD] font-medium mb-1">Suggested Response:</p>
                <p className="text-[#3B1E54] italic">
                  "{adultScenario.steps[currentLine].expected}"
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
              {currentLine < adultScenario.steps.length - 1
                ? "Next Question"
                : "Finish & Get Feedback"}
              <FaArrowRight />
            </button>
          </div>
        )}

        {/* Feedback */}
        {step === "feedback" && (
          <div className="bg-[#D4BEE4]/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-3xl text-center border-2 border-[#9B7EBD]/50">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#3B1E54] to-[#9B7EBD] bg-clip-text text-transparent">
                Feedback Summary
              </h2>
              <p className="text-[#3B1E54] mt-2">Here's your performance on the practice scenario</p>
            </div>

            <div className="space-y-6 mb-8">
              {adultScenario.steps.map((line, index) => (
                <div
                  key={index}
                  className="border rounded-2xl p-5 bg-gradient-to-br from-[#EEEEEE]/80 to-[#D4BEE4]/80 text-left shadow-sm backdrop-blur-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-[#3B1E54] mb-1">{line.prompt}</p>
                      <p className="text-[#9B7EBD] text-sm">Your reply: "{line.expected}"</p>
                    </div>
                    <span className="text-xs font-semibold bg-[#9B7EBD]/30 text-[#3B1E54] px-2 py-1 rounded-full">
                      Q{index + 1}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-[#3B1E54]">Score:</span>
                    <span className="text-[#9B7EBD] font-bold">{adultFeedback[index].score}%</span>
                    <div className="flex ml-2">
                      {renderScoreStars(adultFeedback[index].score)}
                    </div>
                  </div>
                  
                  <div className="bg-[#EEEEEE]/80 p-3 rounded-lg mb-3">
                    <p className="text-[#3B1E54] text-sm">{adultFeedback[index].feedback}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#D4BEE4]/80 p-2 rounded-lg">
                      <span className="font-semibold text-[#9B7EBD]">Strengths:</span>
                      <ul className="mt-1">
                        {adultFeedback[index].strengths.map((item, i) => (
                          <li key={i} className="text-[#3B1E54]">✓ {item}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-[#EEEEEE]/80 p-2 rounded-lg">
                      <span className="font-semibold text-[#9B7EBD]">Improve:</span>
                      <ul className="mt-1">
                        {adultFeedback[index].improvements.map((item, i) => (
                          <li key={i} className="text-[#3B1E54]">↳ {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setStep("intro");
                  setCurrentLine(0);
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#3B1E54] to-[#9B7EBD] text-white rounded-2xl shadow hover:from-[#9B7EBD] hover:to-[#3B1E54] transition-all flex items-center gap-2 hover:shadow-xl"
              >
                <FaHome /> Home
              </button>
              
              <button
                onClick={() => {
                  setStep("practice");
                  setCurrentLine(0);
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#9B7EBD] to-[#D4BEE4] text-[#3B1E54] rounded-2xl shadow hover:from-[#3B1E54] hover:to-[#9B7EBD] transition-all flex items-center gap-2 hover:shadow-xl"
              >
                <FaRedo /> Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdultScenario;
