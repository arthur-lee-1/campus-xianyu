import { AxiosError } from 'axios';
import { http } from '@/api/http';
import type { AuthUser } from '@/store/auth';

type ApiResp<T> = {
  code: number;
  message: string;
  data: T;
};

type LoginData = {
  access: string;
  refresh: string;
  is_new: boolean;
  user: AuthUser;
};

function canFallbackToMockAuth(err: unknown) {
  const e = err as AxiosError;
  const status = e.response?.status;
  // 后端未启动/接口未就绪/网关不可用时，允许前端演示模式兜底
  return !e.response || status === 404 || status === 502 || status === 503 || status === 504;
}

function createMockLoginData(phone: string): LoginData {
  const now = new Date().toISOString();
  return {
    access: `mock_access_${Date.now()}`,
    refresh: `mock_refresh_${Date.now()}`,
    is_new: false,
    user: {
      id: 1,
      phone,
      nickname: '同学',
      avatar: null,
      bio: '这个人很神秘，什么都没留下',
      school: '中国海洋大学',
      date_joined: now,
    },
  };
}

export function parseApiError(err: unknown, fallback = '请求失败') {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
}

function unwrap<T>(payload: ApiResp<T>): T {
  return payload.data;
}

export async function sendLoginCode(phone: string) {
  try {
    const resp = await http.post<ApiResp<null>>('/api/auth/sms/', { phone });
    return unwrap(resp.data);
  } catch (err) {
    if (canFallbackToMockAuth(err)) {
      // 演示模式下视为发送成功，避免阻塞前端联调
      return null;
    }
    throw err;
  }
}

export async function loginWithPhoneCode(phone: string, code: string) {
  try {
    const resp = await http.post<ApiResp<LoginData>>('/api/auth/login/phone/', { phone, code });
    return unwrap(resp.data);
  } catch (err) {
    if (canFallbackToMockAuth(err)) {
      return createMockLoginData(phone);
    }
    throw err;
  }
}

export async function loginWithSocial(params: {
  platform: 'wechat' | 'qq';
  openid: string;
  union_id?: string;
  phone?: string;
  code?: string;
}) {
  const resp = await http.post<ApiResp<LoginData>>('/api/auth/login/social/', params);
  return unwrap(resp.data);
}

export async function logout(refresh: string) {
  const resp = await http.post<ApiResp<null>>('/api/auth/logout/', { refresh });
  return unwrap(resp.data);
}