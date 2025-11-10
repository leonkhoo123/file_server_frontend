// src/api/axiosInstance.ts
import axios from 'axios';

const baseURL = import.meta.env.VITE_BUILD_PROFILE === "local"? "http://localhost:3333/api" : "http://192.168.1.10:30333/api"
const instance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

export default instance;
