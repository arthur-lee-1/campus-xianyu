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

function buildDemoMyProducts(uid: number): ProductListItem[] {
  const now = Date.now();
  const baseId = 900000 + uid * 1000;
  return [
    {
      id: baseId + 1,
      title: '九成新机械键盘（红轴）',
      price: '129',
      original_price: '199',
      condition: 'good',
      campus: 'laoshan',
      status: 'on_sale',
      view_count: 24,
      like_count: 5,
      created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      category: { id: 2, name: '数码/电器', icon: '', sort_order: 2 },
      cover_image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=900&q=80',
      seller: { id: uid, name: '我', avatar: null, campus: 'laoshan' },
    },
    {
      id: baseId + 2,
      title: '线代教材（含笔记）',
      price: '18',
      original_price: '45',
      condition: 'fair',
      campus: 'xihai',
      status: 'sold',
      view_count: 38,
      like_count: 9,
      created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      category: { id: 1, name: '教材/书籍', icon: '', sort_order: 1 },
      cover_image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80',
      seller: { id: uid, name: '我', avatar: null, campus: 'xihai' },
    },
    {
      id: baseId + 3,
      title: '宿舍收纳推车（三层）',
      price: '35',
      original_price: '69',
      condition: 'good',
      campus: 'yushan',
      status: 'off_shelf',
      view_count: 12,
      like_count: 2,
      created_at: new Date(now - 1000 * 60 * 60 * 52).toISOString(),
      category: { id: 3, name: '宿舍家具', icon: '', sort_order: 3 },
      cover_image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      seller: { id: uid, name: '我', avatar: null, campus: 'yushan' },
    },
  ];
}

function buildDemoCampusFeedProducts(): ProductListItem[] {
  const now = Date.now();
  return [
    {
      id: 700001,
      title: '西海岸｜概率论教材（笔记版）',
      price: '22',
      original_price: '46',
      condition: 'good',
      campus: 'xihai',
      status: 'on_sale',
      view_count: 31,
      like_count: 7,
      created_at: new Date(now - 1000 * 60 * 40).toISOString(),
      category: { id: 1, name: '教材/书籍', icon: '', sort_order: 1 },
      cover_image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
      seller: { id: 101, name: '西海岸学长', avatar: null, campus: 'xihai' },
    },
    {
      id: 700002,
      title: '西海岸｜小米显示器 24 英寸',
      price: '320',
      original_price: '549',
      condition: 'fair',
      campus: 'xihai',
      status: 'on_sale',
      view_count: 19,
      like_count: 4,
      created_at: new Date(now - 1000 * 60 * 130).toISOString(),
      category: { id: 2, name: '数码/电器', icon: '', sort_order: 2 },
      cover_image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
      seller: { id: 102, name: '西海岸同学', avatar: null, campus: 'xihai' },
    },
    {
      id: 700003,
      title: '崂山｜人体工学椅（可升降）',
      price: '118',
      original_price: '259',
      condition: 'good',
      campus: 'laoshan',
      status: 'on_sale',
      view_count: 26,
      like_count: 6,
      created_at: new Date(now - 1000 * 60 * 95).toISOString(),
      category: { id: 3, name: '宿舍家具', icon: '', sort_order: 3 },
      cover_image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      seller: { id: 201, name: '崂山卖家A', avatar: null, campus: 'laoshan' },
    },
    {
      id: 700004,
      title: '崂山｜羽毛球拍套装',
      price: '89',
      original_price: '159',
      condition: 'like_new',
      campus: 'laoshan',
      status: 'on_sale',
      view_count: 14,
      like_count: 3,
      created_at: new Date(now - 1000 * 60 * 210).toISOString(),
      category: { id: 4, name: '运动用品', icon: '', sort_order: 4 },
      cover_image: 'https://images.unsplash.com/photo-1617083934555-7f2a3d47631d?auto=format&fit=crop&w=900&q=80',
      seller: { id: 202, name: '崂山运动达人', avatar: null, campus: 'laoshan' },
    },
    {
      id: 700005,
      title: '鱼山｜二手台灯（护眼）',
      price: '28',
      original_price: '69',
      condition: 'good',
      campus: 'yushan',
      status: 'on_sale',
      view_count: 17,
      like_count: 5,
      created_at: new Date(now - 1000 * 60 * 170).toISOString(),
      category: { id: 3, name: '宿舍家具', icon: '', sort_order: 3 },
      cover_image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
      seller: { id: 301, name: '鱼山同学', avatar: null, campus: 'yushan' },
    },
    {
      id: 700006,
      title: '鱼山｜iPad 保护壳 + 触控笔',
      price: '45',
      original_price: '109',
      condition: 'like_new',
      campus: 'yushan',
      status: 'on_sale',
      view_count: 11,
      like_count: 2,
      created_at: new Date(now - 1000 * 60 * 280).toISOString(),
      category: { id: 2, name: '数码/电器', icon: '', sort_order: 2 },
      cover_image: 'https://images.unsplash.com/photo-1589739900243-4b52cd9de9c5?auto=format&fit=crop&w=900&q=80',
      seller: { id: 302, name: '鱼山数码铺', avatar: null, campus: 'yushan' },
    },
  ];
}

function applyFeedFilters(
  list: ProductListItem[],
  params?: {
    search?: string;
    ordering?: string;
    campus?: 'xihai' | 'laoshan' | 'yushan';
  },
) {
  let next = [...list];
  if (params?.campus) {
    next = next.filter((item) => item.campus === params.campus);
  }
  const kw = params?.search?.trim().toLowerCase();
  if (kw) {
    next = next.filter(
      (item) =>
        item.title.toLowerCase().includes(kw) ||
        (item.category?.name || '').toLowerCase().includes(kw) ||
        item.seller.name.toLowerCase().includes(kw),
    );
  }
  return next;
}

function toDetailFromListItem(item: ProductListItem): ProductDetail {
  return {
    ...item,
    description: `${item.title}，支持${item.seller.campus || '校内'}面交，细节可私信沟通。`,
    updated_at: item.created_at,
    images: item.cover_image
      ? [
          {
            id: item.id * 10 + 1,
            image: item.cover_image,
            image_url: item.cover_image,
            sort_order: 0,
          },
        ]
      : [],
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
    if (FEATURE_FLAGS.USE_MOCK_FALLBACK && list.length === 0) {
      return applyFeedFilters(buildDemoCampusFeedProducts(), params);
    }
    const uid = getCurrentUserId();
    if (uid) {
      upsertMyProductsCache(list.filter((item) => item.seller.id === uid));
    }
    return list;
  } catch (e) {
    if (!canFallback(e)) throw e;
    return applyFeedFilters(buildDemoCampusFeedProducts(), params);
  }
}

export async function getProductDetail(id: number) {
  try {
    const resp = await http.get<ApiResp<ProductDetail>>(`/api/products/${id}/`);
    const detail = unwrap(resp.data);
    const uid = getCurrentUserId();
    if (uid && detail.seller.id === uid) {
      upsertMyProductsCache([toListItemFromDetail(detail)]);
    }
    return detail;
  } catch (e) {
    if (!canFallback(e)) throw e;
    const localMine = readMyProductsCache();
    const demoFeed = buildDemoCampusFeedProducts();
    const hit = [...localMine, ...demoFeed].find((item) => item.id === id);
    if (hit) return toDetailFromListItem(hit);
    throw e;
  }
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

export async function ensureDemoMyProducts() {
  const uid = getCurrentUserId();
  if (!uid) return;
  const cache = readMyProductsCache();
  const hasMine = cache.some((item) => item.seller.id === uid);
  if (hasMine) return;
  upsertMyProductsCache(buildDemoMyProducts(uid));
}

