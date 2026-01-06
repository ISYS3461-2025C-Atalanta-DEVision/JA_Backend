import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

// TCP Message Patterns
export const NOTIFICATION_PATTERNS = {
  GET_NOTIFICATIONS: 'notification.get',
  MARK_READ: 'notification.markRead',
  MARK_ALL_READ: 'notification.markAllRead',
  GET_UNREAD_COUNT: 'notification.unreadCount',
} as const;
import {
  TOPIC_JOB_CREATED,
  TOPIC_MATCHING_JM_TO_JA_COMPLETED,
  TOPIC_SUBSCRIPTION_PREMIUM_JM_CREATED,
  TOPIC_SUBSCRIPTION_PREMIUM_JA_CREATED,
  TOPIC_SUBSCRIPTION_PREMIUM_JA_EXPIRED,
  TOPIC_PROFILE_JA_SEARCH_PROFILE_CREATED,
  TOPIC_PROFILE_JA_SEARCH_PROFILE_UPDATED,
} from '@kafka/constants';
import {
  IKafkaEvent,
  IJobCreatedPayload,
  IMatchingJMToJACompletedPayload,
  IPremiumJMCreatedPayload,
  IPremiumJACreatedPayload,
  IPremiumJAExpiredPayload,
  ISearchProfileCreatedPayload,
  ISearchProfileUpdatedPayload,
} from '@kafka/interfaces';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) { }

  /**
   * Handle new job created events
   * Triggered when a new job is posted by a company
   */
  @EventPattern(TOPIC_JOB_CREATED)
  async handleJobCreated(
    @Payload() message: IKafkaEvent<IJobCreatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `Received job.created event [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJobCreated(message);
      this.logger.log(`Processed job.created event: ${message.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process job.created event: ${message.eventId}`,
        error.stack,
      );
      // TODO: Send to DLQ
    }
  }

  /**
   * Handle job matching completed events
   * Triggered when Job Manager completes matching for a job
   */
  @EventPattern(TOPIC_MATCHING_JM_TO_JA_COMPLETED)
  async handleMatchingCompleted(
    @Payload() message: IKafkaEvent<IMatchingJMToJACompletedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `Received matching.completed event [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleMatchingCompleted(message);
      this.logger.log(`Processed matching.completed event: ${message.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process matching.completed event: ${message.eventId}`,
        error.stack,
      );
      // TODO: Send to DLQ
    }
  }

  /**
   * Handle premium subscription created events from Job Manager
   * Triggered when an applicant's premium subscription is confirmed by Job Manager
   */
  @EventPattern(TOPIC_SUBSCRIPTION_PREMIUM_JM_CREATED)
  async handlePremiumCreated(
    @Payload() message: IKafkaEvent<IPremiumJMCreatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `Received subscription.premium.jm.created event [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handlePremiumCreated(message);
      this.logger.log(
        `Processed subscription.premium.jm.created event: ${message.eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process subscription.premium.jm.created event: ${message.eventId}`,
        error.stack,
      );
      // TODO: Send to DLQ
    }
  }

  // ==================== JA (Job Applicant) Event Handlers ====================

  /**
   * Handle JA premium subscription created events
   * Triggered when an applicant activates premium subscription
   */
  @EventPattern(TOPIC_SUBSCRIPTION_PREMIUM_JA_CREATED)
  async handleJAPremiumCreated(
    @Payload() message: IKafkaEvent<IPremiumJACreatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `Received subscription.premium.ja.created event [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJAPremiumCreated(message);
      this.logger.log(
        `Processed subscription.premium.ja.created event: ${message.eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process subscription.premium.ja.created event: ${message.eventId}`,
        error.stack,
      );
      // TODO: Send to DLQ
    }
  }

  /**
   * Handle JA premium subscription expired events
   * Triggered when an applicant's premium subscription expires
   */
  @EventPattern(TOPIC_SUBSCRIPTION_PREMIUM_JA_EXPIRED)
  async handleJAPremiumExpired(
    @Payload() message: IKafkaEvent<IPremiumJAExpiredPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `Received subscription.premium.ja.expired event [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJAPremiumExpired(message);
      this.logger.log(
        `Processed subscription.premium.ja.expired event: ${message.eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process subscription.premium.ja.expired event: ${message.eventId}`,
        error.stack,
      );
      // TODO: Send to DLQ
    }
  }

  /**
   * Handle JA search profile created events
   * Triggered when an applicant creates their search profile
   */
  @EventPattern(TOPIC_PROFILE_JA_SEARCH_PROFILE_CREATED)
  async handleJASearchProfileCreated(
    @Payload() message: IKafkaEvent<ISearchProfileCreatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `Received profile.ja.search-profile.created event [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJASearchProfileCreated(message);
      this.logger.log(
        `Processed profile.ja.search-profile.created event: ${message.eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process profile.ja.search-profile.created event: ${message.eventId}`,
        error.stack,
      );
      // TODO: Send to DLQ
    }
  }

  /**
   * Handle JA search profile updated events
   * Triggered when an applicant updates their search profile
   */
  @EventPattern(TOPIC_PROFILE_JA_SEARCH_PROFILE_UPDATED)
  async handleJASearchProfileUpdated(
    @Payload() message: IKafkaEvent<ISearchProfileUpdatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `Received profile.ja.search-profile.updated event [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJASearchProfileUpdated(message);
      this.logger.log(
        `Processed profile.ja.search-profile.updated event: ${message.eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process profile.ja.search-profile.updated event: ${message.eventId}`,
        error.stack,
      );
      // TODO: Send to DLQ
    }
  }

}
