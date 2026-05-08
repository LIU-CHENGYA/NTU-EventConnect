import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8010";

const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
