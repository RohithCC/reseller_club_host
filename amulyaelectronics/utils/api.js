// ─────────────────────────────────────────────────────────────────────
//  frontend/utils/api.js
//  Tiny axios wrapper that auto-attaches the token from localStorage.
// ─────────────────────────────────────────────────────────────────────
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;