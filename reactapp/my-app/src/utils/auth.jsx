import { jwtDecode } from "jwt-decode";

export function isTokenValid(token) {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);

    // If JWT has exp claim, validate it
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return false;
    }

    // Optional: check required fields like `sub` or `email`
    if (!decoded.sub || !decoded.email) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("Invalid token:", err);
    return false;
  }
}
