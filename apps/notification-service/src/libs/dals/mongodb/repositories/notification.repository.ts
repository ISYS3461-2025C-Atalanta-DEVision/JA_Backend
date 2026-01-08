import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from "../schemas";
import { INotificationRepository } from "../interfaces";

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly model: Model<Notification>,
  ) {}

  async findById(id: string): Promise<Notification | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return (await this.model.findById(id).lean().exec()) as Notification | null;
  }

  async findByNotificationId(
    notificationId: string,
  ): Promise<Notification | null> {
    return (await this.model
      .findOne({ notificationId })
      .lean()
      .exec()) as Notification | null;
  }

  async findByRecipient(
    recipientId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    },
  ): Promise<Notification[]> {
    const query: any = { recipientId };

    if (options?.unreadOnly) {
      query.isRead = false;
    }

    return (await this.model
      .find(query)
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 20)
      .lean()
      .exec()) as Notification[];
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const created = await this.model.create(data);
    return created.toObject() as Notification;
  }

  async updateDeliveryStatus(
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
  ): Promise<Notification | null> {
    const updateData: any = {
      "deliveries.$.status": status,
    };

    if (extra?.sentAt) {
      updateData["deliveries.$.sentAt"] = extra.sentAt;
    }
    if (extra?.deliveredAt) {
      updateData["deliveries.$.deliveredAt"] = extra.deliveredAt;
    }
    if (extra?.messageId) {
      updateData["deliveries.$.messageId"] = extra.messageId;
    }
    if (extra?.error) {
      updateData["deliveries.$.error"] = extra.error;
    }
    if (typeof extra?.retryCount === "number") {
      updateData["deliveries.$.retryCount"] = extra.retryCount;
    }

    return (await this.model
      .findOneAndUpdate(
        { notificationId, "deliveries.channel": channel },
        { $set: updateData },
        { new: true },
      )
      .lean()
      .exec()) as Notification | null;
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const result = await this.model
      .findOneAndUpdate(
        { notificationId },
        { $set: { isRead: true, readAt: new Date() } },
      )
      .exec();
    return result !== null;
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await this.model
      .updateMany(
        { recipientId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
      )
      .exec();
    return result.modifiedCount;
  }

  async countUnread(recipientId: string): Promise<number> {
    return await this.model
      .countDocuments({ recipientId, isRead: false })
      .exec();
  }

  async findPendingDeliveries(
    channel: NotificationChannel,
    limit = 100,
  ): Promise<Notification[]> {
    return (await this.model
      .find({
        deliveries: {
          $elemMatch: {
            channel,
            status: NotificationStatus.PENDING,
          },
        },
      })
      .limit(limit)
      .lean()
      .exec()) as Notification[];
  }
}
