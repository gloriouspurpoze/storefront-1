import type { ApiClient } from '../types'

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export enum ConversationType {
  DIRECT = 'direct',
  BOOKING = 'booking',
  SUPPORT = 'support',
  GROUP = 'group',
}

export interface ChatMessage {
  _id: string
  conversationId: string
  senderId: { _id: string; firstName: string; lastName: string; avatar?: string; role: string }
  content: string
  type: MessageType | string
  createdAt: string
  updatedAt: string
}

export interface ChatConversation {
  _id: string
  type: ConversationType | string
  title?: string
  participants: Array<{
    userId: { _id: string; firstName: string; lastName: string; email?: string; avatar?: string }
    unreadCount: number
  }>
  lastMessage?: { text: string; sentAt: string }
  updatedAt: string
}

export function normalizeConversationList(data: unknown): ChatConversation[] {
  if (Array.isArray(data)) return data as ChatConversation[]
  if (data && typeof data === 'object' && Array.isArray((data as { conversations?: unknown }).conversations)) {
    return (data as { conversations: ChatConversation[] }).conversations
  }
  return []
}

export function normalizeMessageList(data: unknown): ChatMessage[] {
  if (Array.isArray(data)) return data as ChatMessage[]
  if (data && typeof data === 'object' && Array.isArray((data as { messages?: unknown }).messages)) {
    return (data as { messages: ChatMessage[] }).messages
  }
  return []
}

export function createChatService(api: ApiClient) {
  return {
    getConversations: async (params?: {
      type?: ConversationType
      page?: number
      limit?: number
      search?: string
    }) => {
      const res = await api.get<unknown>('/chat/conversations', { params: params as Record<string, unknown> })
      return normalizeConversationList(res.data)
    },
    getSupportConversations: async (params?: { page?: number; limit?: number }) => {
      const res = await api.get<unknown>('/chat/conversations/support', {
        params: params as Record<string, unknown>,
      })
      return normalizeConversationList(res.data)
    },
    getMessages: async (conversationId: string, params?: { page?: number; limit?: number }) => {
      const res = await api.get<unknown>(`/chat/conversations/${conversationId}/messages`, {
        params: params as Record<string, unknown>,
      })
      return normalizeMessageList(res.data)
    },
    sendMessage: (data: { conversationId: string; content: string; type?: MessageType }) =>
      api.post<ChatMessage>('/chat/messages', data),
    markAsRead: (conversationId: string, messageId?: string) =>
      api.post(`/chat/conversations/${conversationId}/read`, messageId ? { messageId } : {}),
    getUnreadCount: async () => {
      const res = await api.get<{ count?: number; unreadCount?: number }>('/chat/unread-count')
      const d = res.data as { count?: number; unreadCount?: number }
      return d?.count ?? d?.unreadCount ?? 0
    },
  }
}

export type ChatService = ReturnType<typeof createChatService>
