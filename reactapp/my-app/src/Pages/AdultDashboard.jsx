// import React, { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import {
//   FaCommentDots,
//   FaVolumeUp,
//   FaSmile,
//   FaChartBar,
//   FaClipboardList,
//   FaChalkboardTeacher,
//   FaSignOutAlt,
//   FaUserCircle,
//   FaBars,
//   FaTimes,
//   FaHome,
//   FaFileAlt,
//   FaChartLine,
//   FaTrophy,
//   FaCalendar,
//   FaBullseye,
//   FaBookOpen,
//   FaMedal
// } from "react-icons/fa";

// export default function KidsDashboard() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user = JSON.parse(localStorage.getItem("user")) || {
//     name: "Adult User",
//     email: "adult@example.com",
//   };

//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const menuItems = [
//     { path: "/adult/dashboard", name: "Dashboard", icon: <FaHome /> },
//     { path: "/adult/filler-words", name: "Filler Word Detection", icon: <FaCommentDots /> },
//     { path: "/adult/stutter-support", name: "Stutter Support", icon: <FaVolumeUp /> },
//     { path: "/adult/emotion-feedback", name: "Emotion Feedback", icon: <FaSmile /> },
//     { path: "/adult/phoneme-heatmap", name: "Phoneme Heatmap", icon: <FaChartBar /> },
//     { path: "/adult/syllable-practice", name: "Syllable Practice", icon: <FaClipboardList /> },
//     { path: "/adult/daily-scenarios", name: "Daily Scenarios", icon: <FaChalkboardTeacher /> },
//     { path: "/adult/progress", name: "Progress", icon: <FaChartLine /> },
//     { path: "/adult/reports", name: "Reports", icon: <FaFileAlt /> },
//   ];

//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     navigate("/");
//   };

//   // Weekly progress data
//   const weeklyProgress = [
//     { day: "Mon", value: 75 },
//     { day: "Tue", value: 85 },
//     { day: "Wed", value: 65 },
//     { day: "Thu", value: 90 },
//     { day: "Fri", value: 80 },
//     { day: "Sat", value: 70 },
//     { day: "Sun", value: 95 },
//   ];

//   // Recent achievements
//   const achievements = [
//     { title: "Filler Word Reduction", description: "Reduced 'um' usage by 40%", icon: <FaCommentDots /> },
//     { title: "Consistency Champion", description: "Practiced 5 days in a row", icon: <FaCalendar /> },
//     { title: "Pronunciation Master", description: "Mastered 5 difficult phonemes", icon: <FaBullseye /> },
//   ];

//   // Motivational quotes for adults
//   const motivationalQuotes = [
//     {
//       text: "Clear communication is not about perfection, but about connection.",
//       author: "Communication Expert"
//     },
//     {
//       text: "Every word you speak clearly is a step toward confidence.",
//       author: "Speech Coach"
//     },
//     {
//       text: "Progress in speech is like building a muscle - consistency creates strength.",
//       author: "Therapist"
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#D4BEE4] text-[#3B1E54] flex">
//       {/* Sidebar */}
//       <div
//         className={`fixed md:relative z-50 w-64 bg-[#3B1E54] text-white min-h-screen transition-transform duration-300 ${
//           sidebarOpen
//             ? "translate-x-0"
//             : "-translate-x-full md:translate-x-0"
//         }`}
//       >
//         <div className="p-5 border-b border-[#9B7EBD]">
//           <h1 className="text-2xl font-bold flex items-center">
//             <span className="text-[#EEEEEE]">Voca</span>
//             <span className="text-[#D4BEE4]">Care</span>
//           </h1>
//           <p className="text-sm text-[#D4BEE4] mt-1">Speech Therapy for Adults</p>
//         </div>

//         <nav className="mt-6">
//           {menuItems.map((item) => (
//             <div
//               key={item.path}
//               className={`px-6 py-3 flex items-center cursor-pointer transition-colors duration-200 ${
//                 location.pathname === item.path
//                   ? "bg-[#9B7EBD] border-r-4 border-[#EEEEEE]"
//                   : "hover:bg-[#9B7EBD]"
//               }`}
//               onClick={() => {
//                 navigate(item.path);
//                 setSidebarOpen(false);
//               }}
//             >
//               <span className="mr-3 text-[#D4BEE4]">{item.icon}</span>
//               <span>{item.name}</span>
//             </div>
//           ))}
//         </nav>

//         <div className="absolute bottom-0 w-full p-4 border-t border-[#9B7EBD]">
//           <button
//             onClick={handleLogout}
//             className="w-full bg-[#9B7EBD] hover:bg-[#9B7EBD] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2"
//           >
//             <FaSignOutAlt /> Logout
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1">
//         {/* Navbar */}
//         <nav className="bg-[#3B1E54] text-white px-6 py-4 flex justify-between items-center shadow-md">
//           <button
//             className="md:hidden text-2xl"
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//           >
//             {sidebarOpen ? <FaTimes /> : <FaBars />}
//           </button>
//           <h1 className="text-2xl font-bold ml-4 md:ml-0">Adult Dashboard</h1>
//           <div className="flex items-center gap-4">
//             <span className="flex items-center gap-2">
//               <FaUserCircle className="text-2xl text-[#D4BEE4]" />
//               {user.name}
//             </span>
//           </div>
//         </nav>

//         {/* Overlay for mobile sidebar */}
//         {sidebarOpen && (
//           <div
//             className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
//             onClick={() => setSidebarOpen(false)}
//           ></div>
//         )}

//         {/* Welcome Section */}
//         <section className="p-6">
//           <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
//             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
//               <div className="flex-1">
//                 <h2 className="text-3xl font-bold text-[#3B1E54] mb-3">
//                   Welcome back, {user.name}!
//                 </h2>
//                 <p className="text-lg text-[#9B7EBD] mb-4">
//                   Your journey to clearer communication continues. Let's make today productive.
//                 </p>
                
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
//                   <div className="bg-[#EEEEEE] p-4 rounded-lg text-center">
//                     <div className="text-2xl font-bold text-[#3B1E54]">15</div>
//                     <div className="text-sm text-[#9B7EBD]">Sessions Completed</div>
//                   </div>
//                   <div className="bg-[#EEEEEE] p-4 rounded-lg text-center">
//                     <div className="text-2xl font-bold text-[#3B1E54]">92%</div>
//                     <div className="text-sm text-[#9B7EBD]">Clarity Score</div>
//                   </div>
//                   <div className="bg-[#EEEEEE] p-4 rounded-lg text-center">
//                     <div className="text-2xl font-bold text-[#3B1E54]">5</div>
//                     <div className="text-sm text-[#9B7EBD]">Day Streak</div>
//                   </div>
//                 </div>
//               </div>

//               {/* Weekly Progress */}
//               <div className="bg-[#EEEEEE] p-5 rounded-lg shadow-inner lg:max-w-md w-full">
//                 <h3 className="text-lg font-semibold text-[#3B1E54] mb-4 text-center">Weekly Progress</h3>
//                 <div className="flex items-end justify-between h-32">
//                   {weeklyProgress.map((day, index) => (
//                     <div key={index} className="flex flex-col items-center">
//                       <div 
//                         className="w-8 bg-[#3B1E54] rounded-t transition-all hover:bg-[#9B7EBD]"
//                         style={{ height: ${day.value}% }}
//                       ></div>
//                       <span className="text-sm text-[#3B1E54] mt-2">{day.day}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Motivational Quote */}
//         <section className="px-6 mb-6">
//           <div className="bg-[#3B1E54] text-white rounded-2xl p-6 text-center">
//             <h3 className="text-xl font-semibold mb-3">Today's Motivation</h3>
//             <blockquote className="text-lg italic mb-2">
//               "{motivationalQuotes[0].text}"
//             </blockquote>
//             <p className="text-[#D4BEE4]">— {motivationalQuotes[0].author}</p>
//           </div>
//         </section>

//         {/* Recent Achievements */}
//         <section className="p-6">
//           <div className="bg-white rounded-2xl shadow-md p-6">
//             <h2 className="text-2xl font-bold text-[#3B1E54] mb-6 flex items-center">
//               <FaTrophy className="mr-2 text-[#9B7EBD]" /> Recent Achievements
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {achievements.map((achievement, index) => (
//                 <div key={index} className="bg-[#EEEEEE] p-4 rounded-lg flex items-start">
//                   <div className="bg-[#3B1E54] p-2 rounded-full mr-3 text-white">
//                     {achievement.icon}
//                   </div>
//                   <div>
//                     <h4 className="font-semibold text-[#3B1E54]">{achievement.title}</h4>
//                     <p className="text-sm text-[#9B7EBD]">{achievement.description}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* Recommended Activities */}
//         <section className="p-6">
//           <div className="bg-white rounded-2xl shadow-md p-6">
//             <h2 className="text-2xl font-bold text-[#3B1E54] mb-6">Recommended Activities</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="bg-[#EEEEEE] p-5 rounded-lg">
//                 <h3 className="text-xl font-semibold text-[#3B1E54] mb-3 flex items-center">
//                   <FaBookOpen className="mr-2 text-[#9B7EBD]" /> Daily Pronunciation
//                 </h3>
//                 <p className="text-[#9B7EBD] mb-4">
//                   Practice the phonemes you've been working on. Today's focus: "th" sounds.
//                 </p>
//                 <button className="px-4 py-2 bg-[#3B1E54] text-white rounded-lg hover:bg-[#9B7EBD]">
//                   Start Practice
//                 </button>
//               </div>
              
//               <div className="bg-[#EEEEEE] p-5 rounded-lg">
//                 <h3 className="text-xl font-semibold text-[#3B1E54] mb-3 flex items-center">
//                   <FaMedal className="mr-2 text-[#9B7EBD]" /> Challenge Exercise
//                 </h3>
//                 <p className="text-[#9B7EBD] mb-4">
//                   Try our new workplace meeting simulation to practice professional communication.
//                 </p>
//                 <button className="px-4 py-2 bg-[#3B1E54] text-white rounded-lg hover:bg-[#9B7EBD]">
//                   Take Challenge
//                 </button>
//               </div>
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCommentDots,
  FaVolumeUp,
  FaSmile,
  FaChartBar,
  FaClipboardList,
  FaChalkboardTeacher,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaHome,
  FaFileAlt,
  FaChartLine,
  FaCalendar,
  FaBullseye,
  FaBookOpen,
  FaMedal,
  FaTrophy,
  FaRobot
} from "react-icons/fa";

export default function AdultDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user")) || {
    name: "Adult User",
    email: "adult@example.com",
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: "/dashboard/adult", name: "Dashboard", icon: <FaHome /> },
    { path: "/adult/filler", name: "Filler Word Detection", icon: <FaCommentDots /> },
    { path: "/adult/stutter", name: "Stutter Support", icon: <FaVolumeUp /> },
    { path: "/adult/emotion", name: "Emotion Feedback", icon: <FaSmile /> },
    { path: "/adult/syllable-practice", name: "Syllable Practice", icon: <FaClipboardList /> },
    { path: "/adult/scenario", name: "Daily Scenarios", icon: <FaChalkboardTeacher /> },
    { path: "/adult/progress", name: "Progress", icon: <FaChartLine /> },
    {path: "/ai-assistant", name: "AI Assistant", icon: <FaRobot /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Weekly progress data
  const weeklyProgress = [
    { day: "Mon", value: 75 },
    { day: "Tue", value: 85 },
    { day: "Wed", value: 65 },
    { day: "Thu", value: 90 },
    { day: "Fri", value: 80 },
    { day: "Sat", value: 70 },
    { day: "Sun", value: 95 },
  ];

  // Recent achievements
  const achievements = [
    { title: "Filler Word Reduction", description: "Reduced 'um' usage by 40%", icon: <FaCommentDots /> },
    { title: "Consistency Champion", description: "Practiced 5 days in a row", icon: <FaCalendar /> },
    { title: "Pronunciation Master", description: "Mastered 5 difficult phonemes", icon: <FaBullseye /> },
  ];

  // Motivational quotes for adults
  const motivationalQuotes = [
    {
      text: "Clear communication is not about perfection, but about connection.",
      author: "Communication Expert"
    },
    {
      text: "Every word you speak clearly is a step toward confidence.",
      author: "Speech Coach"
    },
    {
      text: "Progress in speech is like building a muscle - consistency creates strength.",
      author: "Therapist"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#D4BEE4] text-[#3B1E54] flex">
      {/* Sidebar */}
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
          <h1 className="text-2xl font-bold ml-4 md:ml-0">Adult Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <FaUserCircle className="text-2xl text-[#D4BEE4]" />
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

        {/* Welcome Section */}
        <section className="p-6">
          <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#3B1E54] mb-3">
                  Welcome back, {user.name}!
                </h2>
                <p className="text-lg text-[#9B7EBD] mb-4">
                  Your journey to clearer communication continues. Let's make today productive.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#EEEEEE] p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">15</div>
                    <div className="text-sm text-[#9B7EBD]">Sessions Completed</div>
                  </div>
                  <div className="bg-[#EEEEEE] p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">92%</div>
                    <div className="text-sm text-[#9B7EBD]">Clarity Score</div>
                  </div>
                  <div className="bg-[#EEEEEE] p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-[#3B1E54]">5</div>
                    <div className="text-sm text-[#9B7EBD]">Day Streak</div>
                  </div>
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="bg-[#EEEEEE] p-5 rounded-lg shadow-inner lg:max-w-md w-full">
                <h3 className="text-lg font-semibold text-[#3B1E54] mb-4 text-center">Weekly Progress</h3>
                <div className="flex items-end justify-between h-32">
                  {weeklyProgress.map((day, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="w-8 bg-[#3B1E54] rounded-t transition-all hover:bg-[#9B7EBD]"
                        style={{ height: `${day.value}%` }}
                      ></div>
                      <span className="text-sm text-[#3B1E54] mt-2">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Motivational Quote */}
        <section className="px-6 mb-6">
          <div className="bg-[#3B1E54] text-white rounded-2xl p-6 text-center">
            <h3 className="text-xl font-semibold mb-3">Today's Motivation</h3>
            <blockquote className="text-lg italic mb-2">
              "{motivationalQuotes[0].text}"
            </blockquote>
            <p className="text-[#D4BEE4]">— {motivationalQuotes[0].author}</p>
          </div>
        </section>

        {/* Recent Achievements */}
        <section className="p-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-[#3B1E54] mb-6 flex items-center">
              <FaTrophy className="mr-2 text-[#9B7EBD]" /> Recent Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="bg-[#EEEEEE] p-4 rounded-lg flex items-start">
                  <div className="bg-[#3B1E54] p-2 rounded-full mr-3 text-white">
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#3B1E54]">{achievement.title}</h4>
                    <p className="text-sm text-[#9B7EBD]">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recommended Activities */}
        <section className="p-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-[#3B1E54] mb-6">Recommended Activities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#EEEEEE] p-5 rounded-lg">
                <h3 className="text-xl font-semibold text-[#3B1E54] mb-3 flex items-center">
                  <FaBookOpen className="mr-2 text-[#9B7EBD]" /> Daily Pronunciation
                </h3>
                <p className="text-[#9B7EBD] mb-4">
                  Practice the phonemes you've been working on. Today's focus: "th" sounds.
                </p>
                <button className="px-4 py-2 bg-[#3B1E54] text-white rounded-lg hover:bg-[#9B7EBD]">
                  Start Practice
                </button>
              </div>

              <div className="bg-[#EEEEEE] p-5 rounded-lg">
                <h3 className="text-xl font-semibold text-[#3B1E54] mb-3 flex items-center">
                  <FaMedal className="mr-2 text-[#9B7EBD]" /> Challenge Exercise
                </h3>
                <p className="text-[#9B7EBD] mb-4">
                  Try our new workplace meeting simulation to practice professional communication.
                </p>
                <button className="px-4 py-2 bg-[#3B1E54] text-white rounded-lg hover:bg-[#9B7EBD]">
                  Take Challenge
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
