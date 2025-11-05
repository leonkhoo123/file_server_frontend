// src/api/axiosInstance.ts
import axios from 'axios';

const instance = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL, // set in .env
  // baseURL: "api/v1", // set in .env
  baseURL: "http://192.168.1.10:30333/api",
  withCredentials: false,
});


export default instance;
