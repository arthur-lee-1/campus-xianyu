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
