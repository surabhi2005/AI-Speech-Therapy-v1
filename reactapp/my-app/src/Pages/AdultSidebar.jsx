// src/Components/Sidebar.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCommentDots,
  FaVolumeUp,
  FaSmile,
  FaChartLine,
  FaClipboardList,
  FaChalkboardTeacher,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaHome,
  FaRobot,FaBook
} from "react-icons/fa";


export default function AdultSidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: "/dashboard/adult", name: "Dashboard", icon: <FaHome /> },
    { path: "/adult/filler", name: "Filler Word Detection", icon: <FaCommentDots /> },
    { path: "/adult/stutter", name: "Stutter Support", icon: <FaVolumeUp /> },
    { path: "/adult/emotion", name: "Emotion Feedback", icon: <FaSmile /> },
    { path: "/adult/syllable-practice", name: "Syllable Practice", icon: <FaClipboardList /> },
    { path: "/adult/scenario", name: "Daily Scenarios", icon: <FaChalkboardTeacher /> },
    { path: "/adult/progress", name: "Progress", icon: <FaChartLine /> },
    { path: "/adult/profile", name: "Profile", icon: <FaUserCircle /> },
    { path: "/adult/resources", name: "Resources", icon: <FaBook /> },
    { path: "/ai-assistant", name: "AI Assistant", icon: <FaRobot /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      <div
        className={`fixed md:relative z-50 w-64 bg-[#3B1E54] text-white min-h-screen transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-[#9B7EBD]">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="text-[#EEEEEE]">Voca</span>
            <span className="text-[#D4BEE4]">Care</span>
          </h1>
          <p className="text-sm text-[#D4BEE4] mt-1">Speech Therapy for Adults</p>
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
}
