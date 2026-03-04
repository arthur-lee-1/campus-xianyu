import { create } from 'zustand';

/**
 * Auth Store（登录态）
 *
 * 为什么要有它：
 * - 登录页需要在“登录成功”后存 token，并驱动页面跳转
 * - 路由守卫需要能判断是否已登录（是否有 accessToken）
 *
 * 约定：
 * - 这里先用 localStorage 持久化（便于简单接入）
 * - 后续如需更安全的方案（HttpOnly Cookie / refresh token 轮换），再升级即可
 */

const ACCESS_TOKEN_KEY = 'campus_xianyu_access_token';

export type AuthState = {
  accessToken: string | null;
  /** 初始化：从 localStorage 恢复登录态（刷新页面不丢） */
  hydrate: () => void;
  /** 设置 token：登录成功时调用 */
  setAccessToken: (token: string) => void;
  /** 退出登录：清空 token */
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  hydrate: () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    set({ accessToken: token || null });
  },
  setAccessToken: (token: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    set({ accessToken: token });
  },
  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    set({ accessToken: null });
  },
}));

/**
 * 同步读取 token 的小工具：
 * - 在 axios 拦截器里无法方便地使用 hook，所以提供这个函数。
 */
export function getAccessToken(): string | null {
  return getLocalToken();
}

function getLocalToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

