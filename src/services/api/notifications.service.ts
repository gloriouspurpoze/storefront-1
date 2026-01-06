import { apiClient } from '../apiClient';

export interface PushNotification {
  id: string;
  _id?: string; // MongoDB ID
  userId: string;
  title: string;
  body?: string;
  message?: string; // MongoDB uses 'message' instead of 'body'
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_completed' | 
        'booking_assigned' | 'status_changed' | 'payment_received' | 'review_received' | 
        'system' | 'general' | 
        // Legacy types for backwards compatibility
        'quote_received' | 'quote_accepted' | 'message_received' | 
        'order_placed' | 'order_updated' | 'service_completed' | 
        'review_requested' | 'system_alert' | 'marketing' | 'reminder';
  iconUrl?: string;
  actionUrl?: string;
  relatedId?: string; // MongoDB field
  relatedType?: 'booking' | 'order' | 'payment' | 'review'; // MongoDB field
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: PushNotification['type'];
  titleTemplate: string;
  bodyTemplate: string;
  iconUrl?: string;
  actionUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderNotifications: boolean;
  userNotifications: boolean;
  systemNotifications: boolean;
  marketingNotifications: boolean;
}

export interface CreateNotificationRequest {
  title: string;
  body: string;
  type: PushNotification['type'];
  iconUrl?: string;
  actionUrl?: string;
  data?: Record<string, any>;
  userIds?: string[];
}

export interface CreateTemplateRequest {
  name: string;
  type: PushNotification['type'];
  titleTemplate: string;
  bodyTemplate: string;
  iconUrl?: string;
  actionUrl?: string;
  isActive?: boolean;
}

export interface UpdatePreferencesRequest {
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  orderNotifications?: boolean;
  userNotifications?: boolean;
  systemNotifications?: boolean;
  marketingNotifications?: boolean;
}

export interface VAPIDKeyResponse {
  publicKey: string;
}

export interface DeviceRegistrationRequest {
  token: string;
  platform: 'web' | 'ios' | 'android';
  deviceInfo?: Record<string, any>;
}

export interface NotificationStats {
  totalSent: number;
  totalRead: number;
  totalUnread: number;
  readRate: number;
  byType: Record<string, number>;
}

class NotificationsService {
  private baseUrl = '/notifications-mongo'; // Updated to use MongoDB endpoints (relative to baseURL)

  // Notifications (MongoDB-based)
  async getNotifications(limit: number = 50, page: number = 1): Promise<PushNotification[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}?page=${page}&limit=${limit}`) as any;
      
      // Backend returns: { success: true, data: { notifications: [...], total: X, unreadCount: Y } }
      const notificationsData = response.data?.notifications || response.notifications || [];
      
      // Map backend notification format to frontend format
      return notificationsData.map((n: any) => ({
        id: n._id?.toString() || n.id,
        _id: n._id?.toString() || n.id,
        userId: n.userId?.toString() || n.userId,
        title: n.title || '',
        body: n.message || n.body || '',
        message: n.message || n.body || '',
        type: n.type || 'general',
        iconUrl: n.iconUrl,
        actionUrl: n.actionUrl,
        relatedId: n.relatedId,
        relatedType: n.relatedType,
        data: n.data || {},
        isRead: n.isRead !== undefined ? n.isRead : (n.read === false ? false : true),
        readAt: n.readAt || n.readAt,
        createdAt: n.createdAt || n.created_at || new Date().toISOString(),
        updatedAt: n.updatedAt || n.updated_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/unread-count`) as any;
      // Backend returns: { success: true, data: { count: X } }
      return response.data?.count || response.count || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/${notificationId}/read`, {});
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/mark-all-read`, {});
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${notificationId}`);
  }

  // Preferences (Stub - not implemented in MongoDB version yet)
  async getPreferences(): Promise<NotificationPreferences> {
    // Return default preferences since MongoDB version doesn't have preferences yet
    return {
      userId: '',
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      orderNotifications: true,
      userNotifications: true,
      systemNotifications: true,
      marketingNotifications: false,
    };
  }

  async updatePreferences(preferences: UpdatePreferencesRequest): Promise<void> {
    // Stub - MongoDB version doesn't have preferences yet
    console.log('Preferences update not implemented in MongoDB version:', preferences);
  }

  // Device Management (Stub - not needed for in-app notifications)
  async getVAPIDKey(): Promise<string> {
    throw new Error('Push notifications not implemented in MongoDB version');
  }

  async registerDevice(data: DeviceRegistrationRequest): Promise<void> {
    throw new Error('Push notifications not implemented in MongoDB version');
  }

  async unregisterDevice(token: string): Promise<void> {
    throw new Error('Push notifications not implemented in MongoDB version');
  }

  // Admin functions (Stub - not needed for current implementation)
  async sendNotification(data: CreateNotificationRequest): Promise<{ success: number; failed: number }> {
    throw new Error('Manual notification sending not implemented');
  }

  async getTemplates(): Promise<NotificationTemplate[]> {
    return [];
  }

  async createTemplate(data: CreateTemplateRequest): Promise<{ templateId: string }> {
    throw new Error('Templates not implemented');
  }

  async sendTemplateNotification(templateId: string, userId: string, variables: Record<string, any> = {}): Promise<void> {
    throw new Error('Template notifications not implemented');
  }

  async getNotificationStats(): Promise<NotificationStats> {
    return {
      totalSent: 0,
      totalRead: 0,
      totalUnread: 0,
      readRate: 0,
      byType: {},
    };
  }
}

export const notificationsService = new NotificationsService();
