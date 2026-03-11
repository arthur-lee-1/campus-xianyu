import { AxiosError } from 'axios';
import { http } from '@/api/http';
import { FEATURE_FLAGS } from '@/config/featureFlags';

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

export type ProductComment = {
  id: number;
  product: number;
  author_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
};

export type FollowItem = {
  id: number;
  follower_id: number;
  followed_id: number;
  created_at: string;
};

export type FavoriteItem = {
  id: number;
  user_id: number;
  product_id: number;
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

function canFallback(err: unknown) {
  if (!FEATURE_FLAGS.USE_MOCK_FALLBACK) return false;
  const e = err as AxiosError;
  const status = e.response?.status;
  return !e.response || status === 404 || status === 502 || status === 503 || status === 504;
}

export function parseInteractionApiError(err: unknown, fallback = '请求失败') {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
}

export async function getProductComments(productId: number) {
  try {
    const resp = await http.get<ApiResp<PaginatedResp<ProductComment> | ProductComment[]>>(
      `/api/interactions/products/${productId}/comments/`,
    );
    return normalizeList(unwrap(resp.data));
  } catch (e) {
    if (!canFallback(e)) throw e;
    return [];
  }
}

export async function createProductComment(productId: number, content: string, parent?: number) {
  const resp = await http.post<ApiResp<ProductComment>>(`/api/interactions/products/${productId}/comments/`, {
    content,
    parent: parent || null,
  });
  return unwrap(resp.data);
}

export async function followUser(userId: number) {
  const resp = await http.post<ApiResp<FollowItem>>(`/api/interactions/users/${userId}/follow/`);
  return unwrap(resp.data);
}

export async function unfollowUser(userId: number) {
  const resp = await http.delete<ApiResp<null>>(`/api/interactions/users/${userId}/follow/`);
  return unwrap(resp.data);
}

export async function getMyFollowers() {
  try {
    const resp = await http.get<ApiResp<PaginatedResp<FollowItem> | FollowItem[]>>('/api/interactions/me/followers/');
    return normalizeList(unwrap(resp.data));
  } catch (e) {
    if (!canFallback(e)) throw e;
    return [];
  }
}

export async function getMyFollowing() {
  try {
    const resp = await http.get<ApiResp<PaginatedResp<FollowItem> | FollowItem[]>>('/api/interactions/me/following/');
    return normalizeList(unwrap(resp.data));
  } catch (e) {
    if (!canFallback(e)) throw e;
    return [];
  }
}

export async function getMyFavorites() {
  try {
    const resp = await http.get<ApiResp<PaginatedResp<FavoriteItem> | FavoriteItem[]>>('/api/interactions/me/favorites/');
    return normalizeList(unwrap(resp.data));
  } catch (e) {
    if (!canFallback(e)) throw e;
    return [];
  }
}

export async function toggleFavorite(productId: number, currentlyFavorited: boolean) {
  if (currentlyFavorited) {
    const resp = await http.delete<ApiResp<null>>(`/api/interactions/products/${productId}/favorite/`);
    return unwrap(resp.data);
  }
  const resp = await http.post<ApiResp<FavoriteItem>>(`/api/interactions/products/${productId}/favorite/`);
  return unwrap(resp.data);
}

