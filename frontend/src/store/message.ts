import { create } from 'zustand';
import { loadMessageCache, saveMessageCache } from '@/api/messages';

export type ChatMessage = {
  id: string;
  fromMe: boolean;
  time: string;
  type: 'text' | 'image';
  content: string;
};

export type ChatConversation = {
  id: string;
  sellerId: number;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  lastSeenText?: string;
};

type MessageState = {
  conversations: ChatConversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  initialized: boolean;
  initFromCache: () => Promise<void>;
  getOrCreateConversation: (sellerId: number, name: string) => string;
  setActiveConversationRead: (conversationId: string) => void;
  sendTextMessage: (conversationId: string, text: string, fromMe?: boolean) => void;
  sendImageMessage: (conversationId: string, imageUrl: string, fromMe?: boolean) => void;
};

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function updateConversationMeta(
  list: ChatConversation[],
  conversationId: string,
  patch: Partial<ChatConversation>,
) {
  const next = list.map((item) => (item.id === conversationId ? { ...item, ...patch } : item));
  next.sort((a, b) => {
    if (a.id === conversationId) return -1;
    if (b.id === conversationId) return 1;
    return 0;
  });
  return next;
}

const INITIAL_CONVERSATIONS: ChatConversation[] = [];
const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: INITIAL_CONVERSATIONS,
  messagesByConversation: INITIAL_MESSAGES,
  initialized: false,
  initFromCache: async () => {
    if (get().initialized) return;
    const cache = await loadMessageCache();
    set({
      conversations: cache.conversations,
      messagesByConversation: cache.messagesByConversation,
      initialized: true,
    });
  },
  getOrCreateConversation: (sellerId, name) => {
    const exists = get().conversations.find((c) => c.sellerId === sellerId);
    if (exists) return exists.id;
    const id = `temp_${sellerId}_${Date.now()}`;
    set((state) => {
      const next = {
        conversations: [
          {
            id,
            sellerId,
            name,
            preview: '开始新的会话',
            time: '刚刚',
            unread: 0,
            online: true,
          },
          ...state.conversations,
        ],
        messagesByConversation: {
          ...state.messagesByConversation,
          [id]: [],
        },
      };
      void saveMessageCache(next);
      return next;
    });
    return id;
  },
  setActiveConversationRead: (conversationId) =>
    set((state) => {
      const target = state.conversations.find((item) => item.id === conversationId);
      if (!target || target.unread <= 0) return state;
      const next = {
        conversations: state.conversations.map((item) =>
          item.id === conversationId ? { ...item, unread: 0 } : item,
        ),
      };
      void saveMessageCache({
        conversations: next.conversations,
        messagesByConversation: state.messagesByConversation,
      });
      return next;
    }),
  sendTextMessage: (conversationId, text, fromMe = true) => {
    const content = text.trim();
    if (!content) return;
    const time = nowTime();
    set((state) => {
      const next = {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [
            ...(state.messagesByConversation[conversationId] || []),
            {
              id: `m_${Date.now()}`,
              fromMe,
              content,
              time,
              type: 'text',
            },
          ],
        },
        conversations: updateConversationMeta(state.conversations, conversationId, {
          preview: fromMe ? content : `对方：${content}`,
          time,
          unread:
            fromMe
              ? state.conversations.find((c) => c.id === conversationId)?.unread || 0
              : (state.conversations.find((c) => c.id === conversationId)?.unread || 0) + 1,
        }),
      };
      void saveMessageCache(next);
      return next;
    });
  },
  sendImageMessage: (conversationId, imageUrl, fromMe = true) => {
    const time = nowTime();
    set((state) => {
      const next = {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [
            ...(state.messagesByConversation[conversationId] || []),
            {
              id: `img_${Date.now()}`,
              fromMe,
              content: imageUrl,
              time,
              type: 'image',
            },
          ],
        },
        conversations: updateConversationMeta(state.conversations, conversationId, {
          preview: fromMe ? '[图片]' : '对方发来一张图片',
          time,
          unread:
            fromMe
              ? state.conversations.find((c) => c.id === conversationId)?.unread || 0
              : (state.conversations.find((c) => c.id === conversationId)?.unread || 0) + 1,
        }),
      };
      void saveMessageCache(next);
      return next;
    });
  },
}));

export function useTotalUnreadCount() {
  return useMessageStore((s) => s.conversations.reduce((sum, c) => sum + c.unread, 0));
}

