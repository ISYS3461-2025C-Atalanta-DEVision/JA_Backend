import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@libs/mailer';
import {
  IKafkaEvent,
  IJobCreatedPayload,
  IMatchingJMToJACompletedPayload,
  IPremiumJMCreatedPayload,
  IPremiumJACreatedPayload,
  IPremiumJAExpiredPayload,
  ISearchProfileUpdatedPayload,
} from '@kafka/interfaces';
import {
  NotificationPubSubService,
  IRealtimeNotification,
} from '@redis/services';
import { NotificationRepository } from '../libs';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../libs/dals/mongodb/schemas';
import { v4 as uuidv4 } from 'uuid';

/**
 * Frontend notification type mapping
 */
type FrontendNotificationType =
  | 'ApplicationAlert_Pass'
  | 'ApplicationAlert_Reject'
  | 'JobMatchingAlert'
  | 'ProfileUpdateAlert'
  | 'PremiumExpiredAlert';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly mailerService: MailerService,
    private readonly notificationPubSub: NotificationPubSubService,
  ) {}

  /**
   * Handle new job created event
   * For premium applicants, notify when a matching job is posted
   */
  async handleJobCreated(event: IKafkaEvent<IJobCreatedPayload>): Promise<void> {
    const { payload, eventId } = event;

    this.logger.log(
      `Processing new job: ${payload.title} at ${payload.companyName}`,
    );

    // TODO: Query matching SearchProfiles and send notifications to premium users
    // For now, this logs the event and demonstrates the notification flow

    this.logger.log(`Job created notification processed for jobId: ${payload.jobId}`);
  }

  /**
   * Handle matching completed event from Job Manager
   * Notify applicants who matched with a job
   */
  async handleMatchingCompleted(
    event: IKafkaEvent<IMatchingJMToJACompletedPayload>,
  ): Promise<void> {
    const { payload, eventId } = event;

    this.logger.log(
      `Processing matching results from company: ${payload.companyId}, matched ${payload.totalMatches} entities`,
    );

    // Process each match and create notifications
    for (const match of payload.matches) {
      if (match.matchedEntityType === 'APPLICANT') {
        try {
          await this.createAndSendMatchNotification({
            recipientId: match.matchedEntityId,
            recipientType: 'APPLICANT',
            companyId: payload.companyId,
            matchScore: match.matchScore,
            matchedCriteria: match.matchedCriteria,
            sourceEventId: eventId,
          });
        } catch (error) {
          this.logger.error(
            `Failed to send notification to applicant ${match.matchedEntityId}`,
            error.stack,
          );
        }
      }
    }

    this.logger.log(
      `Matching notifications processed for company: ${payload.companyId}`,
    );
  }

  /**
   * Handle premium subscription created event from Job Manager
   * This event is for company premium subscriptions
   */
  async handlePremiumCreated(
    event: IKafkaEvent<IPremiumJMCreatedPayload>,
  ): Promise<void> {
    const { payload, eventId } = event;

    this.logger.log(
      `Processing company premium subscription: ${payload.companyId}`,
    );

    // This is a company event - may trigger internal workflows
    // No direct notification to applicants needed

    this.logger.log(
      `Company premium subscription processed: ${payload.companyId}`,
    );
  }

  // ==================== JA (Job Applicant) Event Handlers ====================

  /**
   * Handle JA premium subscription created event
   * Send welcome email + trigger matching
   */
  async handleJAPremiumCreated(
    event: IKafkaEvent<IPremiumJACreatedPayload>,
  ): Promise<void> {
    const { payload, eventId } = event;

    this.logger.log(
      `Processing JA premium subscription: ${payload.applicantId}`,
    );

    const notificationId = uuidv4();
    const title = 'Premium Subscription Activated!';
    const message = `Congratulations! Your premium subscription is now active until ${new Date(payload.endDate).toLocaleDateString()}. Enjoy enhanced job matching features!`;

    // Create notification record
    await this.notificationRepository.create({
      notificationId,
      recipientId: payload.applicantId,
      recipientType: 'APPLICANT',
      recipientEmail: '', // TODO: Fetch from applicant service
      type: NotificationType.JA_PREMIUM_ACTIVATED,
      title,
      message,
      data: {
        subscriptionId: payload.subscriptionId,
        subscriptionTier: payload.subscriptionTier,
        startDate: payload.startDate,
        endDate: payload.endDate,
      },
      deliveries: [
        {
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
        {
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
      ],
      priority: 'HIGH',
      sourceEventId: eventId,
    });

    // Publish to Redis for real-time WebSocket delivery
    await this.publishRealtimeNotification(
      payload.applicantId,
      notificationId,
      NotificationType.JA_PREMIUM_ACTIVATED,
      title,
      message,
    );

    // Mark in-app notification as delivered
    await this.notificationRepository.updateDeliveryStatus(
      notificationId,
      NotificationChannel.IN_APP,
      NotificationStatus.DELIVERED,
      { deliveredAt: new Date() },
    );

    this.logger.log(
      `JA premium subscription notification sent: ${payload.applicantId}`,
    );
  }

  /**
   * Handle JA premium subscription expired event
   * Send expiration notification email
   */
  async handleJAPremiumExpired(
    event: IKafkaEvent<IPremiumJAExpiredPayload>,
  ): Promise<void> {
    const { payload, eventId } = event;

    this.logger.log(
      `Processing JA premium expiration: ${payload.applicantId}`,
    );

    const notificationId = uuidv4();
    const title = 'Premium Subscription Expired';
    const message = `Your premium subscription has expired on ${new Date(payload.expiredAt).toLocaleDateString()}. Renew now to continue enjoying enhanced job matching features!`;

    // Create notification record
    await this.notificationRepository.create({
      notificationId,
      recipientId: payload.applicantId,
      recipientType: 'APPLICANT',
      recipientEmail: '', // TODO: Fetch from applicant service
      type: NotificationType.JA_PREMIUM_EXPIRED,
      title,
      message,
      data: {
        subscriptionId: payload.subscriptionId,
        expiredAt: payload.expiredAt,
      },
      deliveries: [
        {
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
        {
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
      ],
      priority: 'HIGH',
      sourceEventId: eventId,
    });

    // Publish to Redis for real-time WebSocket delivery
    await this.publishRealtimeNotification(
      payload.applicantId,
      notificationId,
      NotificationType.JA_PREMIUM_EXPIRED,
      title,
      message,
    );

    // Mark in-app notification as delivered
    await this.notificationRepository.updateDeliveryStatus(
      notificationId,
      NotificationChannel.IN_APP,
      NotificationStatus.DELIVERED,
      { deliveredAt: new Date() },
    );

    this.logger.log(
      `JA premium expiration notification sent: ${payload.applicantId}`,
    );
  }

  /**
   * Handle JA search profile updated event
   * Send confirmation notification
   */
  async handleJASearchProfileUpdated(
    event: IKafkaEvent<ISearchProfileUpdatedPayload>,
  ): Promise<void> {
    const { payload, eventId } = event;

    // Only process if this is an APPLICANT profile update
    if (payload.userType !== 'APPLICANT') {
      this.logger.log(`Skipping non-applicant profile update: ${payload.userId}`);
      return;
    }

    this.logger.log(
      `Processing JA profile update: ${payload.userId}`,
    );

    const notificationId = uuidv4();
    const changedFieldsText = payload.changedFields.join(', ');
    const title = 'Profile Updated Successfully';
    const message = `Your search profile has been updated. Changed fields: ${changedFieldsText}. We'll notify you when new matching jobs are found!`;

    // Create notification record
    await this.notificationRepository.create({
      notificationId,
      recipientId: payload.userId,
      recipientType: 'APPLICANT',
      recipientEmail: '', // TODO: Fetch from applicant service
      type: NotificationType.JA_PROFILE_UPDATED,
      title,
      message,
      data: {
        profileId: payload.profileId,
        changedFields: payload.changedFields,
        isPremium: payload.isPremium,
      },
      deliveries: [
        {
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
      ],
      priority: 'NORMAL',
      sourceEventId: eventId,
    });

    // Publish to Redis for real-time WebSocket delivery
    await this.publishRealtimeNotification(
      payload.userId,
      notificationId,
      NotificationType.JA_PROFILE_UPDATED,
      title,
      message,
    );

    // Mark in-app notification as delivered
    await this.notificationRepository.updateDeliveryStatus(
      notificationId,
      NotificationChannel.IN_APP,
      NotificationStatus.DELIVERED,
      { deliveredAt: new Date() },
    );

    this.logger.log(
      `JA profile update notification sent: ${payload.userId}`,
    );
  }

  /**
   * Create and send a job match notification
   */
  private async createAndSendMatchNotification(params: {
    recipientId: string;
    recipientType: 'APPLICANT' | 'COMPANY';
    companyId: string;
    matchScore: number;
    matchedCriteria: {
      skills: string[];
      location: boolean;
      salary: boolean;
      experience: boolean;
    };
    sourceEventId: string;
  }): Promise<void> {
    const notificationId = uuidv4();

    // TODO: Fetch recipient email from applicant service
    // For now, we'll store the notification without email
    const recipientEmail = ''; // Would be fetched from applicant service

    const title = 'New Job Match Found!';
    const message = `You've been matched with a company based on your profile! Match score: ${params.matchScore}%`;

    // Create notification record
    const notification = await this.notificationRepository.create({
      notificationId,
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      recipientEmail,
      type: NotificationType.JA_NEW_MATCHING_JOB,
      title,
      message,
      data: {
        companyId: params.companyId,
        matchScore: params.matchScore,
        matchedCriteria: params.matchedCriteria,
      },
      deliveries: [
        {
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
        {
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
      ],
      priority: 'NORMAL',
      sourceEventId: params.sourceEventId,
    });

    this.logger.log(`Created notification record: ${notificationId}`);

    // Publish to Redis for real-time WebSocket delivery
    await this.publishRealtimeNotification(
      params.recipientId,
      notificationId,
      NotificationType.JA_NEW_MATCHING_JOB,
      title,
      message,
    );

    // Send email notification (if email is available)
    if (recipientEmail) {
      try {
        await this.sendEmailNotification(notification);
      } catch (error) {
        this.logger.error(
          `Failed to send email for notification ${notificationId}`,
          error.stack,
        );
      }
    }

    // Mark in-app notification as delivered
    await this.notificationRepository.updateDeliveryStatus(
      notificationId,
      NotificationChannel.IN_APP,
      NotificationStatus.DELIVERED,
      { deliveredAt: new Date() },
    );
  }

  /**
   * Publish notification to Redis for real-time WebSocket delivery
   */
  private async publishRealtimeNotification(
    userId: string,
    notificationId: string,
    type: NotificationType,
    title: string,
    description: string,
  ): Promise<void> {
    try {
      const realtimeNotification: IRealtimeNotification = {
        id: notificationId,
        type: this.mapToFrontendType(type),
        title,
        description,
        time: new Date().toISOString(),
        read: false,
      };

      await this.notificationPubSub.publishNotification(userId, realtimeNotification);
      this.logger.log(`Published real-time notification for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to publish real-time notification: ${error.message}`);
      // Don't throw - real-time delivery failure shouldn't block the rest
    }
  }

  /**
   * Map backend NotificationType to frontend type
   */
  private mapToFrontendType(type: NotificationType): FrontendNotificationType {
    switch (type) {
      case NotificationType.JA_NEW_MATCHING_JOB:
        return 'JobMatchingAlert';
      case NotificationType.JA_PREMIUM_ACTIVATED:
        return 'ApplicationAlert_Pass';
      case NotificationType.JA_PREMIUM_EXPIRING:
        return 'ApplicationAlert_Reject';
      case NotificationType.JA_PREMIUM_EXPIRED:
        return 'PremiumExpiredAlert';
      case NotificationType.JA_PROFILE_UPDATED:
        return 'ProfileUpdateAlert';
      default:
        return 'JobMatchingAlert';
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: any): Promise<void> {
    const htmlContent = this.generateEmailHtml(notification);
    const textContent = this.generateEmailText(notification);

    try {
      await this.mailerService.sendRawEmail(
        notification.recipientEmail,
        notification.title,
        htmlContent,
        textContent,
      );

      // Update delivery status to SENT
      await this.notificationRepository.updateDeliveryStatus(
        notification.notificationId,
        NotificationChannel.EMAIL,
        NotificationStatus.SENT,
        { sentAt: new Date() },
      );

      this.logger.log(
        `Email sent successfully for notification: ${notification.notificationId}`,
      );
    } catch (error) {
      // Update delivery status to FAILED
      await this.notificationRepository.updateDeliveryStatus(
        notification.notificationId,
        NotificationChannel.EMAIL,
        NotificationStatus.FAILED,
        {
          error: error.message,
          retryCount: 1,
        },
      );

      throw error;
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHtml(notification: any): string {
    const { title, message, data } = notification;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .match-score { font-size: 24px; font-weight: bold; color: #4F46E5; }
    .criteria { margin: 15px 0; }
    .criteria-item { padding: 5px 0; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>${message}</p>
      ${data?.matchScore ? `<p class="match-score">Match Score: ${data.matchScore}%</p>` : ''}
      ${data?.matchedCriteria ? `
      <div class="criteria">
        <h3>Matched Criteria:</h3>
        <div class="criteria-item">Skills: ${data.matchedCriteria.skills?.join(', ') || 'N/A'}</div>
        <div class="criteria-item">Location: ${data.matchedCriteria.location ? 'Yes' : 'No'}</div>
        <div class="criteria-item">Salary: ${data.matchedCriteria.salary ? 'Yes' : 'No'}</div>
        <div class="criteria-item">Experience: ${data.matchedCriteria.experience ? 'Yes' : 'No'}</div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>This is an automated message from DEVision Job Matching System.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text email content
   */
  private generateEmailText(notification: any): string {
    const { title, message, data } = notification;

    let text = `${title}\n\n${message}`;

    if (data?.matchScore) {
      text += `\n\nMatch Score: ${data.matchScore}%`;
    }

    if (data?.matchedCriteria) {
      text += '\n\nMatched Criteria:';
      text += `\n- Skills: ${data.matchedCriteria.skills?.join(', ') || 'N/A'}`;
      text += `\n- Location: ${data.matchedCriteria.location ? 'Yes' : 'No'}`;
      text += `\n- Salary: ${data.matchedCriteria.salary ? 'Yes' : 'No'}`;
      text += `\n- Experience: ${data.matchedCriteria.experience ? 'Yes' : 'No'}`;
    }

    text += '\n\n---\nThis is an automated message from DEVision Job Matching System.';

    return text;
  }

  // ==================== TCP Message Handlers ====================

  /**
   * Get notifications for a user (paginated)
   */
  async getNotifications(params: {
    recipientId: string;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<{
    notifications: any[];
    total: number;
    unreadCount: number;
  }> {
    const { recipientId, limit = 20, offset = 0, unreadOnly = false } = params;

    const notifications = await this.notificationRepository.findByRecipient(
      recipientId,
      { limit, offset, unreadOnly },
    );

    const unreadCount = await this.notificationRepository.countUnread(recipientId);

    // Transform to frontend format
    const transformedNotifications = notifications.map((n) => ({
      id: n.notificationId,
      type: this.mapToFrontendType(n.type),
      title: n.title,
      description: n.message,
      time: n.createdAt,
      read: n.isRead,
      data: n.data,
    }));

    return {
      notifications: transformedNotifications,
      total: notifications.length,
      unreadCount,
    };
  }

  /**
   * Mark a notification as read
   */
  async markNotificationRead(notificationId: string): Promise<boolean> {
    return this.notificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsRead(recipientId: string): Promise<number> {
    return this.notificationRepository.markAllAsRead(recipientId);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    return this.notificationRepository.countUnread(recipientId);
  }
}
