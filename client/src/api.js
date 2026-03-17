const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://mern-todo-app-z8d7.onrender.com";

const API_BASE_URL = (import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  ""
);

function buildHeaders(token, includeJson = false) {
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseApiResponse(response) {
  const raw = await response.text();
  console.log("RESPONSE STATUS:", response.status);
  console.log("RAW RESPONSE:", raw);

  let data = null;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `Server returned non-JSON response (status ${response.status}). Check VITE_API_URL: ${API_BASE_URL}`
    );
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export { API_BASE_URL, buildHeaders, parseApiResponse };
