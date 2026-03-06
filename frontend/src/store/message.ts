import { create } from 'zustand';

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

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'u_1',
    name: '海大数院同学',
    preview: '教材还在，今晚可以面交',
    time: '20:14',
    unread: 2,
    online: true,
    sellerId: 1,
  },
  {
    id: 'u_2',
    name: '鱼山校区卖家',
    preview: '可以刀一点点',
    time: '19:32',
    unread: 0,
    online: true,
    sellerId: 2,
  },
  {
    id: 'u_3',
    name: '崂山小王',
    preview: '谢谢，已确认收货',
    time: '昨天',
    unread: 0,
    online: false,
    sellerId: 3,
    lastSeenText: '5分钟前在线',
  },
  {
    id: 'u_4',
    name: '系统通知',
    preview: '你的商品有新的收藏',
    time: '周一',
    unread: 1,
    online: false,
    sellerId: 10001,
    lastSeenText: '2小时前在线',
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  u_1: [
    { id: 'm1', fromMe: false, content: '你好，线代教材还在吗？', time: '18:54', type: 'text' },
    { id: 'm2', fromMe: true, content: '在的，9成新，支持西海岸校区面交。', time: '18:55', type: 'text' },
    { id: 'm3', fromMe: false, content: '可以，今晚图书馆门口见？', time: '18:57', type: 'text' },
  ],
  u_2: [
    { id: 'm1', fromMe: false, content: '台灯还在售吗？', time: '16:10', type: 'text' },
    { id: 'm2', fromMe: true, content: '在售的，35 可以小刀。', time: '16:13', type: 'text' },
  ],
  u_3: [
    { id: 'm1', fromMe: true, content: '收到没问题的话帮忙给个评价哈～', time: '昨天 20:13', type: 'text' },
    { id: 'm2', fromMe: false, content: '收到啦，感谢！', time: '昨天 20:15', type: 'text' },
  ],
  u_4: [{ id: 'm1', fromMe: false, content: '你的商品《线代教材》新增 1 次收藏。', time: '周一 09:20', type: 'text' }],
};

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: INITIAL_CONVERSATIONS,
  messagesByConversation: INITIAL_MESSAGES,
  getOrCreateConversation: (sellerId, name) => {
    const exists = get().conversations.find((c) => c.sellerId === sellerId);
    if (exists) return exists.id;
    const id = `temp_${sellerId}_${Date.now()}`;
    set((state) => ({
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
    }));
    return id;
  },
  setActiveConversationRead: (conversationId) =>
    set((state) => {
      const target = state.conversations.find((item) => item.id === conversationId);
      if (!target || target.unread <= 0) return state;
      return {
        conversations: state.conversations.map((item) =>
          item.id === conversationId ? { ...item, unread: 0 } : item,
        ),
      };
    }),
  sendTextMessage: (conversationId, text, fromMe = true) => {
    const content = text.trim();
    if (!content) return;
    const time = nowTime();
    set((state) => ({
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
    }));
  },
  sendImageMessage: (conversationId, imageUrl, fromMe = true) => {
    const time = nowTime();
    set((state) => ({
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
    }));
  },
}));

export function useTotalUnreadCount() {
  return useMessageStore((s) => s.conversations.reduce((sum, c) => sum + c.unread, 0));
}

