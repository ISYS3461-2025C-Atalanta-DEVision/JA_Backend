import { Notification, NotificationChannel, NotificationStatus } from '../schemas';

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByNotificationId(notificationId: string): Promise<Notification | null>;
  findByRecipient(
    recipientId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    },
  ): Promise<Notification[]>;
  create(data: Partial<Notification>): Promise<Notification>;
  updateDeliveryStatus(
    notificationId: string,
    channel: NotificationChannel,
    status: NotificationStatus,
    extra?: {
      sentAt?: Date;
      deliveredAt?: Date;
      messageId?: string;
      error?: string;
      retryCount?: number;
    },
  ): Promise<Notification | null>;
  markAsRead(notificationId: string): Promise<boolean>;
  markAllAsRead(recipientId: string): Promise<number>;
  countUnread(recipientId: string): Promise<number>;
  findPendingDeliveries(
    channel: NotificationChannel,
    limit?: number,
  ): Promise<Notification[]>;
}

export const NOTIFICATION_REPO_PROVIDER = Symbol('NotificationRepositoryProvider');
