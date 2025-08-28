import React, { useState } from "react";
import { FaPlay, FaStar } from "react-icons/fa";

export default function SpeechGames() {
  const levels = [
    {
      id: 1,
      name: "Level 1 - Beginner",
      description: "Focus on simple sounds and words",
      games: [
        { id: 1, name: "Sound Explorer", stars: 3 },
        { id: 2, name: "Word Builder", stars: 2 },
        { id: 3, name: "Animal Sounds", stars: 1 },
      ],
    },
    {
      id: 2,
      name: "Level 2 - Intermediate",
      description: "Practice short sentences",
      games: [
        { id: 4, name: "Sentence Repeat", stars: 0 },
        { id: 5, name: "Rhyme Time", stars: 1 },
        { id: 6, name: "Story Builder", stars: 2 },
      ],
    },
    {
      id: 3,
      name: "Level 3 - Advanced",
      description: "Complex sentences and tricky pronunciations",
      games: [
        { id: 7, name: "Tongue Twisters", stars: 0 },
        { id: 8, name: "Pronunciation Quiz", stars: 0 },
        { id: 9, name: "Storytelling Challenge", stars: 0 },
      ],
    },
  ];

  const [selectedLevel, setSelectedLevel] = useState(levels[0]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#D4BEE4] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#3B1E54] mb-6 text-center">
          Speech Games for Kids
        </h1>

        {/* Level Selector */}
        <div className="flex justify-center mb-8 space-x-4">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedLevel.id === level.id
                  ? "bg-[#3B1E54] text-white"
                  : "bg-white text-[#3B1E54] hover:bg-[#D4BEE4]"
              }`}
            >
              {level.name}
            </button>
          ))}
        </div>

        {/* Selected Level Description */}
        <div className="text-center mb-6">
          <p className="text-[#9B7EBD]">{selectedLevel.description}</p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedLevel.games.map((game) => (
            <div
              key={game.id}
              className="bg-white p-4 rounded-2xl shadow-lg flex flex-col justify-between hover:scale-105 transform transition-all"
            >
              <div>
                <h2 className="text-xl font-semibold text-[#3B1E54] mb-2">
                  {game.name}
                </h2>
                <div className="flex space-x-1 mb-4">
                  {[1, 2, 3].map((star) => (
                    <FaStar
                      key={star}
                      className={star <= game.stars ? "text-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
              </div>
              <button className="mt-auto bg-[#3B1E54] text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#9B7EBD] transition-colors">
                <FaPlay /> Play
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
