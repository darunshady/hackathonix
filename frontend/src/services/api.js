import axios from "axios";

/**
 * Pre-configured Axios instance pointing at the NanoBiz backend.
 * Base URL can be overridden via the VITE_API_URL env variable.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export default api;
