// src/api/axiosInstance.ts
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // set in .env
  // baseURL: "api/v1", // set in .env
  // baseURL: "https://demo.linkliang.cc/api/v1",
  withCredentials: false,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("video_preview");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // console.log("Added token to request:", token);
  }
  return config;
});

export default instance;
