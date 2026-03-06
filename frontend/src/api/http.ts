import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from '@/store/auth';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 10000);

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const response = error.response;
    const originalConfig = error.config as RetryConfig | undefined;

    if (!response || !originalConfig) {
      return Promise.reject(error);
    }

    if (response.status !== 401 || originalConfig._retry) {
      return Promise.reject(error);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      clearAuthSession();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }
          originalConfig.headers = originalConfig.headers || {};
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          resolve(http(originalConfig));
        });
      });
    }

    isRefreshing = true;
    try {
      // 注意：refresh 接口是 simplejwt 默认返回（非统一包裹格式）
      const refreshResp = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
        refresh,
      });

      const newAccess = refreshResp.data?.access as string | undefined;
      const newRefresh = (refreshResp.data?.refresh as string | undefined) || refresh;

      if (!newAccess) {
        throw new Error('refresh 返回缺少 access');
      }

      setAuthSession({ access: newAccess, refresh: newRefresh });
      flushQueue(newAccess);

      originalConfig.headers = originalConfig.headers || {};
      originalConfig.headers.Authorization = `Bearer ${newAccess}`;
      return http(originalConfig);
    } catch (e) {
      flushQueue(null);
      clearAuthSession();
      window.location.href = '/login';
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  },
);