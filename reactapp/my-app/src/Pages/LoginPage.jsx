import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);

      if (data.role === "Kid") {
        navigate("/dashboard/kids");
      } else if (data.role === "Teen") {
        navigate("/dashboard/teen");
      } else if (data.role === "Adult") {
        navigate("/dashboard/adult");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
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
          <a
            href="/signup"
            className="text-[#3B1E54] font-semibold hover:underline"
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
