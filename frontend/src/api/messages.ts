import { FEATURE_FLAGS } from '@/config/featureFlags';

export type ConversationDTO = {
  id: string;
  sellerId: number;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  lastSeenText?: string;
};

export type MessageDTO = {
  id: string;
  fromMe: boolean;
  time: string;
  type: 'text' | 'image';
  content: string;
};

const LS_KEY = 'campus_trade_messages_cache_v1';

type MessageCache = {
  conversations: ConversationDTO[];
  messagesByConversation: Record<string, MessageDTO[]>;
};

const defaultCache: MessageCache = {
  conversations: [
    { id: 'u_1', name: '海大数院同学', preview: '教材还在，今晚可以面交', time: '20:14', unread: 2, online: true, sellerId: 1 },
    { id: 'u_2', name: '鱼山校区卖家', preview: '可以刀一点点', time: '19:32', unread: 0, online: true, sellerId: 2 },
  ],
  messagesByConversation: {
    u_1: [
      { id: 'm1', fromMe: false, content: '你好，线代教材还在吗？', time: '18:54', type: 'text' },
      { id: 'm2', fromMe: true, content: '在的，9成新。', time: '18:55', type: 'text' },
    ],
    u_2: [{ id: 'm1', fromMe: false, content: '台灯还在售吗？', time: '16:10', type: 'text' }],
  },
};

export async function loadMessageCache(): Promise<MessageCache> {
  if (!FEATURE_FLAGS.USE_MOCK_FALLBACK) {
    return { conversations: [], messagesByConversation: {} };
  }
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return defaultCache;
  try {
    return JSON.parse(raw) as MessageCache;
  } catch {
    return defaultCache;
  }
}

export async function saveMessageCache(cache: MessageCache) {
  if (!FEATURE_FLAGS.USE_MOCK_FALLBACK) return;
  localStorage.setItem(LS_KEY, JSON.stringify(cache));
}

