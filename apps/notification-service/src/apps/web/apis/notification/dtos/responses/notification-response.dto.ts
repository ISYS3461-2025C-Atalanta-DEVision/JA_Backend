export class NotificationItemDto {
  id: string;
  type: string;
  title: string;
  description: string;
  time: Date;
  read: boolean;
  data?: Record<string, any>;
}

export class NotificationListResponseDto {
  notifications: NotificationItemDto[];
  total: number;
  unreadCount: number;
}

export class MarkReadResponseDto {
  success: boolean;
}

export class MarkAllReadResponseDto {
  markedCount: number;
}

export class UnreadCountResponseDto {
  unreadCount: number;
}
