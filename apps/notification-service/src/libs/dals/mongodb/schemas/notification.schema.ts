import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type NotificationDocument = HydratedDocument<Notification>;

/**
 * Notification types
 */
export enum NotificationType {
  JA_NEW_MATCHING_JOB = "JA_NEW_MATCHING_JOB",
  JA_PREMIUM_ACTIVATED = "JA_PREMIUM_ACTIVATED",
  JA_PREMIUM_EXPIRING = "JA_PREMIUM_EXPIRING",
  JA_PREMIUM_EXPIRED = "JA_PREMIUM_EXPIRED",
  JA_PROFILE_CREATED = "JA_PROFILE_CREATED",
  JA_PROFILE_UPDATED = "JA_PROFILE_UPDATED",
  JM_NEW_MATCHING_APPLICANT = "JM_NEW_MATCHING_APPLICANT",
  JM_PREMIUM_ACTIVATED = "JM_PREMIUM_ACTIVATED",
  JM_PREMIUM_EXPIRING = "JM_PREMIUM_EXPIRING",
  JM_PROFILE_CREATED = "JM_PROFILE_CREATED",
  JM_PROFILE_UPDATED = "JM_PROFILE_UPDATED",
}

/**
 * Notification channels
 */
export enum NotificationChannel {
  EMAIL = "EMAIL",
  PUSH = "PUSH",
  IN_APP = "IN_APP",
}

/**
 * Notification status
 */
export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  DELIVERED = "DELIVERED",
  READ = "READ",
}

/**
 * Channel delivery status subdocument
 */
@Schema({ _id: false })
export class ChannelDelivery {
  @Prop({ type: String, enum: NotificationChannel, required: true })
  channel: NotificationChannel;

  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  messageId?: string;

  @Prop()
  error?: string;

  @Prop({ default: 0 })
  retryCount: number;
}

const ChannelDeliverySchema = SchemaFactory.createForClass(ChannelDelivery);

/**
 * Notification Schema
 * Stores notification records for job applicants and companies
 */
@Schema({
  collection: "notifications",
  timestamps: true,
})
export class Notification {
  _id: Types.ObjectId;

  /**
   * Unique notification ID (from Kafka event)
   */
  @Prop({ required: true, unique: true, index: true })
  notificationId: string;

  /**
   * Recipient ID (applicantId or companyId)
   */
  @Prop({ required: true, index: true })
  recipientId: string;

  /**
   * Recipient type
   */
  @Prop({ type: String, enum: ["APPLICANT", "COMPANY"], required: true })
  recipientType: "APPLICANT" | "COMPANY";

  /**
   * Recipient email address
   */
  @Prop({ required: true })
  recipientEmail: string;

  /**
   * Notification type
   */
  @Prop({ type: String, enum: NotificationType, required: true, index: true })
  type: NotificationType;

  /**
   * Notification title
   */
  @Prop({ required: true })
  title: string;

  /**
   * Notification message/body
   */
  @Prop({ required: true })
  message: string;

  /**
   * Additional data payload (job details, match scores, etc.)
   */
  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  /**
   * Delivery status per channel
   */
  @Prop({ type: [ChannelDeliverySchema], default: [] })
  deliveries: ChannelDelivery[];

  /**
   * Priority level
   */
  @Prop({ type: String, enum: ["LOW", "NORMAL", "HIGH"], default: "NORMAL" })
  priority: "LOW" | "NORMAL" | "HIGH";

  /**
   * Whether notification has been read by recipient
   */
  @Prop({ default: false })
  isRead: boolean;

  /**
   * Read timestamp
   */
  @Prop()
  readAt?: Date;

  /**
   * Source Kafka event ID for tracing
   */
  @Prop()
  sourceEventId?: string;

  // ===========================================
  // Timestamps
  // ===========================================

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// ===========================================
// Indexes for Performance
// ===========================================

// Index for fetching notifications by recipient
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

// Index for fetching unread notifications
NotificationSchema.index({ recipientId: 1, isRead: 1 });

// Index for finding pending deliveries
NotificationSchema.index({ "deliveries.status": 1, "deliveries.channel": 1 });
