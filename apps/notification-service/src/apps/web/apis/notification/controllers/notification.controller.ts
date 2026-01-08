import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { NOTIFICATION_SERVICE_WEB_PROVIDER } from "../../../constants";
import { INotificationService } from "../../../interfaces";
import {
  GetNotificationsDto,
  MarkNotificationReadDto,
  MarkAllReadDto,
  GetUnreadCountDto,
} from "../dtos";

@Controller()
export class NotificationController {
  constructor(
    @Inject(NOTIFICATION_SERVICE_WEB_PROVIDER)
    private readonly notificationService: INotificationService,
  ) {}

  @MessagePattern({ cmd: "notification.get" }, Transport.TCP)
  async getNotifications(@Payload() dto: GetNotificationsDto) {
    return await this.notificationService.getNotifications(dto);
  }

  @MessagePattern({ cmd: "notification.markRead" }, Transport.TCP)
  async markRead(@Payload() dto: MarkNotificationReadDto) {
    return await this.notificationService.markNotificationRead(
      dto.notificationId,
    );
  }

  @MessagePattern({ cmd: "notification.markAllRead" }, Transport.TCP)
  async markAllRead(@Payload() dto: MarkAllReadDto) {
    return await this.notificationService.markAllNotificationsRead(
      dto.recipientId,
    );
  }

  @MessagePattern({ cmd: "notification.unreadCount" }, Transport.TCP)
  async getUnreadCount(@Payload() dto: GetUnreadCountDto) {
    return await this.notificationService.getUnreadCount(dto.recipientId);
  }
}
