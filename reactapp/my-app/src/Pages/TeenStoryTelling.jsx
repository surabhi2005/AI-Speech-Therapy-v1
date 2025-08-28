import React, { useState } from "react";
import TeenSidebar from "./TeenSidebar"; // <-- Import your TeenSidebar
import { FaPlay, FaStop, FaArrowLeft, FaHome, FaStar } from "react-icons/fa";

const TeenStorytelling = () => {
  const [step, setStep] = useState("intro");
  const [recording, setRecording] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const stories = [
    {
      title: "The Mountain of Challenges",
      content:
        "Aria had always dreamed of climbing the tallest mountain near her town. Everyone told her it was impossible at her age, but she trained every morning. When she finally reached the top, she didn’t just see the view—she saw proof of her determination.",
      image: "⛰",
    },
    {
      title: "The Hidden Library",
      content:
        "Ethan discovered a dusty old key in his grandfather’s attic. Following a series of clues, he stumbled upon a secret underground library. Inside, the books glowed faintly, holding stories and knowledge long forgotten by the world.",
      image: "📖",
    },
    {
      title: "The Courage to Speak",
      content:
        "Maya was terrified of public speaking. But when her class needed someone to represent them in a debate, she stepped up. Her voice trembled at first, then grew stronger—and by the end, the entire hall applauded her courage.",
      image: "🎤",
    },
  ];

  const story = stories[currentStoryIndex];
  const feedback = { pronunciation: "Excellent", clarity: "Very Clear", score: 9.2 };

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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <TeenSidebar />

      {/* Main Content */}
      <div className="flex-1 relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center [filter:contrast(115%)_saturate(120%)]"
          style={{
            backgroundImage:
              "url('https://i.pinimg.com/736x/06/70/c0/0670c038502df7edf5987211a050502f.jpg')",
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
                Teen Storytelling
              </h1>
              <div className="text-6xl mb-4">✨</div>
              <p className="text-[#3B1E54] mb-6 text-lg">
                Explore inspiring stories and practice your voice.
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
                <p className="text-[#4A5D9D] text-xl leading-relaxed text-left">
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
                <div className="text-6xl mb-2">🌟</div>
                <h2 className="text-3xl font-bold text-[#3B1E54]">
                  Amazing Effort!
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
                    <p className="text-sm text-[#3B1E54] font-semibold">Clarity</p>
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

export default TeenStorytelling;
