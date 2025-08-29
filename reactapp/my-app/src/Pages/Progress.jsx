import React, { useState } from "react";
import { 
  FaChartLine, FaCheckCircle, FaTimesCircle, FaRobot
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from "recharts";
import KidsSidebar from "./KidsSidebar"; // <-- Import KidsSidebar

export default function Progress() {
  const [timeRange, setTimeRange] = useState("monthly");

  const progressData = [
    { metric: "Pronunciation Accuracy", progress: 80, feedback: "Excellent! Keep up the clarity and tone.", pass: true },
    { metric: "Fluency Score", progress: 70, feedback: "Good, but try to speak a bit smoother.", pass: true },
    { metric: "Sessions Completed", progress: 50, feedback: "You're halfway there, keep practicing consistently!", pass: false },
    { metric: "Confidence Level", progress: 75, feedback: "Great! Your confidence is improving.", pass: true },
  ];

  const timeSeriesData = [
    { week: 'Week 1', pronunciation: 65, fluency: 60, confidence: 50 },
    { week: 'Week 2', pronunciation: 68, fluency: 63, confidence: 55 },
    { week: 'Week 3', pronunciation: 72, fluency: 67, confidence: 60 },
    { week: 'Week 4', pronunciation: 75, fluency: 70, confidence: 65 },
    { week: 'Week 5', pronunciation: 78, fluency: 72, confidence: 70 },
    { week: 'Week 6', pronunciation: 80, fluency: 70, confidence: 75 },
  ];

  const skillDistributionData = [
    { name: "Conversational", value: 35 },
    { name: "Vocabulary", value: 25 },
    { name: "Grammar", value: 20 },
    { name: "Pronunciation", value: 20 }
  ];

  const COLORS = ['#3B1E54', '#9B7EBD', '#D4BEE4', '#7D9D9C'];

  const overallScore = Math.round(progressData.reduce((sum, item) => sum + item.progress, 0) / progressData.length);

  return (
    <div className="flex min-h-screen bg-[#EEEEEE]">
      {/* Sidebar */}
      <KidsSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto bg-[#D4BEE4]/90 p-8 rounded-3xl shadow-2xl border-2 border-[#9B7EBD]/50">
          <h1 className="text-3xl font-bold text-[#3B1E54] mb-8 flex items-center">
            <FaChartLine className="mr-3 text-[#9B7EBD]" /> Progress Overview
          </h1>

          {/* Time Range Selector */}
          <div className="flex justify-end mb-6">
            <div className="bg-[#EEEEEE] rounded-lg p-1 shadow-inner">
              {["weekly", "monthly", "quarterly"].map(period => (
                <button
                  key={period}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeRange === period
                      ? "bg-[#3B1E54] text-white"
                      : "text-[#3B1E54] hover:bg-[#9B7EBD]/30"
                  }`}
                  onClick={() => setTimeRange(period)}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Top Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Radial Chart for Overall Score */}
            <div className="bg-[#EEEEEE]/70 p-4 rounded-2xl shadow-md border border-[#9B7EBD]/30 flex flex-col items-center">
              <h2 className="text-[#3B1E54] font-semibold mb-2">Overall Score</h2>
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" 
                    data={[{ name: "Score", value: overallScore, fill: "#9B7EBD" }]} 
                    startAngle={180} endAngle={0}
                  >
                    <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <span className="text-3xl font-bold text-[#3B1E54] mt-2">{overallScore}%</span>
            </div>

            {/* Line Chart for Progress Over Time */}
            <div className="bg-[#EEEEEE]/70 p-4 rounded-2xl shadow-md border border-[#9B7EBD]/30 md:col-span-2">
              <h2 className="text-[#3B1E54] font-semibold mb-4 text-center">Progress Over Time</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9B7EBD" opacity={0.3} />
                  <XAxis dataKey="week" stroke="#3B1E54" />
                  <YAxis stroke="#3B1E54" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#D4BEE4", borderRadius: "10px", border: "none" }}
                    itemStyle={{ color: "#3B1E54" }}
                  />
                  <Line type="monotone" dataKey="pronunciation" stroke="#3B1E54" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="fluency" stroke="#9B7EBD" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="confidence" stroke="#7D9D9C" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Middle Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Bar Chart for Individual Metrics */}
            <div className="bg-[#EEEEEE]/70 p-4 rounded-2xl shadow-md border border-[#9B7EBD]/30 md:col-span-2">
              <h2 className="text-[#3B1E54] font-semibold mb-4 text-center">Performance Metrics</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={progressData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="metric" width={150} tick={{ fill: "#3B1E54", fontSize: 14 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#D4BEE4", borderRadius: "10px", border: "none" }}
                    itemStyle={{ color: "#3B1E54" }}
                  />
                  <Bar 
                    dataKey="progress" 
                    fill="#9B7EBD" 
                    background={{ fill: "#D4BEE4" }} 
                    radius={[10, 10, 10, 10]} 
                    label={{ position: "right", fill: "#3B1E54", fontWeight: "bold" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart for Skill Distribution */}
            <div className="bg-[#EEEEEE]/70 p-4 rounded-2xl shadow-md border border-[#9B7EBD]/30">
              <h2 className="text-[#3B1E54] font-semibold mb-4 text-center">Skill Distribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={skillDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {skillDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#D4BEE4", borderRadius: "10px", border: "none" }}
                    itemStyle={{ color: "#3B1E54" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consistency Area Chart */}
          <div className="bg-[#EEEEEE]/70 p-4 rounded-2xl shadow-md border border-[#9B7EBD]/30 mb-8">
            <h2 className="text-[#3B1E54] font-semibold mb-4 text-center">Consistency Overview</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#9B7EBD" opacity={0.3} />
                <XAxis dataKey="week" stroke="#3B1E54" />
                <YAxis stroke="#3B1E54" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#D4BEE4", borderRadius: "10px", border: "none" }}
                  itemStyle={{ color: "#3B1E54" }}
                />
                <Area type="monotone" dataKey="pronunciation" stroke="#3B1E54" fill="#3B1E54" fillOpacity={0.3} />
                <Area type="monotone" dataKey="fluency" stroke="#9B7EBD" fill="#9B7EBD" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Individual Progress Cards */}
          <div className="space-y-6">
            {progressData.map((item, index) => (
              <div
                key={index}
                className="bg-[#EEEEEE] p-6 rounded-2xl border border-[#9B7EBD]/30 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-[#3B1E54] text-lg">{item.metric}</span>
                  <span className={`flex items-center gap-2 font-semibold text-sm ${item.pass ? "text-[#7D9D9C]" : "text-[#3B1E54]"}`}>
                    {item.pass ? <FaCheckCircle /> : <FaTimesCircle />}
                    {item.pass ? "Pass" : "Fail"}
                  </span>
                </div>

                <div className="w-full bg-[#9B7EBD]/30 rounded-full h-4 mb-2">
                  <div
                    className={`h-4 rounded-full transition-all duration-1000 ${item.pass ? "bg-[#7D9D9C]" : "bg-[#3B1E54]"}`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm text-[#3B1E54] mb-3">
                  <span>0%</span>
                  <span>{item.progress}%</span>
                  <span>100%</span>
                </div>

                <div className="bg-[#9B7EBD]/20 p-3 rounded-lg flex items-start gap-2">
                  <FaRobot className="text-[#3B1E54] mt-1" />
                  <p className="text-[#3B1E54] text-sm italic">{item.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
