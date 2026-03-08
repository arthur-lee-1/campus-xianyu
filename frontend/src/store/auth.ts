import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'campus_trade_access_token';
const REFRESH_TOKEN_KEY = 'campus_trade_refresh_token';
const USER_KEY = 'campus_trade_user';

export type AuthUser = {
  id: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  bio: string;
  school: string;
  date_joined: string;
};

type SessionPayload = {
  access: string;
  refresh?: string;
  user?: AuthUser | null;
};

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrate: () => void;
  setSession: (payload: SessionPayload) => void;
  setAccessToken: (token: string) => void; // 兼容旧调用
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,

  hydrate: () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
    set({
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      user,
    });
  },

  setSession: ({ access, refresh, user }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    if (user !== undefined) localStorage.setItem(USER_KEY, JSON.stringify(user));

    set((prev) => ({
      accessToken: access,
      refreshToken: refresh ?? prev.refreshToken,
      user: user ?? prev.user,
    }));
  },

  setAccessToken: (token: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    set({ accessToken: token });
  },

  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthSession(payload: SessionPayload) {
  useAuthStore.getState().setSession(payload);
}

export function clearAuthSession() {
  useAuthStore.getState().logout();
}