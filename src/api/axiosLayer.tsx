// src/api/axiosInstance.ts
import axios from 'axios';

// window.location.hostname returns 'localhost' or '192.168.1.10', etc.
const hostname = window.location.hostname;

// Define your ports based on your setup
const PORT = "30333"; 

// Construct the baseURL dynamically
const baseURL = import.meta.env.VITE_BUILD_PROFILE === "local"? "http://localhost:3333/api" : `${window.location.protocol}://${hostname}:${PORT}/api`

const instance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

export default instance;