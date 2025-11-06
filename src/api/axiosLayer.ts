// src/api/axiosInstance.ts
import axios from 'axios';

const instance = axios.create({
  // baseURL: "api/v1", // set in .env
  baseURL: "http://192.168.1.10:30333/api",
  // baseURL: "http://localhost:3333/api",
  withCredentials: true,
});


export default instance;
