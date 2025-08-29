import React, { useState } from "react";
import axios from "axios";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/auth/signup", {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age, 10),
      });

      setMessage("Signup successful! Please login.");
      console.log(response.data);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.detail || "Signup failed");
      } else {
        setMessage("Network error");
      }
    }
  };

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEEEEE] to-[#D4BEE4]">
      {/* Card Container */}
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg transform transition-transform duration-300 hover:scale-105">
        {/* Header */}
        <h2 className="text-4xl font-extrabold text-[#3B1E54] text-center mb-8">
          Create Your Account
        </h2>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="relative">
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
              required
            />
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
              required
            />
          </div>

          {/* Age */}
          <div className="relative">
            <input
              type="number"
              name="age"
              placeholder="Age"
              min="0"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7EBD] placeholder-gray-400 transition"
              required
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
          <a
            href="/login"
            className="text-[#3B1E54] font-semibold hover:underline"
          >
            Login
          </a>
        </p>

        {/* Message */}
        {message && (
          <p className="text-center mt-4 text-red-500 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
