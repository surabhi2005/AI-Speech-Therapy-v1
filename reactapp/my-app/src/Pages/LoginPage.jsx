import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  // Mock users database with age instead of role
  const mockUsers = [
    { email: "kid@example.com", password: "kid123", age: 4 },
    { email: "teen@example.com", password: "teen123", age: 12 },
    { email: "adult@example.com", password: "adult123", age: 25 },
  ];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Find user by email and password
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));

      // Age-based navigation
      if (user.age >= 0 && user.age <= 5) {
        navigate("/dashboard/kids");
      } else if (user.age >= 6 && user.age <= 15) {
        navigate("/dashboard/teen");
      } else {
        navigate("/dashboard/adult");
      }
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEEEEE] to-[#D4BEE4]">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
        <h2 className="text-4xl font-extrabold text-[#3B1E54] text-center mb-6">
          Login
        </h2>
        <form className="space-y-5" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9B7EBD]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#9B7EBD]"
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-[#3B1E54] to-[#9B7EBD] text-white font-bold rounded-xl hover:from-[#9B7EBD] hover:to-[#3B1E54] transition duration-300 shadow-lg"
          >
            Login
          </button>
        </form>
        <p className="text-center text-gray-500 mt-4">
          Don’t have an account?{" "}
          <a href="/signup" className="text-[#3B1E54] font-semibold hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
