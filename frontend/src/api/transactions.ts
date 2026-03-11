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

export type TransactionItem = {
  id: number;
  product_id: number;
  buyer_id: number;
  seller_id: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: string;
  remark: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string;
  created_at: string;
  updated_at: string;
};

export type RatingItem = {
  id: number;
  transaction: number;
  rater_id: number;
  ratee_id: number;
  role: 'buyer' | 'seller';
  score: number;
  comment: string;
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

export function parseTransactionApiError(err: unknown, fallback = '请求失败') {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
}

export async function getTransactions(params?: { status?: TransactionItem['status'] }) {
  const resp = await http.get<ApiResp<PaginatedResp<TransactionItem> | TransactionItem[]>>('/api/transactions/', {
    params,
  });
  return normalizeList(unwrap(resp.data));
}

export async function getTransactionDetail(id: number) {
  const resp = await http.get<ApiResp<TransactionItem>>(`/api/transactions/${id}/`);
  return unwrap(resp.data);
}

export async function createTransaction(payload: { product_id: number; price?: number; remark?: string }) {
  const resp = await http.post<ApiResp<TransactionItem>>('/api/transactions/', payload);
  return unwrap(resp.data);
}

export async function confirmTransaction(id: number) {
  const resp = await http.post<ApiResp<TransactionItem>>(`/api/transactions/${id}/confirm/`);
  return unwrap(resp.data);
}

export async function completeTransaction(id: number) {
  const resp = await http.post<ApiResp<TransactionItem>>(`/api/transactions/${id}/complete/`);
  return unwrap(resp.data);
}

export async function cancelTransaction(id: number, cancel_reason?: string) {
  const resp = await http.post<ApiResp<TransactionItem>>(`/api/transactions/${id}/cancel/`, {
    cancel_reason: cancel_reason || '',
  });
  return unwrap(resp.data);
}

export async function rateTransaction(id: number, payload: { score: number; comment?: string }) {
  const resp = await http.post<ApiResp<RatingItem>>(`/api/transactions/${id}/rate/`, payload);
  return unwrap(resp.data);
}

export async function getMyRatings() {
  const resp = await http.get<ApiResp<{ given: RatingItem[]; received: RatingItem[] }>>('/api/transactions/ratings/me/');
  return unwrap(resp.data);
}

