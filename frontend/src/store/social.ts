import { create } from 'zustand';

/**
 * 社交相关状态：关注 / 粉丝（前端模拟）
 *
 * 说明：
 * - 现在还没有真正接入后端，只在前端做一个简单的“关注卖家”效果。
 * - 后续对接接口时，可以把这里的逻辑替换为请求后端并根据返回值更新。
 */

type SocialState = {
  /** 当前登录用户的关注数量（展示在个人页“关注”） */
  following: number;
  /** 当前详情页里卖家的粉丝数量（展示在卖家信息里） */
  sellerFollowers: number;
  /** 当前登录用户是否已关注该卖家 */
  isFollowingSeller: boolean;
  toggleFollowSeller: () => void;
};

export const useSocialStore = create<SocialState>((set) => ({
  // 初始值先和 Profile 页里 MOCK_USER 对齐，后续可从后端接口中 hydrate
  following: 18,
  sellerFollowers: 56,
  isFollowingSeller: false,
  toggleFollowSeller: () =>
    set((state) => {
      if (state.isFollowingSeller) {
        return {
          isFollowingSeller: false,
          following: Math.max(0, state.following - 1),
          sellerFollowers: Math.max(0, state.sellerFollowers - 1),
        };
      }
      return {
        isFollowingSeller: true,
        following: state.following + 1,
        sellerFollowers: state.sellerFollowers + 1,
      };
    }),
}));

