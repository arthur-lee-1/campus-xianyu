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

const LOCAL_FAVORITES_KEY = 'campus_trade_favorites_v1';
const LOCAL_FOLLOWS_KEY = 'campus_trade_follows_v1';

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

function getCurrentUserId() {
  const raw = localStorage.getItem('campus_trade_user');
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as { id?: number };
    return user.id ?? null;
  } catch {
    return null;
  }
}

function readFavoriteStore(): Record<string, FavoriteItem[]> {
  const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, FavoriteItem[]>;
  } catch {
    return {};
  }
}

function writeFavoriteStore(store: Record<string, FavoriteItem[]>) {
  localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(store));
}

function getLocalFavorites(userId: number) {
  const store = readFavoriteStore();
  return store[String(userId)] || [];
}

function setLocalFavorites(userId: number, list: FavoriteItem[]) {
  const store = readFavoriteStore();
  store[String(userId)] = list;
  writeFavoriteStore(store);
}

function readFollowStore(): Record<string, FollowItem[]> {
  const raw = localStorage.getItem(LOCAL_FOLLOWS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, FollowItem[]>;
  } catch {
    return {};
  }
}

function writeFollowStore(store: Record<string, FollowItem[]>) {
  localStorage.setItem(LOCAL_FOLLOWS_KEY, JSON.stringify(store));
}

function getLocalFollowing(userId: number) {
  const store = readFollowStore();
  return store[String(userId)] || [];
}

function setLocalFollowing(userId: number, list: FollowItem[]) {
  const store = readFollowStore();
  store[String(userId)] = list;
  writeFollowStore(store);
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
  const uid = getCurrentUserId() || 0;
  const local = getLocalFollowing(uid);
  try {
    const resp = await http.post<ApiResp<FollowItem>>(`/api/interactions/users/${userId}/follow/`);
    const created = unwrap(resp.data);
    setLocalFollowing(uid, [...local.filter((item) => item.followed_id !== userId), created]);
    return created;
  } catch (e) {
    if (!canFallback(e)) throw e;
    const localItem: FollowItem = {
      id: Date.now(),
      follower_id: uid,
      followed_id: userId,
      created_at: new Date().toISOString(),
    };
    setLocalFollowing(uid, [...local.filter((item) => item.followed_id !== userId), localItem]);
    return localItem;
  }
}

export async function unfollowUser(userId: number) {
  const uid = getCurrentUserId() || 0;
  const local = getLocalFollowing(uid);
  try {
    const resp = await http.delete<ApiResp<null>>(`/api/interactions/users/${userId}/follow/`);
    setLocalFollowing(
      uid,
      local.filter((item) => item.followed_id !== userId),
    );
    return unwrap(resp.data);
  } catch (e) {
    if (!canFallback(e)) throw e;
    setLocalFollowing(
      uid,
      local.filter((item) => item.followed_id !== userId),
    );
    return null;
  }
}

export async function getMyFollowers() {
  const uid = getCurrentUserId() || 0;
  try {
    const resp = await http.get<ApiResp<PaginatedResp<FollowItem> | FollowItem[]>>('/api/interactions/me/followers/');
    const remote = normalizeList(unwrap(resp.data));
    if (!FEATURE_FLAGS.USE_MOCK_FALLBACK) return remote;
    const localFollowers = Object.values(readFollowStore())
      .flat()
      .filter((item) => item.followed_id === uid);
    const map = new Map<number, FollowItem>();
    remote.forEach((item) => map.set(item.follower_id, item));
    localFollowers.forEach((item) => map.set(item.follower_id, item));
    return Array.from(map.values());
  } catch (e) {
    if (!canFallback(e)) throw e;
    return Object.values(readFollowStore())
      .flat()
      .filter((item) => item.followed_id === uid);
  }
}

export async function getMyFollowing() {
  const uid = getCurrentUserId() || 0;
  try {
    const resp = await http.get<ApiResp<PaginatedResp<FollowItem> | FollowItem[]>>('/api/interactions/me/following/');
    const remote = normalizeList(unwrap(resp.data));
    if (!FEATURE_FLAGS.USE_MOCK_FALLBACK) return remote;
    const local = getLocalFollowing(uid);
    const map = new Map<number, FollowItem>();
    remote.forEach((item) => map.set(item.followed_id, item));
    local.forEach((item) => map.set(item.followed_id, item));
    return Array.from(map.values());
  } catch (e) {
    if (!canFallback(e)) throw e;
    return getLocalFollowing(uid);
  }
}

export async function getMyFavorites() {
  const uid = getCurrentUserId() || 0;
  try {
    const resp = await http.get<ApiResp<PaginatedResp<FavoriteItem> | FavoriteItem[]>>('/api/interactions/me/favorites/');
    const remote = normalizeList(unwrap(resp.data));
    if (!FEATURE_FLAGS.USE_MOCK_FALLBACK) return remote;
    const local = getLocalFavorites(uid);
    const map = new Map<number, FavoriteItem>();
    remote.forEach((item) => map.set(item.product_id, item));
    local.forEach((item) => map.set(item.product_id, item));
    return Array.from(map.values());
  } catch (e) {
    if (!canFallback(e)) throw e;
    return getLocalFavorites(uid);
  }
}

export async function toggleFavorite(productId: number, currentlyFavorited: boolean) {
  const uid = getCurrentUserId() || 0;
  const local = getLocalFavorites(uid);
  if (currentlyFavorited) {
    try {
      const resp = await http.delete<ApiResp<null>>(`/api/interactions/products/${productId}/favorite/`);
      setLocalFavorites(
        uid,
        local.filter((item) => item.product_id !== productId),
      );
      return unwrap(resp.data);
    } catch (e) {
      if (!canFallback(e)) throw e;
      setLocalFavorites(
        uid,
        local.filter((item) => item.product_id !== productId),
      );
      return null;
    }
  }
  try {
    const resp = await http.post<ApiResp<FavoriteItem>>(`/api/interactions/products/${productId}/favorite/`);
    const created = unwrap(resp.data);
    setLocalFavorites(uid, [...local.filter((item) => item.product_id !== productId), created]);
    return created;
  } catch (e) {
    if (!canFallback(e)) throw e;
    const localItem: FavoriteItem = {
      id: Date.now(),
      user_id: uid,
      product_id: productId,
      created_at: new Date().toISOString(),
    };
    setLocalFavorites(uid, [...local.filter((item) => item.product_id !== productId), localItem]);
    return localItem;
  }
}

