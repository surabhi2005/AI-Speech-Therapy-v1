import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const valid = isTokenValid(token);

  console.log("ProtectedRoute: token =", token, "isValid =", valid);

  if (!valid) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  return children;
}
