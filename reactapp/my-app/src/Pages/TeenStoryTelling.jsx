import React, { useState } from "react";
import { FaPlay, FaStop } from "react-icons/fa";
import bgImage from "./photos/photo6.jpg"; // local background image

const TeenStorytelling = () => {
  const [step, setStep] = useState("intro");
  const [recording, setRecording] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const stories = [
    {
      title: "Shadow of the City",
      content:
        "In a city that never sleeps, Maya navigates hidden alleys to uncover secrets of the underground network. Every decision she makes could change her fate. The neon lights reflect her determination as she moves quietly through the bustling streets, sensing danger in every shadow. She knows this mission is dangerous, but the truth must be revealed.",
    },
    {
      title: "The Lost Signal",
      content:
        "A mysterious signal appears on the edge of the galaxy. Captain Arin must decipher its meaning before rival explorers reach it first. The signal pulses with a rhythm that feels almost alive, echoing across the dark void of space. Each clue uncovers more questions than answers, testing Arin's courage and wits.",
    },
    {
      title: "The Forgotten Journal",
      content:
        "Alex discovers an old journal in the attic. Each entry reveals long-lost secrets and leads them on a thrilling journey across the countryside. The worn pages tell stories of love, betrayal, and hidden treasure. As Alex reads further, the past intertwines with the present, and the adventure becomes personal.",
    },
  ];

  const story = stories[currentStoryIndex];
  const feedback = { confidence: "High", pacing: "Moderate", clarity: "Excellent", score: 8.5 };

  const startRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setStep("feedback");
    }, 5000);
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setStep("story");
    } else {
      setStep("intro");
      setCurrentStoryIndex(0);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: "#EEEEEE",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <style>{`
        .book-content {
          column-count: 2;
          column-gap: 3rem;
          font-family: 'Georgia', serif;
          font-size: 1.125rem;
          line-height: 1.8;
          color: #3B1E54;
        }
        .book-content p:first-letter {
          float: left;
          font-size: 3rem;
          line-height: 1;
          margin-right: 8px;
          color: #9B7EBD;
          font-weight: bold;
        }
        .story-container {
          max-width: 800px;
          background-color: #EEEEEE;
          border: 2px solid #9B7EBD;
          border-radius: 12px;
          padding: 3rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .button-main {
          background-color: #9B7EBD;
          color: #EEEEEE;
          padding: 0.75rem 2rem;
          border-radius: 0.75rem;
          font-weight: bold;
          font-size: 1.125rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: 0.3s;
        }
        .button-main:hover {
          background-color: #3B1E54;
          cursor: pointer;
        }
        .recording-btn {
          background-color: #3B1E54;
          color: #EEEEEE;
        }
      `}</style>

      <div className="story-container">
        {step === "intro" && (
          <div className="text-center">
            <h1 style={{ fontSize: "3rem", fontWeight: "bold", color: "#3B1E54" }}>Story Mode 📖</h1>
            <p style={{ margin: "1.5rem 0", fontSize: "1.25rem", color: "#3B1E54" }}>
              Dive into immersive stories and enhance your reading and storytelling skills.
            </p>
            <button className="button-main" onClick={() => setStep("story")}>
              Begin Reading
            </button>
          </div>
        )}

        {step === "story" && (
          <>
            <h2 style={{ fontSize: "2.25rem", fontWeight: "bold", marginBottom: "2rem", textAlign: "center", color: "#3B1E54" }}>
              {story.title}
            </h2>
            <div className="book-content">
              {story.content.split(". ").map((sentence, idx) => (
                <p key={idx}>{sentence}.</p>
              ))}
            </div>

            {!recording ? (
              <button className="button-main mt-6 w-full flex justify-center items-center gap-2" onClick={startRecording}>
                <FaPlay /> Record Your Reading
              </button>
            ) : (
              <button className="button-main recording-btn mt-6 w-full flex justify-center items-center gap-2" disabled>
                <FaStop /> Recording...
              </button>
            )}
          </>
        )}

        {step === "feedback" && (
          <div className="mt-8 text-center">
            <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#3B1E54", marginBottom: "1rem" }}>Reading Analysis</h2>
            <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {Object.entries(feedback).map(([key, value]) =>
                key !== "score" ? (
                  <div key={key} style={{
                    backgroundColor: "#EEEEEE",
                    border: "2px solid #9B7EBD",
                    borderRadius: "12px",
                    padding: "1rem 1.5rem",
                    margin: "0.5rem",
                    flex: "1 1 40%",
                    minWidth: "140px"
                  }}>
                    <p style={{ fontWeight: "bold", color: "#3B1E54" }}>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                    <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#9B7EBD" }}>{value}</p>
                  </div>
                ) : null
              )}
            </div>
            <p style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#3B1E54", marginBottom: "1.5rem" }}>
              Score: {feedback.score} / 10
            </p>
            <button className="button-main w-full" onClick={nextStory}>
              Next Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeenStorytelling;
