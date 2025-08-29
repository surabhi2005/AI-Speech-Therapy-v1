import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBook,
  FaUserFriends,
  FaGamepad,
  FaChartLine,
  FaCrown,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaHome,
  FaQuoteLeft,
  FaTrophy,
  FaMedal,
  FaSmile,
  FaArrowRight,
  FaRobot
} from "react-icons/fa";

export default function TeenDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user")) || {
    name: "Teen User",
    email: "teen@example.com",
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: "/dashboard/teen", name: "Dashboard", icon: <FaHome /> },
    { path: "/teen/storytelling", name: "Storytelling", icon: <FaBook /> },
    { path: "/teen/scenario", name: "Daily Scenario", icon: <FaUserFriends /> },
    { path: "/teen/games", name: "Pronunciation Games", icon: <FaGamepad /> },
    { path: "/teen/progress", name: "Progress", icon: <FaChartLine /> },
    { path: "/teen/rewards", name: "Rewards", icon: <FaCrown /> },
    { path: "/teen/profile", name: "Profile", icon: <FaUserCircle /> },
     { path: "/teen/resources", name: "Resources", icon: <FaBook /> },
     {path: "/ai-assistant", name: "AI Assistant", icon: <FaRobot /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Motivational quotes for teens
  const motivationalQuotes = [
    {
      text: "Your voice matters. Every word you speak brings you closer to confident communication.",
      author: "Speech Coach Maria"
    },
    {
      text: "Progress isn't always visible, but every practice session builds your skills.",
      author: "Therapist James"
    },
    {
      text: "Great speakers weren't born confident—they practiced until speaking felt natural.",
      author: "Communication Expert Lisa"
    }
  ];

  // Benefits of speech therapy
  const benefits = [
    {
      title: "Build Confidence",
      description: "Clear communication helps you express yourself with assurance in any situation.",
      icon: <FaMedal className="text-2xl" />
    },
    {
      title: "Connect Better",
      description: "Improve your social interactions and make meaningful connections with others.",
      icon: <FaUserFriends className="text-2xl" />
    },
    {
      title: "Achieve Goals",
      description: "From classroom presentations to job interviews, clear speech opens doors.",
      icon: <FaTrophy className="text-2xl" />
    }
  ];

  // Success tips
  const successTips = [
    "Practice for 15 minutes daily—consistency beats occasional long sessions",
    "Record yourself to track progress and identify areas for improvement",
    "Start with comfortable sounds and gradually challenge yourself",
    "Celebrate small victories—each clear word is an achievement",
    "Use the mirror to check your mouth movements and articulation"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#D4BEE4] text-[#3B1E54] flex">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-50 w-64 bg-[#3B1E54] text-white min-h-screen transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-[#9B7EBD]">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="text-[#EEEEEE]">Voca</span>
            <span className="text-[#D4BEE4]">Care</span>
          </h1>
          <p className="text-sm text-[#D4BEE4] mt-1">Speech Therapy for Teens</p>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <div
              key={item.path}
              className={`px-6 py-3 flex items-center cursor-pointer transition-colors duration-200 ${
                location.pathname === item.path
                  ? "bg-[#9B7EBD] border-r-4 border-[#EEEEEE]"
                  : "hover:bg-[#9B7EBD]"
              }`}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
            >
              <span className="mr-3 text-[#D4BEE4]">{item.icon}</span>
              <span>{item.name}</span>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-[#9B7EBD]">
          <button
            onClick={handleLogout}
            className="w-full bg-[#9B7EBD] hover:bg-[#9B7EBD] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Navbar */}
        <nav className="bg-[#3B1E54] text-white px-6 py-4 flex justify-between items-center shadow-md">
          <button
            className="md:hidden text-2xl"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h1 className="text-2xl font-bold ml-4 md:ml-0">SpeechSpark – Teen</h1>
          <div className="flex items-center gap-3">
            <FaUserCircle className="text-2xl text-[#D4BEE4]" />
            <span className="font-medium">{user.name}</span>
          </div>
        </nav>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Motivational Content */}
        <main className="max-w-6xl mx-auto p-6">
          {/* Welcome Section */}
          <section className="mb-10 text-center">
            <h2 className="text-4xl font-bold mb-4">Welcome back, {user.name}!</h2>
            <p className="text-xl text-[#9B7EBD] max-w-2xl mx-auto">
              Every day you practice, you're building communication skills that will benefit you for a lifetime.
            </p>
          </section>

          {/* Motivational Quote */}
          <section className="bg-white rounded-2xl shadow-lg p-8 mb-10 text-center">
            <FaQuoteLeft className="text-3xl text-[#3B1E54] mx-auto mb-4" />
            <blockquote className="text-2xl italic text-[#3B1E54] mb-4">
              "{motivationalQuotes[0].text}"
            </blockquote>
            <p className="text-[#9B7EBD] font-medium">— {motivationalQuotes[0].author}</p>
          </section>

          {/* Benefits Section */}
          <section className="mb-10">
            <h3 className="text-3xl font-bold text-center mb-8">Why Your Practice Matters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-md text-center">
                  <div className="bg-[#3B1E54] text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-[#3B1E54]">{benefit.title}</h4>
                  <p className="text-[#9B7EBD]">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Progress Celebration */}
          <section className="bg-[#EEEEEE] rounded-2xl p-8 mb-10 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold mb-4 text-[#3B1E54]">You're Making Progress!</h3>
              <p className="text-xl mb-6 text-[#9B7EBD]">
                Last week, you practiced on <span className="font-bold text-[#3B1E54]">4 out of 7 days</span>— 
                that's consistency that leads to real results!
              </p>
              <div className="flex justify-center items-center gap-2">
                <FaSmile className="text-3xl text-[#3B1E54]" />
                <span className="text-lg text-[#3B1E54] font-medium">Keep up the great work!</span>
              </div>
            </div>
          </section>

      
         
          {/* Call to Action */}
          <section className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-[#3B1E54]">Ready to continue your journey?</h3>
            <p className="text-xl mb-6 text-[#9B7EBD]">Choose an activity to get started:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {menuItems.slice(1).map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className="bg-[#3B1E54] hover:bg-[#9B7EBD] text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <span>{item.name}</span>
                  <FaArrowRight />
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}