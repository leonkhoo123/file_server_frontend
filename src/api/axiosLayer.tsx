// src/api/axiosInstance.ts
import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { getConfig } from '../config';

const instance = axios.create({
  withCredentials: true,
});

// Use interceptor to dynamically set baseURL in case it's not set immediately,
// though in our setup loadConfig() runs before rendering, so it's guaranteed.
instance.interceptors.request.use((config) => {
  config.baseURL ??= getConfig().apiBaseUrl;
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void, reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    // If 401 and we haven't retried yet, and it's not the refresh endpoint itself
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && originalRequest.url && !originalRequest.url.includes('/refresh') && !originalRequest.url.includes('/login')) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return instance(originalRequest);
        }).catch((err: unknown) => {
          return Promise.reject(err instanceof Error ? err : new Error(String(err)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await instance.post('/refresh', null, { withCredentials: true });
        processQueue(null);
        return await instance(originalRequest);
      } catch (err: unknown) {
        processQueue(err, null);
        // Dispatch custom event to trigger logout or redirect
        window.dispatchEvent(new Event('auth:unauthorized'));
        return await Promise.reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;