import { api } from './base';

/**
 * Message Types
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  VIDEO = 'video',
  LOCATION = 'location',
  SYSTEM = 'system',
  BOOKING_INFO = 'booking_info',
  ORDER_INFO = 'order_info',
}

/**
 * Conversation Types
 */
export enum ConversationType {
  DIRECT = 'direct',
  BOOKING = 'booking',
  SUPPORT = 'support',
  GROUP = 'group',
}

/**
 * Interfaces
 */
export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
  senderRole: 'admin' | 'customer' | 'provider';
  type: MessageType;
  content: string;
  attachments?: Array<{
    type: string;
    url: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
  replyTo?: any;
  reactions?: Array<{
    userId: string;
    emoji: string;
  }>;
  readReceipts?: Array<{
    userId: string;
    readAt: Date;
  }>;
  status: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatConversation {
  _id: string;
  type: ConversationType;
  title?: string;
  participants: Array<{
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
      role: string;
    };
    role: string;
    isActive: boolean;
    unreadCount: number;
    isMuted: boolean;
    isArchived: boolean;
  }>;
  lastMessage?: {
    text: string;
    senderId: any;
    sentAt: Date;
    messageType: string;
  };
  metadata?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Backend GET /chat/conversations returns `{ success, data: Conversation[] }` (array in `data`).
 * Some clients use `{ data: { conversations: [] } }` — accept both.
 */
export function normalizeConversationList(data: unknown): ChatConversation[] {
  if (Array.isArray(data)) return data as ChatConversation[]
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { conversations?: ChatConversation[] }).conversations)
  ) {
    return (data as { conversations: ChatConversation[] }).conversations
  }
  return []
}

/** Same pattern for GET .../messages — `data` is often `Message[]` directly. */
export function normalizeMessageList(data: unknown): ChatMessage[] {
  if (Array.isArray(data)) return data as ChatMessage[]
  if (data && typeof data === 'object' && Array.isArray((data as { messages?: ChatMessage[] }).messages)) {
    return (data as { messages: ChatMessage[] }).messages
  }
  return []
}

/** Most recent activity first (WhatsApp-style inbox). */
function conversationRecencyMs(c: ChatConversation): number {
  const sent = c.lastMessage?.sentAt
  if (sent) {
    const t = new Date(sent as unknown as string).getTime()
    if (!Number.isNaN(t)) return t
  }
  const u = c.updatedAt ? new Date(c.updatedAt as unknown as string).getTime() : 0
  return Number.isNaN(u) ? 0 : u
}

export function sortConversationsForInbox(list: ChatConversation[]): ChatConversation[] {
  return [...list].sort((a, b) => conversationRecencyMs(b) - conversationRecencyMs(a))
}

/**
 * Chat Service
 */
export class ChatService {
  /**
   * Get user conversations
   */
  static async getConversations(params?: {
    type?: ConversationType;
    isArchived?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params?.type) queryParams.append('type', params.type);
    if (params?.isArchived !== undefined) queryParams.append('isArchived', params.isArchived.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return api.get<{
      conversations: ChatConversation[];
      pagination: any;
    }>(`/chat/conversations?${queryParams.toString()}`, {
      showSuccessToast: false,
    });
  }

  /**
   * List support conversations for admins (queue).
   * Backend: GET /api/chat/conversations/support (requires admin + view_messages)
   */
  static async getSupportConversations(params?: {
    assignedToAdminId?: string;
    unassignedOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.assignedToAdminId) queryParams.append('assignedToAdminId', params.assignedToAdminId);
    if (params?.unassignedOnly !== undefined) queryParams.append('unassignedOnly', String(params.unassignedOnly));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    return api.get<{
      conversations: ChatConversation[];
      pagination: any;
    }>(`/chat/conversations/support?${queryParams.toString()}`, {
      showSuccessToast: false,
    });
  }

  /**
   * Get conversation by ID
   */
  static async getConversation(id: string) {
    return api.get<ChatConversation>(`/chat/conversations/${id}`, {
      showSuccessToast: false,
    });
  }

  /**
   * Create conversation
   */
  static async createConversation(data: {
    type: ConversationType;
    participants: Array<{ userId: string; role: string }>;
    title?: string;
    metadata?: any;
  }) {
    return api.post<ChatConversation>('/chat/conversations', data, {
      successMessage: 'Conversation created successfully',
    });
  }

  /**
   * Create booking conversation
   */
  static async createBookingConversation(data: {
    bookingId: string;
    customerId: string;
    providerId: string;
    adminId?: string;
  }) {
    return api.post<ChatConversation>('/chat/conversations/booking', data, {
      successMessage: 'Booking conversation created',
    });
  }

  /**
   * Create support conversation
   */
  static async createSupportConversation(data: {
    subject: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) {
    return api.post<ChatConversation>('/chat/conversations/support', data, {
      successMessage: 'Support conversation created',
    });
  }

  /**
   * Get conversation messages
   */
  static async getMessages(conversationId: string, params?: {
    page?: number;
    limit?: number;
    before?: Date;
    after?: Date;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.before) queryParams.append('before', params.before.toISOString());
    if (params?.after) queryParams.append('after', params.after.toISOString());

    return api.get<{
      messages: ChatMessage[];
      pagination: any;
    }>(`/chat/conversations/${conversationId}/messages?${queryParams.toString()}`, {
      showSuccessToast: false,
    });
  }

  /**
   * Send message
   */
  static async sendMessage(data: {
    conversationId: string;
    content: string;
    type?: MessageType;
    attachments?: any[];
    replyTo?: string;
    metadata?: any;
  }) {
    return api.post<ChatMessage>('/chat/messages', data, {
      showSuccessToast: false,
    });
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(conversationId: string, messageId?: string) {
    return api.put<{ count: number }>(
      `/chat/conversations/${conversationId}/read`,
      { messageId },
      { showSuccessToast: false }
    );
  }

  /**
   * Edit message
   */
  static async editMessage(messageId: string, content: string) {
    return api.put<ChatMessage>(`/chat/messages/${messageId}`, { content }, {
      successMessage: 'Message updated',
    });
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId: string) {
    return api.delete<ChatMessage>(`/chat/messages/${messageId}`, {
      successMessage: 'Message deleted',
    });
  }

  /**
   * Add reaction
   */
  static async addReaction(messageId: string, emoji: string) {
    return api.post<ChatMessage>(`/chat/messages/${messageId}/reactions`, { emoji }, {
      showSuccessToast: false,
    });
  }

  /**
   * Remove reaction
   */
  static async removeReaction(messageId: string) {
    return api.delete<ChatMessage>(`/chat/messages/${messageId}/reactions`, {
      showSuccessToast: false,
    });
  }

  /**
   * Search messages
   */
  static async searchMessages(conversationId: string, query: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return api.get<{
      messages: ChatMessage[];
      pagination: any;
    }>(`/chat/conversations/${conversationId}/search?${queryParams.toString()}`, {
      showSuccessToast: false,
    });
  }

  /**
   * Archive conversation
   */
  static async archiveConversation(conversationId: string, archive: boolean = true) {
    return api.put<ChatConversation>(
      `/chat/conversations/${conversationId}/archive`,
      { archive },
      {
        successMessage: archive ? 'Conversation archived' : 'Conversation unarchived',
      }
    );
  }

  /**
   * Mute conversation
   */
  static async muteConversation(conversationId: string, mute: boolean = true) {
    return api.put<ChatConversation>(
      `/chat/conversations/${conversationId}/mute`,
      { mute },
      {
        successMessage: mute ? 'Conversation muted' : 'Conversation unmuted',
      }
    );
  }

  /**
   * Get unread count
   */
  static async getUnreadCount() {
    return api.get<{
      conversations: number;
      messages: number;
    }>('/chat/unread', {
      showSuccessToast: false,
    });
  }

  /**
   * Assign admin to support (Admin only)
   */
  static async assignAdminToSupport(conversationId: string, adminId: string) {
    return api.put<ChatConversation>(
      `/chat/conversations/${conversationId}/assign-admin`,
      { adminId },
      {
        successMessage: 'Admin assigned successfully',
      }
    );
  }

  /**
   * Update conversation status (Admin only)
   */
  static async updateConversationStatus(
    conversationId: string,
    status: 'open' | 'pending' | 'resolved' | 'closed'
  ) {
    return api.put<ChatConversation>(
      `/chat/conversations/${conversationId}/status`,
      { status },
      {
        successMessage: 'Status updated',
      }
    );
  }

  /**
   * Get chat analytics (Admin only)
   */
  static async getChatAnalytics(params?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());

    return api.get<any>(`/chat/analytics?${queryParams.toString()}`, {
      showSuccessToast: false,
    });
  }

  /**
   * Upload file
   */
  static async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<{
      type: string;
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }>('/chat/upload', formData, {
      showSuccessToast: false,
    });
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return api.post<Array<{
      type: string;
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }>>('/chat/upload/multiple', formData, {
      showSuccessToast: false,
    });
  }
}

