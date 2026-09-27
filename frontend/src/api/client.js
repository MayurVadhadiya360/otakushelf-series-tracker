import axios from "axios";

// Empty string baseURL means "same origin as the page" — exactly right for
// production, where FastAPI serves both the API and the built frontend.
// In development, .env sets VITE_API_URL to the FastAPI dev server.
const API_URL = import.meta.env.VITE_API_URL || "";

const client = axios.create({
  baseURL: API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("otakushelf_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
