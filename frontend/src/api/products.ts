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

export type ProductCategory = {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
};

export type ProductListItem = {
  id: number;
  title: string;
  price: string;
  original_price: string | null;
  condition: string;
  campus: 'xihai' | 'laoshan' | 'yushan';
  status: 'on_sale' | 'sold' | 'off_shelf';
  view_count: number;
  like_count: number;
  created_at: string;
  category: ProductCategory | null;
  cover_image: string | null;
  seller: {
    id: number;
    name: string;
    avatar: string | null;
    campus: string | null;
  };
};

export type ProductDetail = ProductListItem & {
  description: string;
  updated_at: string;
  images: Array<{
    id: number;
    image: string;
    image_url: string | null;
    sort_order: number;
  }>;
};

export type CreateProductPayload = {
  category: number;
  campus: 'xihai' | 'laoshan' | 'yushan';
  title: string;
  description: string;
  price: number;
  original_price?: number;
  condition: 'like_new' | 'good' | 'fair' | 'poor';
  image_files?: File[];
};

const LOCAL_MY_PRODUCTS_KEY = 'campus_trade_my_products_v1';

function unwrap<T>(payload: ApiResp<T>) {
  return payload.data;
}

function normalizeList<T>(data: PaginatedResp<T> | T[]) {
  if (Array.isArray(data)) return data;
  if ('results' in data) return data.results;
  return [];
}

function normalizeMaybeWrappedList<T>(raw: ApiResp<PaginatedResp<T> | T[]> | PaginatedResp<T> | T[]) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return normalizeList((raw as ApiResp<PaginatedResp<T> | T[]>).data);
  }
  return normalizeList(raw as PaginatedResp<T> | T[]);
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

function readMyProductsCache(): ProductListItem[] {
  const raw = localStorage.getItem(LOCAL_MY_PRODUCTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ProductListItem[];
  } catch {
    return [];
  }
}

function writeMyProductsCache(list: ProductListItem[]) {
  localStorage.setItem(LOCAL_MY_PRODUCTS_KEY, JSON.stringify(list));
}

function upsertMyProductsCache(items: ProductListItem[]) {
  const cache = readMyProductsCache();
  const map = new Map<number, ProductListItem>();
  cache.forEach((item) => map.set(item.id, item));
  items.forEach((item) => map.set(item.id, item));
  writeMyProductsCache(Array.from(map.values()));
}

function patchMyProductStatus(productId: number, status: ProductListItem['status']) {
  const cache = readMyProductsCache();
  writeMyProductsCache(
    cache.map((item) => (item.id === productId ? { ...item, status } : item)),
  );
}

function toListItemFromDetail(detail: ProductDetail): ProductListItem {
  return {
    id: detail.id,
    title: detail.title,
    price: detail.price,
    original_price: detail.original_price,
    condition: detail.condition,
    campus: detail.campus,
    status: detail.status,
    view_count: detail.view_count,
    like_count: detail.like_count,
    created_at: detail.created_at,
    category: detail.category,
    cover_image: detail.images?.[0]?.image_url || detail.cover_image || null,
    seller: detail.seller,
  };
}

function canFallback(err: unknown) {
  if (!FEATURE_FLAGS.USE_MOCK_FALLBACK) return false;
  const e = err as AxiosError;
  const status = e.response?.status;
  return !e.response || status === 404 || status === 502 || status === 503 || status === 504;
}

export function parseProductApiError(err: unknown, fallback = '请求失败') {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
}

export async function getProductCategories() {
  try {
    const resp = await http.get<ApiResp<PaginatedResp<ProductCategory> | ProductCategory[]> | PaginatedResp<ProductCategory> | ProductCategory[]>(
      '/api/products/categories/',
    );
    return normalizeMaybeWrappedList(resp.data);
  } catch (e) {
    if (!canFallback(e)) throw e;
    return [
      { id: 1, name: '教材/书籍', icon: '', sort_order: 1 },
      { id: 2, name: '数码/电器', icon: '', sort_order: 2 },
      { id: 3, name: '宿舍家具', icon: '', sort_order: 3 },
      { id: 4, name: '运动用品', icon: '', sort_order: 4 },
      { id: 99, name: '其他', icon: '', sort_order: 99 },
    ];
  }
}

export async function getProductFeed(params?: {
  search?: string;
  ordering?: string;
  campus?: 'xihai' | 'laoshan' | 'yushan';
}) {
  try {
    const resp = await http.get<ApiResp<PaginatedResp<ProductListItem> | ProductListItem[]>>('/api/products/feed/', {
      params,
    });
    const list = normalizeList(unwrap(resp.data));
    const uid = getCurrentUserId();
    if (uid) {
      upsertMyProductsCache(list.filter((item) => item.seller.id === uid));
    }
    return list;
  } catch (e) {
    if (!canFallback(e)) throw e;
    return [];
  }
}

export async function getProductDetail(id: number) {
  const resp = await http.get<ApiResp<ProductDetail>>(`/api/products/${id}/`);
  const detail = unwrap(resp.data);
  const uid = getCurrentUserId();
  if (uid && detail.seller.id === uid) {
    upsertMyProductsCache([toListItemFromDetail(detail)]);
  }
  return detail;
}

export async function createProduct(payload: CreateProductPayload) {
  const form = new FormData();
  form.append('category', String(payload.category));
  form.append('campus', payload.campus);
  form.append('title', payload.title);
  form.append('description', payload.description);
  form.append('price', String(payload.price));
  form.append('condition', payload.condition);
  if (payload.original_price !== undefined) {
    form.append('original_price', String(payload.original_price));
  }
  (payload.image_files || []).forEach((file) => {
    form.append('image_files', file);
  });

  try {
    const resp = await http.post<ApiResp<ProductDetail>>('/api/products/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const detail = unwrap(resp.data);
    upsertMyProductsCache([toListItemFromDetail(detail)]);
    return detail;
  } catch (e) {
    if (!canFallback(e)) throw e;
    const uid = getCurrentUserId() || 0;
    const now = new Date().toISOString();
    const localDetail: ProductDetail = {
      id: Date.now(),
      title: payload.title,
      price: String(payload.price),
      original_price: payload.original_price !== undefined ? String(payload.original_price) : null,
      condition: payload.condition,
      campus: payload.campus,
      status: 'on_sale',
      view_count: 0,
      like_count: 0,
      created_at: now,
      updated_at: now,
      description: payload.description,
      category: {
        id: payload.category,
        name: `分类${payload.category}`,
        icon: '',
        sort_order: payload.category,
      },
      cover_image: null,
      seller: {
        id: uid,
        name: '我',
        avatar: null,
        campus: payload.campus,
      },
      images: (payload.image_files || []).map((file, index) => ({
        id: Date.now() + index + 1,
        image: '',
        image_url: URL.createObjectURL(file),
        sort_order: index,
      })),
    };
    upsertMyProductsCache([toListItemFromDetail(localDetail)]);
    return localDetail;
  }
}

export async function offShelfProduct(productId: number) {
  const resp = await http.post<ApiResp<{ id: number; status: string }>>(`/api/products/${productId}/off-shelf/`);
  const data = unwrap(resp.data);
  patchMyProductStatus(productId, 'off_shelf');
  return data;
}

export async function markProductSold(productId: number) {
  const resp = await http.post<ApiResp<{ id: number; status: string }>>(`/api/products/${productId}/mark-sold/`);
  const data = unwrap(resp.data);
  patchMyProductStatus(productId, 'sold');
  return data;
}

export async function getMyProducts() {
  const uid = getCurrentUserId();
  if (!uid) return [];
  let feedMine: ProductListItem[] = [];
  try {
    const list = await getProductFeed();
    feedMine = list.filter((item) => item.seller.id === uid);
  } catch {
    feedMine = [];
  }
  const cacheMine = readMyProductsCache().filter((item) => item.seller.id === uid);
  const map = new Map<number, ProductListItem>();
  feedMine.forEach((item) => map.set(item.id, item));
  cacheMine.forEach((item) => map.set(item.id, item));
  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const ad = new Date(a.created_at).getTime();
    const bd = new Date(b.created_at).getTime();
    return bd - ad;
  });
  return merged;
}

