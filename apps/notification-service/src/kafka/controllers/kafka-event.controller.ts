import { Controller, Logger, Inject } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE_WEB_PROVIDER } from '../../apps/web/constants';
import { NotificationService } from '../../apps/web/services';
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
export class KafkaEventController {
  private readonly logger = new Logger(KafkaEventController.name);

  constructor(
    @Inject(NOTIFICATION_SERVICE_WEB_PROVIDER)
    private readonly notificationService: NotificationService,
  ) {}

  @EventPattern(TOPIC_JOB_CREATED)
  async handleJobCreated(
    @Payload() message: IKafkaEvent<IJobCreatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(`Received job.created [topic=${topic}, partition=${partition}, offset=${offset}]`);

    try {
      await this.notificationService.handleJobCreated(message);
      this.logger.log(`Processed job.created: ${message.eventId}`);
    } catch (error) {
      this.logger.error(`Failed job.created: ${message.eventId}`, error.stack);
    }
  }

  @EventPattern(TOPIC_MATCHING_JM_TO_JA_COMPLETED)
  async handleMatchingCompleted(
    @Payload() message: IKafkaEvent<IMatchingJMToJACompletedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(`Received matching.completed [topic=${topic}, partition=${partition}, offset=${offset}]`);

    try {
      await this.notificationService.handleMatchingCompleted(message);
      this.logger.log(`Processed matching.completed: ${message.eventId}`);
    } catch (error) {
      this.logger.error(`Failed matching.completed: ${message.eventId}`, error.stack);
    }
  }

  @EventPattern(TOPIC_SUBSCRIPTION_PREMIUM_JM_CREATED)
  async handlePremiumCreated(
    @Payload() message: IKafkaEvent<IPremiumJMCreatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(`Received premium.jm.created [topic=${topic}, partition=${partition}, offset=${offset}]`);

    try {
      await this.notificationService.handlePremiumCreated(message);
      this.logger.log(`Processed premium.jm.created: ${message.eventId}`);
    } catch (error) {
      this.logger.error(`Failed premium.jm.created: ${message.eventId}`, error.stack);
    }
  }

  @EventPattern(TOPIC_SUBSCRIPTION_PREMIUM_JA_CREATED)
  async handleJAPremiumCreated(
    @Payload() message: IKafkaEvent<IPremiumJACreatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(`Received premium.ja.created [topic=${topic}, partition=${partition}, offset=${offset}]`);

    try {
      await this.notificationService.handleJAPremiumCreated(message);
      this.logger.log(`Processed premium.ja.created: ${message.eventId}`);
    } catch (error) {
      this.logger.error(`Failed premium.ja.created: ${message.eventId}`, error.stack);
    }
  }

  @EventPattern(TOPIC_SUBSCRIPTION_PREMIUM_JA_EXPIRED)
  async handleJAPremiumExpired(
    @Payload() message: IKafkaEvent<IPremiumJAExpiredPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(`Received premium.ja.expired [topic=${topic}, partition=${partition}, offset=${offset}]`);

    try {
      await this.notificationService.handleJAPremiumExpired(message);
      this.logger.log(`Processed premium.ja.expired: ${message.eventId}`);
    } catch (error) {
      this.logger.error(`Failed premium.ja.expired: ${message.eventId}`, error.stack);
    }
  }

  @EventPattern(TOPIC_PROFILE_JA_SEARCH_PROFILE_CREATED)
  async handleJASearchProfileCreated(
    @Payload() message: IKafkaEvent<ISearchProfileCreatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(`Received profile.created [topic=${topic}, partition=${partition}, offset=${offset}]`);

    try {
      await this.notificationService.handleJASearchProfileCreated(message);
      this.logger.log(`Processed profile.created: ${message.eventId}`);
    } catch (error) {
      this.logger.error(`Failed profile.created: ${message.eventId}`, error.stack);
    }
  }

  @EventPattern(TOPIC_PROFILE_JA_SEARCH_PROFILE_UPDATED)
  async handleJASearchProfileUpdated(
    @Payload() message: IKafkaEvent<ISearchProfileUpdatedPayload>,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(`Received profile.updated [topic=${topic}, partition=${partition}, offset=${offset}]`);

    try {
      await this.notificationService.handleJASearchProfileUpdated(message);
      this.logger.log(`Processed profile.updated: ${message.eventId}`);
    } catch (error) {
      this.logger.error(`Failed profile.updated: ${message.eventId}`, error.stack);
    }
  }

  private getKafkaMetadata(context: KafkaContext) {
    return {
      topic: context.getTopic(),
      partition: context.getPartition(),
      offset: context.getMessage().offset,
    };
  }
}
