import { AxiosError } from 'axios';
import { http } from '@/api/http';
import type { AuthUser } from '@/store/auth';

type ApiResp<T> = {
  code: number;
  message: string;
  data: T;
};

export async function getMe() {
  const resp = await http.get<ApiResp<AuthUser>>('/api/users/me/');
  return resp.data.data;
}

export type PatchMePayload = {
  nickname?: string;
  bio?: string;
  campus?: 'xihai' | 'laoshan' | 'yushan';
  avatarFile?: File;
};

export function parseUserApiError(err: unknown, fallback = '请求失败') {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
}

export async function patchMe(payload: PatchMePayload) {
  const form = new FormData();
  if (payload.nickname !== undefined) form.append('nickname', payload.nickname);
  if (payload.bio !== undefined) form.append('bio', payload.bio);
  if (payload.campus !== undefined) form.append('campus', payload.campus);
  if (payload.avatarFile) form.append('avatar', payload.avatarFile);
  const resp = await http.patch<ApiResp<AuthUser>>('/api/users/me/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resp.data.data;
}
