import { AxiosError } from 'axios';
import { http } from '@/api/http';

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

export type ConversationDTO = {
  id: number;
  product: number | null;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
};

export type MessageDTO = {
  id: number;
  conversation: number;
  sender_id: number;
  sender_name: string;
  content: string;
  image: string | null;
  image_url: string | null;
  is_mine: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type EnsureConversationPayload = {
  user_id: number;
  product_id?: number;
};

export type UnreadCountDTO = {
  unread_count: number;
};

export type MarkReadDTO = {
  updated: number;
};

function unwrap<T>(payload: ApiResp<T>) {
  return payload.data;
}

function normalizeList<T>(data: PaginatedResp<T> | T[]) {
  if (Array.isArray(data)) return data;
  if ('results' in data) return data.results;
  return [];
}

export function parseMessageApiError(err: unknown, fallback = '消息请求失败') {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || fallback;
}

/**
 * 创建或获取会话
 * POST /api/interactions/conversations/ensure/
 */
export async function ensureConversation(payload: EnsureConversationPayload) {
  const resp = await http.post<ApiResp<ConversationDTO>>(
    '/api/interactions/conversations/ensure/',
    payload,
  );
  return unwrap(resp.data);
}

/**
 * 获取会话列表
 * GET /api/interactions/conversations/
 * 可选 keyword 搜索
 */
export async function getConversationList(keyword?: string) {
  const resp = await http.get<ApiResp<PaginatedResp<ConversationDTO> | ConversationDTO[]>>(
    '/api/interactions/conversations/',
    {
      params: keyword ? { keyword } : undefined,
    },
  );
  return normalizeList(unwrap(resp.data));
}

/**
 * 获取单个会话详情
 * GET /api/interactions/conversations/{conversationId}/
 */
export async function getConversationDetail(conversationId: number) {
  const resp = await http.get<ApiResp<ConversationDTO>>(
    `/api/interactions/conversations/${conversationId}/`,
  );
  return unwrap(resp.data);
}

/**
 * 获取某个会话的消息列表
 * GET /api/interactions/conversations/{conversationId}/messages/
 */
export async function getConversationMessages(conversationId: number) {
  const resp = await http.get<ApiResp<PaginatedResp<MessageDTO> | MessageDTO[]>>(
    `/api/interactions/conversations/${conversationId}/messages/`,
  );
  return normalizeList(unwrap(resp.data));
}

/**
 * 发送文字消息
 * POST /api/interactions/conversations/{conversationId}/messages/
 */
export async function sendConversationTextMessage(
  conversationId: number,
  content: string,
) {
  const resp = await http.post<ApiResp<MessageDTO>>(
    `/api/interactions/conversations/${conversationId}/messages/`,
    { content },
  );
  return unwrap(resp.data);
}

/**
 * 发送图片消息
 * POST /api/interactions/conversations/{conversationId}/messages/
 * multipart/form-data
 */
export async function sendConversationImageMessage(
  conversationId: number,
  file: File,
  content = '',
) {
  const formData = new FormData();
  formData.append('image', file);

  // 如果后端允许 content，可一起传；不需要也不影响
  if (content.trim()) {
    formData.append('content', content.trim());
  }

  const resp = await http.post<ApiResp<MessageDTO>>(
    `/api/interactions/conversations/${conversationId}/messages/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return unwrap(resp.data);
}

/**
 * 标记会话已读
 * POST /api/interactions/conversations/{conversationId}/read/
 */
export async function markConversationRead(conversationId: number) {
  const resp = await http.post<ApiResp<MarkReadDTO>>(
    `/api/interactions/conversations/${conversationId}/read/`,
  );
  return unwrap(resp.data);
}

/**
 * 获取未读消息总数
 * GET /api/interactions/messages/unread_count/
 */
export async function getUnreadMessageCount() {
  const resp = await http.get<ApiResp<UnreadCountDTO>>(
    '/api/interactions/messages/unread_count/',
  );
  return unwrap(resp.data);
}