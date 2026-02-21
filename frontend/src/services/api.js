import axios from "axios";

/**
 * Pre-configured Axios instance pointing at the NanoBiz backend.
 * Uses relative "/api" path — Vite dev-server proxies it to the backend.
 */
const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export default api;
