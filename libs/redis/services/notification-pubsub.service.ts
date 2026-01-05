import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { REDIS_CHANNELS } from '../constants';

/**
 * Notification message structure for real-time delivery
 */
export interface IRealtimeNotification {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export interface INotificationMessage {
  userId: string;
  notification: IRealtimeNotification;
}

export type NotificationCallback = (userId: string, notification: IRealtimeNotification) => void;

/**
 * Notification PubSub Service
 * Handles Redis Pub/Sub for real-time notification delivery
 */
@Injectable()
export class NotificationPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationPubSubService.name);
  private subscriber: Redis | null = null;
  private notificationCallback: NotificationCallback | null = null;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async onModuleInit() {
    try {
      // Create a duplicate connection for subscribing
      // (ioredis requires separate connection for pub/sub)
      this.subscriber = this.redis.duplicate();

      this.subscriber.on('error', (err) => {
        this.logger.error(`Redis subscriber error: ${err.message}`);
      });

      this.subscriber.on('connect', () => {
        this.logger.log('Redis subscriber connected');
      });

      // Subscribe to notification channel
      await this.subscriber.subscribe(REDIS_CHANNELS.NOTIFICATION_REALTIME);
      this.logger.log(`Subscribed to channel: ${REDIS_CHANNELS.NOTIFICATION_REALTIME}`);

      // Handle incoming messages
      this.subscriber.on('message', (channel, message) => {
        if (channel === REDIS_CHANNELS.NOTIFICATION_REALTIME) {
          this.handleNotificationMessage(message);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to initialize notification pubsub: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.unsubscribe(REDIS_CHANNELS.NOTIFICATION_REALTIME);
      await this.subscriber.quit();
      this.subscriber = null;
    }
  }

  /**
   * Register callback for notification messages
   * Called by WebSocket gateway to receive notifications
   */
  onNotification(callback: NotificationCallback): void {
    this.notificationCallback = callback;
    this.logger.log('Notification callback registered');
  }

  /**
   * Publish notification for real-time delivery
   * Called by notification-service when creating notifications
   */
  async publishNotification(userId: string, notification: IRealtimeNotification): Promise<void> {
    try {
      const message: INotificationMessage = { userId, notification };
      await this.redis.publish(
        REDIS_CHANNELS.NOTIFICATION_REALTIME,
        JSON.stringify(message),
      );
      this.logger.debug(`Published notification for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to publish notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle incoming notification message from Redis
   */
  private handleNotificationMessage(message: string): void {
    try {
      const parsed: INotificationMessage = JSON.parse(message);
      if (this.notificationCallback) {
        this.notificationCallback(parsed.userId, parsed.notification);
      }
    } catch (error) {
      this.logger.error(`Failed to parse notification message: ${error.message}`);
    }
  }
}
