import { create } from 'zustand';
import {
  ensureConversation,
  getConversationList,
  getConversationMessages,
  getUnreadMessageCount,
  markConversationRead as markConversationReadApi,
  sendConversationImageMessage,
  sendConversationTextMessage,
  type ConversationDTO,
  type MessageDTO,
} from '@/api/messages';

export type ChatConversation = {
  id: number;
  peerId: number;
  name: string;
  avatar?: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  lastSeenText?: string;
};

export type ChatMessage = {
  id: number;
  fromMe: boolean;
  time: string;
  type: 'text' | 'image';
  content: string;
  senderId: number;
  senderName: string;
  imageUrl?: string;
  isRead?: boolean;
};

type MessageState = {
  conversations: ChatConversation[];
  messagesByConversation: Record<number, ChatMessage[]>;
  activeConversationId: number | null;
  unreadTotal: number;

  loadingConversations: boolean;
  loadingMessages: boolean;
  sending: boolean;
  initialized: boolean;

  setActiveConversationId: (id: number | null) => void;
  fetchConversations: (keyword?: string) => Promise<void>;
  fetchMessages: (conversationId: number) => Promise<void>;
  ensureAndOpenConversation: (userId: number, productId?: number) => Promise<number>;
  sendTextMessage: (conversationId: number, text: string) => Promise<void>;
  sendImageMessage: (conversationId: number, file: File) => Promise<void>;
  markConversationRead: (conversationId: number) => Promise<void>;
  fetchUnreadTotal: () => Promise<void>;
  clearMessageState: () => void;
};

function formatTime(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function mapConversation(item: ConversationDTO): ChatConversation {
  return {
    id: item.id,
    peerId: item.other_user_id,
    name: item.other_user_name || `用户${item.other_user_id}`,
    avatar: item.other_user_avatar || undefined,
    preview: item.last_message || '',
    time: formatTime(item.last_message_at),
    unread: item.unread_count || 0,
    online: false,
    lastSeenText: '离线',
  };
}

function mapMessage(item: MessageDTO): ChatMessage {
  const isImage = Boolean(item.image_url);

  return {
    id: item.id,
    fromMe: item.is_mine,
    time: formatTime(item.created_at),
    type: isImage ? 'image' : 'text',
    content: isImage ? item.image_url || '' : item.content || '',
    senderId: item.sender_id,
    senderName: item.sender_name,
    imageUrl: item.image_url || undefined,
    isRead: item.is_read,
  };
}

function upsertConversation(
  conversations: ChatConversation[],
  incoming: ChatConversation,
) {
  const exists = conversations.some((c) => c.id === incoming.id);
  const next = exists
    ? conversations.map((c) => (c.id === incoming.id ? incoming : c))
    : [incoming, ...conversations];

  return next;
}

function moveConversationToTop(
  conversations: ChatConversation[],
  conversationId: number,
  patch: Partial<ChatConversation>,
) {
  const target = conversations.find((c) => c.id === conversationId);
  if (!target) return conversations;

  const updated = { ...target, ...patch };
  const rest = conversations.filter((c) => c.id !== conversationId);
  return [updated, ...rest];
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  unreadTotal: 0,

  loadingConversations: false,
  loadingMessages: false,
  sending: false,
  initialized: false,

  setActiveConversationId: (id) => {
    set({ activeConversationId: id });
  },

  fetchConversations: async (keyword) => {
    set({ loadingConversations: true });
    try {
      const list = await getConversationList(keyword);
      const mapped = list.map(mapConversation);

      set((state) => {
        const activeExists =
          state.activeConversationId !== null &&
          mapped.some((c) => c.id === state.activeConversationId);

        return {
          conversations: mapped,
          initialized: true,
          activeConversationId: activeExists
            ? state.activeConversationId
            : mapped[0]?.id ?? null,
        };
      });
    } finally {
      set({ loadingConversations: false });
    }
  },

  fetchMessages: async (conversationId) => {
    set({ loadingMessages: true });
    try {
      const list = await getConversationMessages(conversationId);
      const mapped = list.map(mapMessage);

      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: mapped,
        },
      }));
    } finally {
      set({ loadingMessages: false });
    }
  },

  ensureAndOpenConversation: async (userId, productId) => {
    const data = await ensureConversation({
      user_id: userId,
      ...(productId ? { product_id: productId } : {}),
    });

    const mapped = mapConversation(data);

    set((state) => ({
      conversations: upsertConversation(state.conversations, mapped),
      activeConversationId: mapped.id,
    }));

    return mapped.id;
  },

  sendTextMessage: async (conversationId, text) => {
    const content = text.trim();
    if (!content) return;

    set({ sending: true });
    try {
      const data = await sendConversationTextMessage(conversationId, content);
      const mapped = mapMessage(data);

      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [
            ...(state.messagesByConversation[conversationId] || []),
            mapped,
          ],
        },
        conversations: moveConversationToTop(state.conversations, conversationId, {
          preview: content,
          time: mapped.time,
        }),
      }));

      await get().fetchUnreadTotal();
    } finally {
      set({ sending: false });
    }
  },

  sendImageMessage: async (conversationId, file) => {
    set({ sending: true });
    try {
      const data = await sendConversationImageMessage(conversationId, file);
      const mapped = mapMessage(data);

      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [
            ...(state.messagesByConversation[conversationId] || []),
            mapped,
          ],
        },
        conversations: moveConversationToTop(state.conversations, conversationId, {
          preview: '[图片]',
          time: mapped.time,
        }),
      }));

      await get().fetchUnreadTotal();
    } finally {
      set({ sending: false });
    }
  },

  markConversationRead: async (conversationId) => {
    await markConversationReadApi(conversationId);

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread: 0 } : c,
      ),
    }));

    await get().fetchUnreadTotal();
  },

  fetchUnreadTotal: async () => {
    const data = await getUnreadMessageCount();
    set({ unreadTotal: data.unread_count || 0 });
  },

  clearMessageState: () => {
    set({
      conversations: [],
      messagesByConversation: {},
      activeConversationId: null,
      unreadTotal: 0,
      loadingConversations: false,
      loadingMessages: false,
      sending: false,
      initialized: false,
    });
  },
}));

export function useTotalUnreadCount() {
  return useMessageStore((s) => s.unreadTotal);
}