export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token expired or invalid → redirect to login
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return response;
}
