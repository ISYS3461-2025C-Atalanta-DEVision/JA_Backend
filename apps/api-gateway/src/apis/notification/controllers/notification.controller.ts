import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Inject,
  Logger,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { CurrentUser } from "@auth/decorators";
import { AuthenticatedUser } from "@auth/interfaces";
import { firstValueFrom, timeout, catchError } from "rxjs";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    @Inject("NOTIFICATION_SERVICE")
    private readonly notificationClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Get notifications",
    description: "Get paginated notifications for current user",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 20)",
  })
  @ApiQuery({
    name: "offset",
    required: false,
    type: Number,
    description: "Offset for pagination (default: 0)",
  })
  @ApiQuery({
    name: "unreadOnly",
    required: false,
    type: Boolean,
    description: "Only return unread notifications",
  })
  @ApiResponse({
    status: 200,
    description: "Notifications retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("unreadOnly") unreadOnly?: string,
  ) {
    this.logger.log(`User ${user.email} fetching notifications`);
    try {
      const result = await firstValueFrom(
        this.notificationClient
          .send(
            { cmd: "notification.get" },
            {
              recipientId: user.id,
              limit: limit ? Number(limit) : 20,
              offset: offset ? Number(offset) : 0,
              unreadOnly: unreadOnly === "true",
            },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Notification service unavailable",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to fetch notifications",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("unread-count")
  @ApiOperation({
    summary: "Get unread count",
    description: "Get count of unread notifications",
  })
  @ApiResponse({
    status: 200,
    description: "Unread count retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`User ${user.email} fetching unread count`);
    try {
      const count = await firstValueFrom(
        this.notificationClient
          .send({ cmd: "notification.unreadCount" }, { recipientId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Notification service unavailable",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      return { unreadCount: count };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to fetch unread count",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(":notificationId/read")
  @ApiOperation({
    summary: "Mark notification as read",
    description: "Mark a specific notification as read",
  })
  @ApiParam({ name: "notificationId", description: "Notification ID" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param("notificationId") notificationId: string,
  ) {
    this.logger.log(
      `User ${user.email} marking notification ${notificationId} as read`,
    );
    try {
      const result = await firstValueFrom(
        this.notificationClient
          .send({ cmd: "notification.markRead" }, { notificationId })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to mark notification as read",
                error.status || HttpStatus.NOT_FOUND,
              );
            }),
          ),
      );
      return { success: result };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to mark notification as read",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("mark-all-read")
  @ApiOperation({
    summary: "Mark all notifications as read",
    description: "Mark all notifications as read for current user",
  })
  @ApiResponse({ status: 200, description: "All notifications marked as read" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`User ${user.email} marking all notifications as read`);
    try {
      const count = await firstValueFrom(
        this.notificationClient
          .send({ cmd: "notification.markAllRead" }, { recipientId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to mark all notifications as read",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      return { markedCount: count };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to mark all notifications as read",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
