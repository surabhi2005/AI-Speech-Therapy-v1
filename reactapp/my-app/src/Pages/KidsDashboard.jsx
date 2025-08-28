import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBook,
  FaGamepad,
  FaAward,
  FaChild,
  FaSignOutAlt,
  FaUserCircle,
  FaChartLine,
  FaFileAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaSmile,
  FaFire,
  FaMicrophone,
  FaStar,
  FaCalendarAlt,
  FaTrophy,
  FaCheckCircle,
  FaRobot
} from "react-icons/fa";

export default function KidsDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user")) || {
    name: "Little Learner",
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get current month and year
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const today = currentDate.getDate();
  
  // Generate calendar days
  const [calendarDays, setCalendarDays] = useState([]);
  
  useEffect(() => {
    const generateCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get first day of month
      const firstDay = new Date(year, month, 1);
      const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Get last day of month
      const lastDay = new Date(year, month + 1, 0);
      const totalDays = lastDay.getDate();
      
      // Create calendar array
      const daysArray = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDay; i++) {
        daysArray.push({ day: null, isToday: false });
      }
      
      // Add days of the month
      for (let i = 1; i <= totalDays; i++) {
        daysArray.push({ 
          day: i, 
          isToday: i === today && month === new Date().getMonth() && year === new Date().getFullYear()
        });
      }
      
      setCalendarDays(daysArray);
    };
    
    generateCalendar();
  }, [currentDate, today]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    { path: "/dashboard/kids", name: "Dashboard", icon: <FaHome /> },
    { path: "/kids/storytelling", name: "Storytelling", icon: <FaBook /> },
    { path: "/3d-model", name: "AR Letters", icon: <FaChild /> },
    { path: "/kids/games", name: "Speech Games", icon: <FaGamepad /> },
    { path: "/kids/rewards", name: "Rewards", icon: <FaAward /> },
    { path: "/kids/progress", name: "Progress", icon: <FaChartLine /> },
    { path: "/kids/profile", name: "Profile", icon: <FaUserCircle /> },
    { path: "/kids/resources", name: "Resources", icon: <FaBook /> },
     {path: "/ai-assistant", name: "AI Assistant", icon: <FaRobot /> },
  ];

  // Sample data for achievements and progress
  const achievements = [
    { name: "Pronunciation Master", icon: <FaMicrophone />, progress: 80 },
    { name: "Storytelling Champion", icon: <FaBook />, progress: 65 },
    { name: "Consistency King", icon: <FaFire />, progress: 90 }
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
          <p className="text-sm text-[#D4BEE4] mt-1">Speech Therapy for Kids</p>
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
          <h1 className="text-2xl font-bold ml-4 md:ml-0">SpeechSpark Kids</h1>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <FaUserCircle className="text-2xl" />
              {user.name}
            </span>
          </div>
        </nav>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Enhanced Welcome Section */}
        <section className="p-6">
          <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#3B1E54] mb-3">
                  Welcome back, {user.name}! 👋
                </h2>
                <p className="text-lg text-[#9B7EBD] mb-4">
                  You're doing amazing on your speech journey. Keep up the great work!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#EEEEEE] p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">12</div>
                    <div className="text-sm text-[#9B7EBD]">Lessons Completed</div>
                  </div>
                  <div className="bg-[#EEEEEE] p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">5</div>
                    <div className="text-sm text-[#9B7EBD]">Day Streak</div>
                  </div>
                  <div className="bg-[#EEEEEE] p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">87%</div>
                    <div className="text-sm text-[#9B7EBD]">Overall Progress</div>
                  </div>
                </div>
              </div>

              {/* Dynamic Calendar */}
              <div className="bg-[#EEEEEE] p-5 rounded-lg shadow-inner lg:max-w-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-[#3B1E54]">
                    <FaCalendarAlt className="mr-2 text-lg" />
                    <span className="font-semibold text-lg">{currentMonth} {currentYear}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-sm">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-center font-medium text-[#3B1E54] py-1">
                      {day}
                    </div>
                  ))}
                  
                  {calendarDays.map((dayObj, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        dayObj.isToday
                          ? "bg-[#3B1E54] text-white font-bold"
                          : dayObj.day 
                            ? "bg-[#D4BEE4] text-[#3B1E54] hover:bg-[#d4bc92] cursor-pointer"
                            : "bg-transparent"
                      }`}
                    >
                      {dayObj.day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Goals Section */}
        <section className="px-6 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold text-[#3B1E54] mb-4 flex items-center">
              <FaCheckCircle className="mr-2 text-[#9B7EBD]" /> Today's Goals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-[#EEEEEE] rounded-lg">
                <div className="bg-[#3B1E54] p-2 rounded-full mr-3">
                  <FaMicrophone className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#3B1E54]">Practice "R" sounds</p>
                  <p className="text-sm text-[#9B7EBD]">10 minutes daily</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-[#EEEEEE] rounded-lg">
                <div className="bg-[#3B1E54] p-2 rounded-full mr-3">
                  <FaBook className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#3B1E54]">Read a story aloud</p>
                  <p className="text-sm text-[#9B7EBD]">1 story completed</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fun Widgets */}
        <section className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Word of the Day */}
          <div className="bg-white rounded-2xl p-6 shadow-md flex items-start">
            <div className="bg-[#3B1E54] p-3 rounded-full mr-4">
              <FaSmile className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#3B1E54] mb-2">
                Word of the Day
              </h2>
              <p className="text-2xl font-bold text-[#9B7EBD] mb-1">Happy</p>
              <p className="text-[#9B7EBD]">
                Try saying it with a big smile! 😊
              </p>
            </div>
          </div>

          {/* Streak / Stars */}
          <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col">
            <div className="flex items-center mb-2">
              <div className="bg-[#3B1E54] p-3 rounded-full mr-4">
                <FaFire className="text-white text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[#3B1E54]">
                Your Streak
              </h2>
            </div>
            <p className="text-[#9B7EBD] mb-2">5 days in a row! Keep it up!</p>
            <div className="flex gap-1 mb-3">
              {Array(5)
                .fill()
                .map((_, i) => (
                  <FaStar key={i} className="text-yellow-400 text-xl" />
                ))}
            </div>
            <div className="w-full bg-[#D4BEE4] rounded-full h-2.5">
              <div className="bg-[#3B1E54] h-2.5 rounded-full" style={{width: '80%'}}></div>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-md flex items-start">
            <div className="bg-[#3B1E54] p-3 rounded-full mr-4">
              <FaMicrophone className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#3B1E54] mb-2">
                Today's Activity
              </h2>
              <p className="text-[#9B7EBD]">
                Say the letter "S" slowly while smiling. Practice 5 times!
              </p>
              <button className="mt-3 bg-[#3B1E54] text-white px-4 py-2 rounded-lg text-sm">
                Start Activity
              </button>
            </div>
          </div>

          {/* Mascot / Motivation */}
          <div className="bg-white rounded-2xl p-6 shadow-md flex items-start">
            <div className="bg-[#3B1E54] p-3 rounded-full mr-4">
              <FaChild className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#3B1E54] mb-2">
                Daily Motivation
              </h2>
              <p className="text-[#9B7EBD]">
                Hi {user.name}! I'm so proud of your hard work. Every day you're getting better!
              </p>
              <div className="flex items-center mt-3">
                <FaTrophy className="text-yellow-400 mr-2" />
                <span className="text-sm text-[#3B1E54]">You've earned 15 stars this week!</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}