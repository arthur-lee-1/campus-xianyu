import axios from 'axios';
import { getAccessToken } from '@/store/auth';

/**
 * Axios 实例（按 README 约定：统一封装、按模块拆分）
 *
 * - baseURL：来自 `VITE_API_BASE_URL`（例如 http://localhost:8000）
 * - 请求拦截器：自动带上 Authorization
 *
 * 注意：
 * - README 提到“JWT 自动刷新拦截器”，这里先留好接口/结构，后续对接后端 refresh API 时补齐。
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

