// import React from "react";

// export default function SignupPage() {
//   return (
//     <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
//       <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
//         <h2 className="text-3xl font-bold text-teal-700 text-center mb-6">Sign Up</h2>
//         <form className="space-y-5">
//           <input
//             type="text"
//             placeholder="Full Name"
//             className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-400"
//           />
//           <input
//             type="email"
//             placeholder="Email"
//             className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-400"
//           />
//           <input
//             type="password"
//             placeholder="Password"
//             className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-400"
//           />
//           <input
//             type="password"
//             placeholder="Confirm Password"
//             className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-400"
//           />

//           {/* Role Selection */}
//           <select
//             className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-400"
//             defaultValue=""
//           >
//             <option value="" disabled>
//               Select Role
//             </option>
//             <option value="kids">Kids (0–5)</option>
//             <option value="teen">Teen (5–15)</option>
//             <option value="adult">Adult (15+)</option>
//           </select>

//           <button
//             type="submit"
//             className="w-full px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition"
//           >
//             Create Account
//           </button>
//         </form>
//         <p className="text-center text-gray-600 mt-4">
//           Already have an account?{" "}
//           <a href="/login" className="text-teal-600 hover:underline">
//             Login
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// }
import React from "react";

export default function SignupPage() {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEEEEE] to-[#D4BEE4]">
      {/* Card Container */}
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg transform transition-transform duration-300 hover:scale-105">
        {/* Header */}
        <h2 className="text-4xl font-extrabold text-[#3B1E54] text-center mb-8">
          Create Your Account
        </h2>

        {/* Form */}
        <form className="space-y-6">
          {/* Full Name */}
          <div className="relative">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
            />
          </div>

          {/* Age */}
          <div className="relative">
            <input
              type="number"
              placeholder="Age"
              min="0"
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-[#3B1E54] to-[#9B7EBD] text-white font-bold rounded-xl hover:from-[#9B7EBD] hover:to-[#3B1E54] transition duration-300 shadow-lg"
          >
            Sign Up
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-[#3B1E54] font-semibold hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
