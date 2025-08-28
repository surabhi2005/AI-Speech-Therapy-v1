import React, { useState, useEffect } from "react";
import { FaPlay, FaStop, FaRedo, FaArrowLeft, FaCrown, FaTrophy } from "react-icons/fa";

const TeenGames = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [score, setScore] = useState(0);
  const [currentTwister, setCurrentTwister] = useState(0);
  const [recording, setRecording] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const tongueTwisters = [
    "Unique New York, Unique New York, Unique New York",
    "Red lorry, yellow lorry, red lorry, yellow lorry",
    "She sells seashells by the seashore",
    "Peter Piper picked a peck of pickled peppers",
    "How can a clam cram in a clean cream can"
  ];

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      calculateScore();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startGame = () => {
    setTimeLeft(30);
    setIsActive(true);
    setRecording(true);
    setAttempts(prev => prev + 1);
  };

  const stopGame = () => {
    setIsActive(false);
    setRecording(false);
    calculateScore();
  };

  const calculateScore = () => {
    const accuracy = Math.floor(Math.random() * 30) + 70;
    const speed = Math.floor(Math.random() * 20) + 80;
    const newScore = Math.floor((accuracy * 0.7) + (speed * 0.3));
    
    setScore(newScore);
    if (newScore > bestScore) {
      setBestScore(newScore);
    }
  };

  const nextTwister = () => {
    setCurrentTwister((prev) => (prev + 1) % tongueTwisters.length);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#3B1E54]">
      <div className="max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-[#9B7EBD]">

        {/* Header */}
        <div className="p-5 text-center relative">
          <div className="absolute top-4 left-4">
            <button className="text-white p-2 rounded-full hover:opacity-80 transition bg-[#9B7EBD]">
              <FaArrowLeft />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-white">Tongue Twister Challenge</h1>
          <p className="text-sm opacity-90 mt-1 text-[#D4BEE4]">Test your articulation skills</p>
          
          {/* Score badges */}
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center px-3 py-1 rounded-full bg-[#9B7EBD]">
              <FaTrophy className="text-yellow-300 mr-1" />
              <span className="text-sm text-white">Best: {bestScore}</span>
            </div>
            <div className="flex items-center px-3 py-1 rounded-full bg-[#9B7EBD]">
              <span className="text-sm text-white">Attempts: {attempts}</span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="p-6">

          {/* Timer and Score */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-center">
              <div className="text-sm text-[#D4BEE4]">Time Left</div>
              <div className={`text-4xl font-mono font-bold ${timeLeft < 10 ? 'text-red-300' : 'text-white'}`}>
                {timeLeft}s
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-[#D4BEE4]">Score</div>
              <div className="text-4xl font-bold text-white">{score}</div>
            </div>
          </div>

          {/* Current Tongue Twister */}
          <div className="p-6 rounded-2xl mb-8 bg-[#9B7EBD] border border-[#D4BEE4]">
            <div className="text-center text-sm font-medium mb-3 uppercase tracking-wider text-[#3B1E54]">
              Try saying this clearly:
            </div>
            <div className="text-2xl font-bold text-center mb-6 leading-tight text-white">
              {tongueTwisters[currentTwister]}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-[#3B1E54]">
                Twister {currentTwister + 1} of {tongueTwisters.length}
              </div>
              <button 
                onClick={nextTwister}
                className="text-sm flex items-center transition hover:opacity-80 text-[#3B1E54]"
              >
                <FaRedo className="mr-1 text-xs" /> Next
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="text-center mb-8">
            {!isActive && timeLeft === 0 ? (
              <button
                onClick={startGame}
                className="text-white font-bold py-4 px-10 rounded-full text-lg transition-all transform hover:scale-105 flex items-center justify-center mx-auto shadow-lg bg-[#9B7EBD]"
              >
                <FaPlay className="mr-2" /> Start Challenge
              </button>
            ) : isActive ? (
              <button
                onClick={stopGame}
                className="text-white font-bold py-4 px-10 rounded-full text-lg transition-all flex items-center justify-center mx-auto shadow-lg bg-[#D4BEE4] text-[#3B1E54]"
              >
                <FaStop className="mr-2" /> Stop Recording
              </button>
            ) : (
              <div className="space-y-6">
                <div className="text-xl font-bold text-center text-white">
                  Final Score: <span className="text-[#D4BEE4]">{score}</span>
                </div>
                <button
                  onClick={startGame}
                  className="text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 flex items-center justify-center mx-auto shadow-lg bg-[#9B7EBD]"
                >
                  <FaRedo className="mr-2" /> Try Again
                </button>
              </div>
            )}
          </div>

          {/* Recording Indicator */}
          {recording && (
            <div className="mt-6 text-center animate-pulse">
              <div className="flex justify-center space-x-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-8 rounded-full animate-bounce"
                    style={{ 
                      backgroundColor: "#D4BEE4",
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  ></div>
                ))}
              </div>
              <p className="text-sm text-[#D4BEE4]">Recording in progress... Speak clearly!</p>
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 p-4 rounded-xl bg-[#9B7EBD] border border-[#D4BEE4]">
            <h3 className="font-bold mb-3 flex items-center text-white">
              <FaCrown className="text-yellow-300 mr-2" /> Pro Tips
            </h3>
            <ul className="text-sm space-y-2 text-[#3B1E54]">
              <li className="flex items-start"><span className="mr-2">•</span>Start slowly, then gradually increase your speed</li>
              <li className="flex items-start"><span className="mr-2">•</span>Focus on clear articulation rather than pure speed</li>
              <li className="flex items-start"><span className="mr-2">•</span>Practice difficult sounds separately first</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeenGames;
