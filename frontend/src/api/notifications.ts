import { AxiosError } from 'axios';
import { http } from '@/api/http';

type ApiResp<T> = {
  code: number;
  message: string;
  data: T;
};

type PaginatedResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type NotificationItem = {
  id: number;
  recipient_id: number;
  sender_id: number | null;
  category: string;
  title: string;
  content: string;
  extra: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

function unwrap<T>(payload: ApiResp<T>) {
  return payload.data;
}

function normalizeList<T>(data: PaginatedResp<T> | T[]) {
  if (Array.isArray(data)) return data;
  if ('results' in data) return data.results;
  return [];
}

export function parseNotificationApiError(err: unknown, fallback = '请求失败') {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
}

export async function getNotifications(params?: { is_read?: boolean; category?: string }) {
  const resp = await http.get<ApiResp<PaginatedResp<NotificationItem> | NotificationItem[]>>('/api/notifications/', {
    params: {
      is_read: params?.is_read === undefined ? undefined : String(params.is_read),
      category: params?.category,
    },
  });
  return normalizeList(unwrap(resp.data));
}

export async function getNotificationDetail(id: number) {
  const resp = await http.get<ApiResp<NotificationItem>>(`/api/notifications/${id}/`);
  return unwrap(resp.data);
}

export async function deleteNotification(id: number) {
  const resp = await http.delete<ApiResp<null>>(`/api/notifications/${id}/`);
  return unwrap(resp.data);
}

export async function markNotificationRead(id: number) {
  const resp = await http.post<ApiResp<NotificationItem>>(`/api/notifications/${id}/read/`);
  return unwrap(resp.data);
}

export async function markAllNotificationsRead() {
  const resp = await http.post<ApiResp<{ updated: number }>>('/api/notifications/mark_all_read/');
  return unwrap(resp.data);
}

export async function getNotificationUnreadCount() {
  const resp = await http.get<ApiResp<{ unread_count: number }>>('/api/notifications/unread_count/');
  return unwrap(resp.data);
}

