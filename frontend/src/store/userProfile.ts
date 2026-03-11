import { create } from 'zustand';

export type UserProfileState = {
  nickname: string;
  bio: string;
  avatarUrl: string | null;
  setProfile: (payload: { nickname: string; bio: string; avatarUrl: string | null }) => void;
};

export const useUserProfileStore = create<UserProfileState>((set) => ({
  nickname: 'A',
  bio: '个人签名',
  avatarUrl: null,
  setProfile: (payload) =>
    set({
      nickname: payload.nickname,
      bio: payload.bio,
      avatarUrl: payload.avatarUrl,
    }),
}));

