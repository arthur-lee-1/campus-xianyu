import { FEATURE_FLAGS } from '@/config/featureFlags';

export type SellerReviewDTO = {
  id: string;
  sellerId: number;
  reviewerName: string;
  reviewerAvatar?: string;
  score: number;
  content: string;
  createdAt: string;
};

const LS_KEY = 'campus_trade_seller_reviews_v1';

type ReviewCache = Record<number, SellerReviewDTO[]>;

const defaultReviews: ReviewCache = {
  1: [
    {
      id: 'r_1',
      sellerId: 1,
      reviewerName: '经管小李',
      score: 5,
      content: '交易很顺利，描述真实。',
      createdAt: '2026-02-10',
    },
  ],
};

export async function getSellerReviews(sellerId: number) {
  if (!FEATURE_FLAGS.USE_MOCK_FALLBACK) return [];
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return defaultReviews[sellerId] || [];
  try {
    const parsed = JSON.parse(raw) as ReviewCache;
    return parsed[sellerId] || [];
  } catch {
    return defaultReviews[sellerId] || [];
  }
}

export async function createSellerReview(input: Omit<SellerReviewDTO, 'id' | 'createdAt'>) {
  if (!FEATURE_FLAGS.USE_MOCK_FALLBACK) {
    throw new Error('后端商家评价接口暂未联通');
  }
  const raw = localStorage.getItem(LS_KEY);
  const cache: ReviewCache = raw ? (JSON.parse(raw) as ReviewCache) : defaultReviews;
  const created: SellerReviewDTO = {
    ...input,
    id: `r_${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const list = cache[input.sellerId] || [];
  const next = { ...cache, [input.sellerId]: [created, ...list] };
  localStorage.setItem(LS_KEY, JSON.stringify(next));
  return created;
}

