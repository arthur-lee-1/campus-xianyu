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

export function parseProductApiError(err: unknown, fallback = '请求失败') {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
}

export async function getProductCategories() {
  try {
    const resp = await http.get<ApiResp<ProductCategory[]>>('/api/products/categories/');
    return unwrap(resp.data);
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
    return normalizeList(unwrap(resp.data));
  } catch (e) {
    if (!canFallback(e)) throw e;
    return [];
  }
}

export async function getProductDetail(id: number) {
  const resp = await http.get<ApiResp<ProductDetail>>(`/api/products/${id}/`);
  return unwrap(resp.data);
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

  const resp = await http.post<ApiResp<ProductDetail>>('/api/products/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(resp.data);
}

export async function offShelfProduct(productId: number) {
  const resp = await http.post<ApiResp<{ id: number; status: string }>>(`/api/products/${productId}/off-shelf/`);
  return unwrap(resp.data);
}

export async function markProductSold(productId: number) {
  const resp = await http.post<ApiResp<{ id: number; status: string }>>(`/api/products/${productId}/mark-sold/`);
  return unwrap(resp.data);
}

