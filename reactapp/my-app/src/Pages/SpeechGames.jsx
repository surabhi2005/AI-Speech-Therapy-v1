import React, { useState, useEffect } from "react";
import KidsSidebar from "./KidsSidebar"; // <-- Import KidsSidebar

// Vocacare color palette
const colors = {
  primary: "#3B1E54",
  secondary: "#9B7EBD",
  accent: "#D4BEE4",
  background: "#EEEEEE",
};

// Environment icons
const environmentIcons = {
  Forest: "fa-tree",
  Farm: "fa-tractor",
  Garden: "fa-seedling",
  Playground: "fa-slide",
  Farmyard: "fa-cow",
  "Sports Field": "fa-running",
  Classroom: "fa-book",
  "Magic Forest": "fa-dragon",
};

// Levels data
const levels = [
  { id: 1, title: "Level 1: Single-Syllable Words", environment: "Forest", prompts: ["cat", "dog", "ball", "sun", "hat", "cup"], unlocked: true },
  { id: 2, title: "Level 2: Two-Syllable Words", environment: "Farm", prompts: ["apple", "bunny", "cookie", "flower", "puppy", "tiger"], unlocked: false },
  { id: 3, title: "Level 3: Short Phrases", environment: "Garden", prompts: ["I see a cat", "The dog runs", "Pick the ball", "The sun is hot"], unlocked: false },
  { id: 4, title: "Level 4: Descriptive Words", environment: "Playground", prompts: ["The cat is big", "The dog is small", "I am happy", "I am sad"], unlocked: false },
  { id: 5, title: "Level 5: Animals & Sounds", environment: "Farmyard", prompts: ["The cow says moo", "The dog barks", "The bird sings"], unlocked: false },
  { id: 6, title: "Level 6: Actions & Verbs", environment: "Sports Field", prompts: ["I jump high", "I run fast", "I clap my hands", "The dog sleeps"], unlocked: false },
  { id: 7, title: "Level 7: Questions & Answers", environment: "Classroom", prompts: ["Where is the cat?", "What is in the box?", "Who is running?"], unlocked: false },
  { id: 8, title: "Level 8: Story Sentences", environment: "Magic Forest", prompts: ["I saw a cat chasing a butterfly", "The dog is playing with a ball", "I like to eat apples"], unlocked: false },
];

const SpeechGames = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);

  const currentLevel = levels[levelIndex];
  const currentPrompt = currentLevel.prompts[promptIndex];

  useEffect(() => {
    const newUnlocked = [...unlockedLevels];
    if (!newUnlocked.includes(levelIndex + 1) && levelIndex + 1 > 1) {
      newUnlocked.push(levelIndex + 1);
      setUnlockedLevels(newUnlocked);
    }
  }, [levelIndex]);

  const startListening = () => {
    if (!window.webkitSpeechRecognition) {
      alert("Speech recognition not supported in your browser");
      return;
    }

    setIsListening(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      setIsListening(false);
      const spoken = e.results[0][0].transcript.toLowerCase();
      if (spoken.includes(currentPrompt.toLowerCase())) {
        setMessage("🎉 Great job!");
        setScore((prev) => prev + 1);
        setTimeout(() => {
          setMessage("");
          if (promptIndex + 1 < currentLevel.prompts.length) {
            setPromptIndex(promptIndex + 1);
          } else if (levelIndex + 1 < levels.length) {
            setLevelIndex(levelIndex + 1);
            setPromptIndex(0);
          } else {
            setMessage("🏆 Adventure Completed!");
          }
        }, 1200);
      } else {
        setMessage("❌ Try Again!");
        setTimeout(() => setMessage(""), 1500);
      }
    };

    recognition.onerror = () => {
      setMessage("❌ Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const selectLevel = (index) => {
    if (unlockedLevels.includes(index + 1)) {
      setLevelIndex(index);
      setPromptIndex(0);
    }
  };

  const progressPercentage =
    ((levelIndex + promptIndex / currentLevel.prompts.length) / levels.length) * 100;

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(to bottom, #3B1E54, #9B7EBD)" }}>
      {/* Kids Sidebar */}
      <KidsSidebar />

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-md mt-4">
            Vocacare: Speech Games
          </h1>
          <p className="text-xl text-white mt-2">Learn words through fun adventures!</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center mb-6">
              <div className="environment-icon mb-4">
                <i
                  className={`fas ${environmentIcons[currentLevel.environment]} text-4xl`}
                  style={{ color: colors.primary }}
                ></i>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>
                {currentLevel.title}
              </h2>
              <p className="text-lg mb-4" style={{ color: colors.secondary }}>
                {currentLevel.environment} Adventure
              </p>

              <div className="my-6">
                <div
                  className="w-28 h-28 mx-auto rounded-full flex items-center justify-center text-white text-5xl"
                  style={{
                    background: `linear-gradient(to bottom, ${colors.primary}, ${colors.secondary})`,
                  }}
                >
                  <i className="fas fa-child"></i>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-md mb-6 relative">
                <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                  Say: "{currentPrompt}"
                </p>
              </div>

              <button
                onClick={startListening}
                disabled={isListening}
                className={`flex items-center justify-center mx-auto font-bold px-6 py-3 rounded-full text-white transition-all
                  ${isListening ? "bg-purple-700" : "bg-[#3B1E54] hover:bg-[#9B7EBD]"}`}
              >
                {isListening ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-2"></i> Listening...
                  </>
                ) : (
                  <>
                    <i className="fas fa-microphone mr-2"></i> Speak Now
                  </>
                )}
              </button>

              {message && (
                <div
                  className={`mt-4 text-xl font-semibold ${
                    message.includes("🎉") ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="mt-6">
                <p className="text-xl font-bold" style={{ color: colors.primary }}>
                  Score: {score}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-center" style={{ color: colors.primary }}>
                Your Progress
              </h3>
              <div className="w-full h-5 bg-gray-200 rounded-full mb-2">
                <div
                  className="h-5 rounded-full transition-all duration-500 flex items-center justify-center text-xs text-white font-bold"
                  style={{
                    width: `${progressPercentage}%`,
                    background: `linear-gradient(to right, ${colors.secondary}, ${colors.primary})`,
                  }}
                >
                  {Math.round(progressPercentage)}%
                </div>
              </div>
              <p className="text-center" style={{ color: colors.secondary }}>
                Level {levelIndex + 1} of {levels.length}
              </p>
            </div>
          </div>

          {/* Right Column - Levels */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.primary }}>
                Adventure Levels
              </h2>

              <div className="flex flex-wrap justify-center">
                {levels.map((level, index) => (
                  <div
                    key={level.id}
                    onClick={() => selectLevel(index)}
                    className={`relative w-32 h-32 rounded-2xl flex flex-col items-center justify-center m-2 cursor-pointer transition-all
                      ${
                        unlockedLevels.includes(level.id)
                          ? "bg-gradient-to-b from-[#9B7EBD] to-[#3B1E54] text-white shadow-md"
                          : "bg-gradient-to-b from-[#D4BEE4] to-[#9B7EBD] text-[#3B1E54] opacity-70"
                      }`}
                  >
                    <i className={`fas ${environmentIcons[level.environment]} text-3xl mb-2`}></i>
                    <p className="text-center">Level {level.id}</p>
                    {unlockedLevels.includes(level.id) && level.id === currentLevel.id && (
                      <span className="absolute top-2 right-2 text-sm">
                        <i className="fas fa-star text-yellow-400"></i>
                      </span>
                    )}
                    {!unlockedLevels.includes(level.id) && (
                      <span className="absolute top-2 right-2">
                        <i className="fas fa-lock"></i>
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-lg" style={{ color: colors.secondary }}>
                  Complete levels to unlock new adventures!
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-10 mb-6">
          <p className="text-white">Designed especially for kids learning to speak and explore words!</p>
        </footer>
      </div>

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
};

export default SpeechGames;
