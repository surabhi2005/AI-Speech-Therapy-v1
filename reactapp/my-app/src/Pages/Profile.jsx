import React, { useState } from "react";
import { FaEdit, FaTrophy, FaChartLine, FaUserCog, FaBell, FaLock } from "react-icons/fa";

export default function Profile() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {
      name: "John Doe",
      email: "john@example.com",
      age: 25,
      role: "Adult",
      joinDate: "2023-05-15",
      lastActive: "2024-01-15",
    }
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...user });

  const progressData = {
    completion: 75,
    streak: 12,
    sessions: 47,
    accuracy: 82,
  };

  const achievements = [
    { id: 1, name: "Consistency Master", icon: "🏆", description: "7+ day streak", earned: true },
    { id: 2, name: "Pronunciation Pro", icon: "🎯", description: "90%+ accuracy", earned: true },
    { id: 3, name: "Practice Champion", icon: "⭐", description: "50+ sessions", earned: false },
    { id: 4, name: "Early Bird", icon: "🌅", description: "5 morning practices", earned: true },
  ];

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) setEditForm({ ...user });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleSave = () => {
    setUser(editForm);
    localStorage.setItem("user", JSON.stringify(editForm));
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#D4BEE4] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#3B1E54] mb-8 text-center">Your Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-2xl shadow-lg lg:col-span-1">
            <div className="flex flex-col items-center">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=9A3F3F&color=fff&size=128`}
                alt="profile"
                className="w-32 h-32 rounded-full border-4 border-[#D4BEE4] mb-4"
              />

              {isEditing ? (
                <div className="w-full space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#3B1E54] mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-[#9B7EBD] rounded-lg focus:ring-2 focus:ring-[#3B1E54] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3B1E54] mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-[#9B7EBD] rounded-lg focus:ring-2 focus:ring-[#3B1E54] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3B1E54] mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={editForm.age}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-[#9B7EBD] rounded-lg focus:ring-2 focus:ring-[#3B1E54] focus:outline-none"
                    />
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-2 bg-[#3B1E54] text-white rounded-lg hover:bg-[#9B7EBD] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-[#3B1E54]">{user.name}</h2>
                  <p className="text-[#9B7EBD]">{user.email}</p>
                  <div className="w-full mt-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[#3B1E54] font-medium">Age:</span>
                      <span className="text-[#9B7EBD]">{user.age}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#3B1E54] font-medium">Role:</span>
                      <span className="text-[#9B7EBD]">{user.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#3B1E54] font-medium">Member since:</span>
                      <span className="text-[#9B7EBD]">{new Date(user.joinDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#3B1E54] font-medium">Last active:</span>
                      <span className="text-[#9B7EBD]">{new Date(user.lastActive).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleEditToggle}
                    className="mt-6 px-6 py-2 bg-[#3B1E54] text-white rounded-lg hover:bg-[#9B7EBD] transition-colors flex items-center gap-2"
                  >
                    <FaEdit /> Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress Stats */}
          <div className="bg-white p-6 rounded-2xl shadow-lg lg:col-span-2">
            <h2 className="text-2xl font-semibold text-[#3B1E54] mb-6 flex items-center gap-2">
              <FaChartLine /> Your Progress
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: "Program Completion", value: progressData.completion, showBar: true },
                { label: "Day Streak", value: progressData.streak },
                { label: "Practice Sessions", value: progressData.sessions },
                { label: "Accuracy Score", value: progressData.accuracy, showBar: true },
              ].map((stat, idx) => (
                <div key={idx} className="bg-[#EEEEEE] p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-[#3B1E54]">{stat.value}{stat.showBar ? "%" : ""}</div>
                  <div className="text-[#9B7EBD]">{stat.label}</div>
                  {stat.showBar && (
                    <div className="w-full bg-[#D4BEE4] rounded-full h-2 mt-2">
                      <div
                        className="bg-[#3B1E54] h-2 rounded-full"
                        style={{ width: `${stat.value}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white p-6 rounded-2xl shadow-lg lg:col-span-3">
            <h2 className="text-2xl font-semibold text-[#3B1E54] mb-6 flex items-center gap-2">
              <FaTrophy /> Your Achievements
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 ${
                    achievement.earned ? "border-[#3B1E54] bg-[#EEEEEE]" : "border-gray-300 bg-gray-100 opacity-70"
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h3 className="font-semibold text-[#3B1E54]">{achievement.name}</h3>
                  <p className="text-sm text-[#9B7EBD]">{achievement.description}</p>
                  <div className={`text-xs mt-2 ${achievement.earned ? "text-green-600" : "text-gray-500"}`}>
                    {achievement.earned ? "Earned on Jan 12, 2024" : "Not yet earned"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings & Preferences */}
          <div className="bg-white p-6 rounded-2xl shadow-lg lg:col-span-3">
            <h2 className="text-2xl font-semibold text-[#3B1E54] mb-6 flex items-center gap-2">
              <FaUserCog /> Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#3B1E54] flex items-center gap-2">
                  <FaBell /> Notifications
                </h3>
                {["Practice reminders", "Progress reports"].map((label, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-[#9B7EBD]">{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B1E54]"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#3B1E54] flex items-center gap-2">
                  <FaLock /> Privacy
                </h3>
                <button className="w-full text-left py-2 text-[#9B7EBD] hover:text-[#3B1E54]">
                  Change password
                </button>
                <button className="w-full text-left py-2 text-[#9B7EBD] hover:text-[#3B1E54]">
                  Data privacy settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
