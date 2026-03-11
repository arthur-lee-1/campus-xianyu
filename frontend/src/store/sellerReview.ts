import { create } from 'zustand';

export type SellerReview = {
  id: string;
  sellerId: number;
  score: number;
  content: string;
  reviewerName: string;
  reviewerAvatar?: string | null;
  createdAt: string;
};

type SellerReviewState = {
  reviewsBySeller: Record<number, SellerReview[]>;
  addReview: (payload: Omit<SellerReview, 'id' | 'createdAt'>) => void;
};

function nowText() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useSellerReviewStore = create<SellerReviewState>((set) => ({
  reviewsBySeller: {
    1: [
      {
        id: 'seed_1',
        sellerId: 1,
        score: 5,
        content: '回复很快，交易很顺利，教材也很干净。',
        reviewerName: '鱼山同学',
        reviewerAvatar: null,
        createdAt: '2026-03-02',
      },
      {
        id: 'seed_2',
        sellerId: 1,
        score: 4.5,
        content: '约在图书馆门口面交，准时且态度很好。',
        reviewerName: '崂山小李',
        reviewerAvatar: null,
        createdAt: '2026-03-01',
      },
    ],
    2: [
      {
        id: 'seed_3',
        sellerId: 2,
        score: 4.5,
        content: '商品描述基本一致，沟通顺畅。',
        reviewerName: '西海岸小张',
        reviewerAvatar: null,
        createdAt: '2026-02-28',
      },
    ],
  },
  addReview: (payload) =>
    set((state) => {
      const next: SellerReview = {
        ...payload,
        id: `review_${Date.now()}`,
        createdAt: nowText(),
      };
      const prev = state.reviewsBySeller[payload.sellerId] || [];
      return {
        reviewsBySeller: {
          ...state.reviewsBySeller,
          [payload.sellerId]: [next, ...prev],
        },
      };
    }),
}));

