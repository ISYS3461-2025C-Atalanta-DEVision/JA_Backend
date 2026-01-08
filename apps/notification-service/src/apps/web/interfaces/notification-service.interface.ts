import {
  GetNotificationsDto,
  NotificationListResponseDto,
} from "../apis/notification/dtos";

export interface INotificationService {
  getNotifications(
    params: GetNotificationsDto,
  ): Promise<NotificationListResponseDto>;
  markNotificationRead(notificationId: string): Promise<boolean>;
  markAllNotificationsRead(recipientId: string): Promise<number>;
  getUnreadCount(recipientId: string): Promise<number>;
}
