import React, { useState } from "react";
import { FaPlay, FaStop, FaArrowLeft, FaHome, FaStar } from "react-icons/fa";
import KidsSidebar from "./KidsSidebar"; // Import the KidsSidebar

const Storytelling = () => {
  const [step, setStep] = useState("intro");
  const [recording, setRecording] = useState(false);

  const stories = [
    {
      title: "The Brave Little Rabbit",
      content:
        "Once upon a time, a little rabbit lived in a big forest. He found a shiny golden carrot. To eat it, he had to be brave and cross a dark cave.",
      image: "🐰",
    },
    {
      title: "The Lost Kitten",
      content:
        "Mittens was a fluffy gray kitten who loved to explore. One day, she wandered too far from home. A friendly butterfly helped her find the way back.",
      image: "🐱",
    },
    {
      title: "The Happy Turtle",
      content:
        "Timmy the turtle dreamed of exploring the ocean. He met colorful fish and playful dolphins. A wise old whale taught him about the deep blue sea.",
      image: "🐢",
    },
  ];

  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const story = stories[currentStoryIndex];

  const feedback = {
    pronunciation: "Very Good",
    clarity: "Good",
    score: 9.0,
  };

  const startRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setStep("feedback");
    }, 5000);
  };

  const nextStory = () => {
    setCurrentStoryIndex((prev) => (prev + 1) % stories.length);
    setStep("story");
  };

  const renderStars = (score) => {
    const stars = [];
    const filledStars = Math.floor(score);
    for (let i = 0; i < filledStars; i++) {
      stars.push(<FaStar key={i} className="text-[#9B7EBD] text-2xl" />);
    }
    for (let i = stars.length; i < 10; i++) {
      stars.push(<FaStar key={i} className="text-gray-300 text-2xl" />);
    }
    return stars;
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <KidsSidebar />

      {/* Main Content */}
      <div className="flex-1 relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center [filter:contrast(110%)_saturate(115%)]"
          style={{
            backgroundImage:
              "url('https://i.pinimg.com/1200x/a4/bb/b9/a4bbb9546fdd8658b458fd054bbcda96.jpg')",
          }}
        ></div>

        <div className="relative z-20 flex flex-col items-center justify-center min-h-screen p-4">
          {step !== "intro" && (
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <button
                onClick={() => setStep("intro")}
                className="bg-[#9B7EBD] text-white p-3 rounded-full shadow-md hover:bg-[#3B1E54] transition"
              >
                <FaArrowLeft />
              </button>
              <button
                onClick={() => setStep("intro")}
                className="bg-[#9B7EBD] text-white p-3 rounded-full shadow-md hover:bg-[#3B1E54] transition"
              >
                <FaHome />
              </button>
            </div>
          )}

          {step === "intro" && (
            <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-2xl border-4 border-[#9B7EBD]">
              <h1 className="text-4xl font-bold text-[#3B1E54] mb-4">
                Story Time!
              </h1>
              <div className="text-6xl mb-4">📚</div>
              <p className="text-[#3B1E54] mb-6 text-lg">
                Listen to stories and practice reading!
              </p>
              <button
                onClick={() => setStep("story")}
                className="bg-[#9B7EBD] text-white px-8 py-4 rounded-xl shadow-md hover:bg-[#3B1E54] transition text-xl font-bold"
              >
                Start Reading
              </button>
            </div>
          )}

          {step === "story" && (
            <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-6 border-4 border-[#9B7EBD]">
              <div className="text-center mb-6">
                <div className="text-6xl mb-2">{story.image}</div>
                <h2 className="text-3xl font-bold text-[#3B1E54] mb-2">
                  {story.title}
                </h2>
              </div>

              <div className="bg-[#EEEEEE] p-6 rounded-xl mb-6 border-2 border-[#D4BEE4]">
                <p className="text-[#3B1E54] text-2xl leading-relaxed text-center">
                  {story.content}
                </p>
              </div>

              <div className="text-center">
                {!recording ? (
                  <button
                    onClick={startRecording}
                    className="bg-[#3B1E54] text-white px-8 py-4 rounded-xl shadow-md hover:bg-[#9B7EBD] transition flex items-center justify-center gap-2 mx-auto text-xl font-bold"
                  >
                    <FaPlay /> Start Reading Aloud
                  </button>
                ) : (
                  <div className="text-center">
                    <button
                      className="bg-gray-500 text-white px-8 py-4 rounded-xl flex items-center justify-center gap-2 mx-auto text-xl font-bold mb-4"
                      disabled
                    >
                      <FaStop /> Reading...
                    </button>
                    <div className="flex justify-center space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-3 h-10 bg-[#9B7EBD] rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "feedback" && (
            <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-6 border-4 border-[#9B7EBD]">
              <div className="text-center mb-6">
                <div className="text-6xl mb-2">🎉</div>
                <h2 className="text-3xl font-bold text-[#3B1E54]">
                  Great Job Reading!
                </h2>
              </div>

              <div className="bg-[#EEEEEE] p-6 rounded-xl mb-6 border-2 border-[#D4BEE4]">
                <div className="flex justify-center mb-4">
                  {renderStars(feedback.score)}
                </div>
                <p className="text-2xl font-bold text-[#3B1E54] text-center mb-6">
                  Score: {feedback.score} / 10
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#D4BEE4] p-4 rounded-xl border border-[#9B7EBD]">
                    <p className="text-sm text-[#3B1E54] font-semibold">
                      Pronunciation
                    </p>
                    <p className="text-xl font-bold text-[#9B7EBD]">
                      {feedback.pronunciation}
                    </p>
                  </div>
                  <div className="bg-[#D4BEE4] p-4 rounded-xl border border-[#9B7EBD]">
                    <p className="text-sm text-[#3B1E54] font-semibold">
                      Clarity
                    </p>
                    <p className="text-xl font-bold text-[#9B7EBD]">
                      {feedback.clarity}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={nextStory}
                className="bg-[#9B7EBD] text-white px-8 py-4 rounded-xl shadow-md hover:bg-[#3B1E54] transition w-full text-xl font-bold"
              >
                Read Another Story
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Storytelling;
