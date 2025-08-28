import React, { useState } from "react";
import { FaStar, FaMedal, FaTrophy, FaSmile, FaLock, FaArrowRight, FaCertificate } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function KidsBadges() {
  const navigate = useNavigate();

  // Sample user/gamification data
  const [gamification, setGamification] = useState({
    totalPoints: 18,
    badge: "Fluent Friend",
    level: 3,
    certificate: true,
  });

  const badgeTiers = [
    { name: "Bronze", threshold: 1, icon: <FaMedal />, color: "bg-orange-400", text: "text-orange-600" },
    { name: "Silver", threshold: 5, icon: <FaMedal />, color: "bg-gray-300", text: "text-gray-600" },
    { name: "Gold", threshold: 10, icon: <FaMedal />, color: "bg-yellow-300", text: "text-yellow-600" },
    { name: "Platinum", threshold: 20, icon: <FaTrophy />, color: "bg-blue-200", text: "text-blue-600" },
  ];

  const donationCount = Math.floor(gamification.totalPoints / 1); // Example logic
  const currentTierIndex = badgeTiers.findIndex((tier) => donationCount < tier.threshold);
  const nextTier = currentTierIndex === -1 ? null : badgeTiers[currentTierIndex];
  const currentTier = currentTierIndex === 0 ? null : badgeTiers[currentTierIndex - 1];
  const progressTarget = nextTier?.threshold || badgeTiers[badgeTiers.length - 1].threshold;
  const progressPercent = Math.min((donationCount / progressTarget) * 100, 100);

  const badges = [
    { id: 1, name: "Super Speaker", unlocked: true, icon: <FaStar className="text-yellow-400" />, description: "Complete 10 speaking exercises" },
    { id: 2, name: "Fluent Friend", unlocked: true, icon: <FaMedal className="text-purple-500" />, description: "Have 5 conversations" },
    { id: 3, name: "Confidence Champ", unlocked: false, icon: <FaTrophy className="text-yellow-500" />, description: "Speak for 3 minutes without pausing" },
    { id: 4, name: "Daily Practice", unlocked: false, icon: <FaSmile className="text-pink-500" />, description: "Practice for 7 days in a row" },
    { id: 5, name: "Word Wizard", unlocked: false, icon: <FaStar className="text-blue-500" />, description: "Learn 50 new words" },
    { id: 6, name: "Grammar Guru", unlocked: false, icon: <FaCertificate className="text-green-500" />, description: "Master all grammar rules" },
    { id: 7, name: "Pronunciation Pro", unlocked: false, icon: <FaMedal className="text-red-500" />, description: "Perfect pronunciation in 10 words" },
    { id: 8, name: "Listening Leader", unlocked: false, icon: <FaTrophy className="text-indigo-500" />, description: "Complete 15 listening exercises" },
  ];

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      <h1 className="text-4xl font-bold text-purple-800 mb-8 text-center">🏅 Kids Rewards</h1>

      {/* Current Status */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 shadow-lg mb-10 border-2 border-purple-300">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-purple-700">{gamification.badge}</h2>
            <p className="text-gray-500">Level {gamification.level} • {gamification.totalPoints} Points</p>
          </div>
          {gamification.certificate && (
            <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full flex items-center gap-2 transition-transform hover:scale-105">
              <FaCertificate /> Download Certificate
            </button>
          )}
        </div>
        <div className="mt-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Your progress</span>
            <span className="text-sm text-gray-600">{donationCount}/{progressTarget} points</span>
          </div>
          <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
            <div 
              className="h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            {badgeTiers.map((tier, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tier.color} ${tier.text} border-2 border-white`}>
                  {tier.icon}
                </div>
                <span className="text-xs mt-1 text-gray-600">{tier.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl p-6 shadow-lg mb-10 border-2 border-purple-300">
        <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">Your Badges Collection</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {badges.map((badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className={`relative rounded-2xl p-4 flex flex-col items-center transition-all duration-300 ${
                badge.unlocked 
                  ? "bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 shadow-md" 
                  : "bg-gray-100 border-2 border-gray-200"
              }`}
            >
              {!badge.unlocked && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-40 flex items-center justify-center rounded-2xl">
                  <FaLock className="text-white text-2xl" />
                </div>
              )}
              
              <div className={`text-4xl mb-3 ${badge.unlocked ? "opacity-100" : "opacity-40"}`}>
                {badge.icon}
              </div>
              
              <h3 className={`font-bold text-center mb-1 ${badge.unlocked ? "text-purple-800" : "text-gray-500"}`}>
                {badge.name}
              </h3>
              
              <p className="text-xs text-center text-gray-600">
                {badge.description}
              </p>
              
              {badge.unlocked && (
                <div className="mt-3 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Unlocked!
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Progress Statistics */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 shadow-lg mb-10 border-2 border-purple-300">
        <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">Your Progress</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-purple-100 p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-purple-700">12</div>
            <div className="text-sm text-purple-600">Sessions Completed</div>
          </div>
          
          <div className="bg-pink-100 p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-pink-700">87%</div>
            <div className="text-sm text-pink-600">Average Score</div>
          </div>
          
          <div className="bg-yellow-100 p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-yellow-700">5</div>
            <div className="text-sm text-yellow-600">Streak Days</div>
          </div>
          
          <div className="bg-green-100 p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-green-700">42</div>
            <div className="text-sm text-green-600">Words Mastered</div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-10 mb-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/practice")}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 mx-auto shadow-lg"
        >
          <FaArrowRight /> Practice Next Challenge
        </motion.button>
        
        <p className="text-gray-600 mt-4">
          Earn more badges and unlock achievements by practicing!
        </p>
      </div>
    </div>
  );
}