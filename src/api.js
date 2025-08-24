import axios from "axios";

///   ยังไม่ได้ลง ENV โดยทั่วไปจะใช้ env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:3000",
});

// ดึง token จาก localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
