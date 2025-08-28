// import React, { useState } from "react";
// import { 
//   FaChartLine, FaCheckCircle, FaTimesCircle, FaBriefcase
// } from "react-icons/fa";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
//   LineChart, Line, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
// } from "recharts";

// export default function TeenProgress() {
//   const [timeRange, setTimeRange] = useState("monthly");

//   const progressData = [
//     { metric: "Professional Communication", progress: 85, feedback: "Excellent clarity and tone.", pass: true },
//     { metric: "Presentation Skills", progress: 70, feedback: "Good, but practice varying your pace.", pass: true },
//     { metric: "Networking Sessions Attended", progress: 40, feedback: "Participate more to build connections.", pass: false },
//     { metric: "Confidence in Meetings", progress: 75, feedback: "Great improvement over last month.", pass: true },
//   ];

//   const timeSeriesData = [
//     { week: 'Week 1', communication: 65, presentation: 60, confidence: 55 },
//     { week: 'Week 2', communication: 68, presentation: 63, confidence: 60 },
//     { week: 'Week 3', communication: 72, presentation: 67, confidence: 65 },
//     { week: 'Week 4', communication: 75, presentation: 70, confidence: 70 },
//     { week: 'Week 5', communication: 78, presentation: 72, confidence: 73 },
//     { week: 'Week 6', communication: 82, presentation: 75, confidence: 77 },
//   ];

//   const skillDistributionData = [
//     { name: "Communication", value: 40 },
//     { name: "Networking", value: 20 },
//     { name: "Presentation", value: 25 },
//     { name: "Leadership", value: 15 },
//   ];

//   const COLORS = ['#3B1E54', '#9B7EBD', '#D4BEE4', '#9B7EBD'];

//   const overallScore = Math.round(progressData.reduce((sum, item) => sum + item.progress, 0) / progressData.length);

//   return (
//     <div className="min-h-screen p-6" style={{ backgroundColor: "#EEEEEE" }}>
//       <div className="max-w-6xl mx-auto p-8 rounded-3xl shadow-xl border" style={{ backgroundColor: "#D4BEE4", borderColor: "#9B7EBD" }}>
//         <h1 className="text-3xl font-bold mb-8 flex items-center" style={{ color: "#3B1E54" }}>
//           <FaChartLine className="mr-3" style={{ color: "#9B7EBD" }} /> Teen Progress Overview
//         </h1>

//         {/* Time Range Selector */}
//         <div className="flex justify-end mb-6">
//           <div className="rounded-lg p-1" style={{ backgroundColor: "#EEEEEE" }}>
//             {["weekly", "monthly", "quarterly"].map(period => (
//               <button
//                 key={period}
//                 className={`px-3 py-1 rounded-md text-sm font-medium transition-colors`}
//                 onClick={() => setTimeRange(period)}
//                 style={{
//                   backgroundColor: timeRange === period ? "#3B1E54" : "#EEEEEE",
//                   color: timeRange === period ? "#FFFFFF" : "#3B1E54",
//                   marginRight: "5px"
//                 }}
//               >
//                 {period.charAt(0).toUpperCase() + period.slice(1)}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Top Charts */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           {/* Radial Chart */}
//           <div className="p-4 rounded-2xl shadow-md flex flex-col items-center" style={{ backgroundColor: "#EEEEEE" }}>
//             <h2 className="font-semibold mb-2" style={{ color: "#3B1E54" }}>Overall Score</h2>
//             <div className="w-full h-40">
//               <ResponsiveContainer width="100%" height="100%">
//                 <RadialBarChart
//                   cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" 
//                   data={[{ name: "Score", value: overallScore, fill: "#9B7EBD" }]} 
//                   startAngle={180} endAngle={0}
//                 >
//                   <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
//                 </RadialBarChart>
//               </ResponsiveContainer>
//             </div>
//             <span className="text-3xl font-bold mt-2" style={{ color: "#3B1E54" }}>{overallScore}%</span>
//           </div>

//           {/* Line Chart */}
//           <div className="p-4 rounded-2xl shadow-md md:col-span-2" style={{ backgroundColor: "#EEEEEE" }}>
//             <h2 className="font-semibold mb-4 text-center" style={{ color: "#3B1E54" }}>Progress Over Time</h2>
//             <ResponsiveContainer width="100%" height={200}>
//               <LineChart data={timeSeriesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#9B7EBD" opacity={0.3} />
//                 <XAxis dataKey="week" stroke="#3B1E54" />
//                 <YAxis stroke="#3B1E54" domain={[0, 100]} />
//                 <Tooltip 
//                   contentStyle={{ backgroundColor: "#D4BEE4", borderRadius: "10px", border: "none" }}
//                   itemStyle={{ color: "#3B1E54" }}
//                 />
//                 <Line type="monotone" dataKey="communication" stroke="#3B1E54" strokeWidth={2} dot={{ r: 4 }} />
//                 <Line type="monotone" dataKey="presentation" stroke="#9B7EBD" strokeWidth={2} dot={{ r: 4 }} />
//                 <Line type="monotone" dataKey="confidence" stroke="#D4BEE4" strokeWidth={2} dot={{ r: 4 }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Middle Charts */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           {/* Bar Chart */}
//           <div className="p-4 rounded-2xl shadow-md md:col-span-2" style={{ backgroundColor: "#EEEEEE" }}>
//             <h2 className="font-semibold mb-4 text-center" style={{ color: "#3B1E54" }}>Performance Metrics</h2>
//             <ResponsiveContainer width="100%" height={250}>
//               <BarChart data={progressData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
//                 <XAxis type="number" domain={[0, 100]} hide />
//                 <YAxis type="category" dataKey="metric" width={180} tick={{ fill: "#3B1E54", fontSize: 14 }} />
//                 <Tooltip 
//                   contentStyle={{ backgroundColor: "#D4BEE4", borderRadius: "10px", border: "none" }}
//                   itemStyle={{ color: "#3B1E54" }}
//                 />
//                 <Bar 
//                   dataKey="progress" 
//                   fill="#9B7EBD" 
//                   background={{ fill: "#D4BEE4" }} 
//                   radius={[10, 10, 10, 10]} 
//                   label={{ position: "right", fill: "#3B1E54", fontWeight: "bold" }}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Pie Chart */}
//           <div className="p-4 rounded-2xl shadow-md" style={{ backgroundColor: "#EEEEEE" }}>
//             <h2 className="font-semibold mb-4 text-center" style={{ color: "#3B1E54" }}>Skill Distribution</h2>
//             <ResponsiveContainer width="100%" height={250}>
//               <PieChart>
//                 <Pie
//                   data={skillDistributionData}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={false}
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="value"
//                   label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                 >
//                   {skillDistributionData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip 
//                   contentStyle={{ backgroundColor: "#D4BEE4", borderRadius: "10px", border: "none" }}
//                   itemStyle={{ color: "#3B1E54" }}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Individual Cards */}
//         <div className="space-y-6">
//           {progressData.map((item, index) => (
//             <div key={index} className="p-6 rounded-2xl border shadow-md" style={{ backgroundColor: "#EEEEEE", borderColor: "#9B7EBD" }}>
//               <div className="flex justify-between items-center mb-2">
//                 <span className="font-semibold text-lg" style={{ color: "#3B1E54" }}>{item.metric}</span>
//                 <span className={`flex items-center gap-2 font-semibold text-sm ${item.pass ? "text-[#3B1E54]" : "text-[#3B1E54]"}`}>
//                   {item.pass ? <FaCheckCircle style={{ color: "#3B1E54" }} /> : <FaTimesCircle style={{ color: "#3B1E54" }} />}
//                   {item.pass ? "Pass" : "Fail"}
//                 </span>
//               </div>

//               <div className="w-full rounded-full h-4 mb-2" style={{ backgroundColor: "#D4BEE4" }}>
//                 <div className="h-4 rounded-full transition-all duration-1000" style={{ width: `${item.progress}%`, backgroundColor: item.pass ? "#3B1E54" : "#9B7EBD" }}></div>
//               </div>

//               <div className="flex justify-between text-sm mb-3" style={{ color: "#3B1E54" }}>
//                 <span>0%</span>
//                 <span>{item.progress}%</span>
//                 <span>100%</span>
//               </div>

//               <div className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: "#D4BEE4" }}>
//                 <FaBriefcase className="mt-1" style={{ color: "#3B1E54" }} />
//                 <p className="text-sm italic" style={{ color: "#3B1E54" }}>{item.feedback}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//       </div>
//     </div>
//   );
// }
import React, { useState } from "react";
import TeenSidebar from "./TeenSidebar"; // Import the existing sidebar
import { 
  FaChartLine, FaCheckCircle, FaTimesCircle, FaBriefcase
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid
} from "recharts";

export default function TeenProgress() {
  const [timeRange, setTimeRange] = useState("monthly");

  const progressData = [
    { metric: "Professional Communication", progress: 85, feedback: "Excellent clarity and tone.", pass: true },
    { metric: "Presentation Skills", progress: 70, feedback: "Good, but practice varying your pace.", pass: true },
    { metric: "Networking Sessions Attended", progress: 40, feedback: "Participate more to build connections.", pass: false },
    { metric: "Confidence in Meetings", progress: 75, feedback: "Great improvement over last month.", pass: true },
  ];

  const timeSeriesData = [
    { week: 'Week 1', communication: 65, presentation: 60, confidence: 55 },
    { week: 'Week 2', communication: 68, presentation: 63, confidence: 60 },
    { week: 'Week 3', communication: 72, presentation: 67, confidence: 65 },
    { week: 'Week 4', communication: 75, presentation: 70, confidence: 70 },
    { week: 'Week 5', communication: 78, presentation: 72, confidence: 73 },
    { week: 'Week 6', communication: 82, presentation: 75, confidence: 77 },
  ];

  const skillDistributionData = [
    { name: "Communication", value: 40 },
    { name: "Networking", value: 20 },
    { name: "Presentation", value: 25 },
    { name: "Leadership", value: 15 },
  ];

  const COLORS = ['#3B1E54', '#9B7EBD', '#D4BEE4', '#9B7EBD'];

  const overallScore = Math.round(progressData.reduce((sum, item) => sum + item.progress, 0) / progressData.length);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#EEEEEE" }}>
      {/* Sidebar */}
      <TeenSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto p-8 rounded-3xl shadow-xl border" style={{ backgroundColor: "#D4BEE4", borderColor: "#9B7EBD" }}>
          <h1 className="text-3xl font-bold mb-8 flex items-center" style={{ color: "#3B1E54" }}>
            <FaChartLine className="mr-3" style={{ color: "#9B7EBD" }} /> Teen Progress Overview
          </h1>

          {/* Time Range Selector */}
          <div className="flex justify-end mb-6">
            <div className="rounded-lg p-1" style={{ backgroundColor: "#EEEEEE" }}>
              {["weekly", "monthly", "quarterly"].map(period => (
                <button
                  key={period}
                  className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
                  onClick={() => setTimeRange(period)}
                  style={{
                    backgroundColor: timeRange === period ? "#3B1E54" : "#EEEEEE",
                    color: timeRange === period ? "#FFFFFF" : "#3B1E54",
                    marginRight: "5px"
                  }}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Top Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Radial Chart */}
            <div className="p-4 rounded-2xl shadow-md flex flex-col items-center" style={{ backgroundColor: "#EEEEEE" }}>
              <h2 className="font-semibold mb-2" style={{ color: "#3B1E54" }}>Overall Score</h2>
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
              <span className="text-3xl font-bold mt-2" style={{ color: "#3B1E54" }}>{overallScore}%</span>
            </div>

            {/* Line Chart */}
            <div className="p-4 rounded-2xl shadow-md md:col-span-2" style={{ backgroundColor: "#EEEEEE" }}>
              <h2 className="font-semibold mb-4 text-center" style={{ color: "#3B1E54" }}>Progress Over Time</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeriesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9B7EBD" opacity={0.3} />
                  <XAxis dataKey="week" stroke="#3B1E54" />
                  <YAxis stroke="#3B1E54" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#D4BEE4", borderRadius: "10px", border: "none" }}
                    itemStyle={{ color: "#3B1E54" }}
                  />
                  <Line type="monotone" dataKey="communication" stroke="#3B1E54" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="presentation" stroke="#9B7EBD" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="confidence" stroke="#D4BEE4" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Middle Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Bar Chart */}
            <div className="p-4 rounded-2xl shadow-md md:col-span-2" style={{ backgroundColor: "#EEEEEE" }}>
              <h2 className="font-semibold mb-4 text-center" style={{ color: "#3B1E54" }}>Performance Metrics</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={progressData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="metric" width={180} tick={{ fill: "#3B1E54", fontSize: 14 }} />
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

            {/* Pie Chart */}
            <div className="p-4 rounded-2xl shadow-md" style={{ backgroundColor: "#EEEEEE" }}>
              <h2 className="font-semibold mb-4 text-center" style={{ color: "#3B1E54" }}>Skill Distribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={skillDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
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

          {/* Individual Cards */}
          <div className="space-y-6">
            {progressData.map((item, index) => (
              <div key={index} className="p-6 rounded-2xl border shadow-md" style={{ backgroundColor: "#EEEEEE", borderColor: "#9B7EBD" }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg" style={{ color: "#3B1E54" }}>{item.metric}</span>
                  <span className={`flex items-center gap-2 font-semibold text-sm ${item.pass ? "text-[#3B1E54]" : "text-[#3B1E54]"}`}>
                    {item.pass ? <FaCheckCircle style={{ color: "#3B1E54" }} /> : <FaTimesCircle style={{ color: "#3B1E54" }} />}
                    {item.pass ? "Pass" : "Fail"}
                  </span>
                </div>

                <div className="w-full rounded-full h-4 mb-2" style={{ backgroundColor: "#D4BEE4" }}>
                  <div className="h-4 rounded-full transition-all duration-1000" style={{ width: `${item.progress}%`, backgroundColor: item.pass ? "#3B1E54" : "#9B7EBD" }}></div>
                </div>

                <div className="flex justify-between text-sm mb-3" style={{ color: "#3B1E54" }}>
                  <span>0%</span>
                  <span>{item.progress}%</span>
                  <span>100%</span>
                </div>

                <div className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: "#D4BEE4" }}>
                  <FaBriefcase className="mt-1" style={{ color: "#3B1E54" }} />
                  <p className="text-sm italic" style={{ color: "#3B1E54" }}>{item.feedback}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
