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

export function parseApiError(err: unknown, fallback = '请求失败') {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
}

function unwrap<T>(payload: ApiResp<T>): T {
  return payload.data;
}

export async function sendLoginCode(phone: string) {
  const resp = await http.post<ApiResp<null>>('/api/auth/sms/', { phone });
  return unwrap(resp.data);
}

export async function loginWithPhoneCode(phone: string, code: string) {
  const resp = await http.post<ApiResp<LoginData>>('/api/auth/login/phone/', { phone, code });
  return unwrap(resp.data);
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