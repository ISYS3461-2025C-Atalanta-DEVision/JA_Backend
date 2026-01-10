import { Controller, Logger, Inject } from "@nestjs/common";
import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from "@nestjs/microservices";
import { NOTIFICATION_SERVICE_WEB_PROVIDER } from "../../apps/web/constants";
import { NotificationService } from "../../apps/web/services";
import {
  TOPIC_JOB_CREATED,
  TOPIC_JOB_UPDATED,
  TOPIC_SUBSCRIPTION_PREMIUM_JA_CREATED,
  TOPIC_SUBSCRIPTION_PREMIUM_JA_CLOSED,
  TOPIC_SUBSCRIPTION_PREMIUM_JA_EXPIRED,
  TOPIC_PROFILE_JA_SEARCH_PROFILE_CREATED,
  TOPIC_PROFILE_JA_SEARCH_PROFILE_UPDATED,
} from "@kafka/constants";
import {
  IJobCreatedPayload,
  IJobUpdatedPayload,
  IPremiumJACreatedPayload,
  IPremiumJAClosedPayload,
  IPremiumJAExpiredPayload,
  ISearchProfileCreatedPayload,
  ISearchProfileUpdatedPayload,
} from "@kafka/interfaces";

@Controller()
export class KafkaEventController {
  private readonly logger = new Logger(KafkaEventController.name);

  constructor(
    @Inject(NOTIFICATION_SERVICE_WEB_PROVIDER)
    private readonly notificationService: NotificationService,
  ) { }

  @EventPattern(TOPIC_JOB_CREATED)
  async handleJobCreated(
    @Payload() message: IJobCreatedPayload,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(
      `Received job.created [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );
    this.logger.debug(`Message Payload: ${JSON.stringify(message)}`);

    try {
      await this.notificationService.handleJobCreated(message);
      this.logger.log(`Processed job.created: ${message.jobId}`);
    } catch (error) {
      this.logger.error(`Failed job.created: ${message.jobId}`, error.stack);
    }
  }

  @EventPattern(TOPIC_JOB_UPDATED)
  async handleJobUpdated(
    @Payload() message: IJobUpdatedPayload,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(
      `Received job.updated [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );
    this.logger.debug(`Message Payload: ${JSON.stringify(message)}`);

    try {
      await this.notificationService.handleJobUpdated(message);
      this.logger.log(`Processed job.updated: ${message.jobId}`);
    } catch (error) {
      this.logger.error(`Failed job.updated: ${message.jobId}`, error.stack);
    }
  }

  @EventPattern(TOPIC_SUBSCRIPTION_PREMIUM_JA_CREATED)
  async handleJAPremiumCreated(
    @Payload() message: IPremiumJACreatedPayload,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(
      `Received premium.ja.created [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJAPremiumCreated(message);
      this.logger.log(`Processed premium.ja.created: ${message.applicantId}`);
    } catch (error) {
      this.logger.error(
        `Failed premium.ja.created: ${message.applicantId}`,
        error.stack,
      );
    }
  }

  @EventPattern(TOPIC_SUBSCRIPTION_PREMIUM_JA_EXPIRED)
  async handleJAPremiumExpired(
    @Payload() message: IPremiumJAExpiredPayload,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(
      `Received premium.ja.expired [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJAPremiumExpired(message);
      this.logger.log(`Processed premium.ja.expired: ${message.applicantId}`);
    } catch (error) {
      this.logger.error(
        `Failed premium.ja.expired: ${message.applicantId}`,
        error.stack,
      );
    }
  }

  @EventPattern(TOPIC_SUBSCRIPTION_PREMIUM_JA_CLOSED)
  async handleJAPremiumClosed(
    @Payload() message: IPremiumJAClosedPayload,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(
      `Received premium.ja.closed [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJAPremiumClosed(message);
      this.logger.log(`Processed premium.ja.closed: ${message.applicantId}`);
    } catch (error) {
      this.logger.error(
        `Failed premium.ja.closed: ${message.applicantId}`,
        error.stack,
      );
    }
  }

  @EventPattern(TOPIC_PROFILE_JA_SEARCH_PROFILE_CREATED)
  async handleJASearchProfileCreated(
    @Payload() message: ISearchProfileCreatedPayload,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(
      `Received profile.created [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJASearchProfileCreated(message);
      this.logger.log(`Processed profile.created: ${message.profileId}`);
    } catch (error) {
      this.logger.error(
        `Failed profile.created: ${message.profileId}`,
        error.stack,
      );
    }
  }

  @EventPattern(TOPIC_PROFILE_JA_SEARCH_PROFILE_UPDATED)
  async handleJASearchProfileUpdated(
    @Payload() message: ISearchProfileUpdatedPayload,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = this.getKafkaMetadata(context);
    this.logger.log(
      `Received profile.updated [topic=${topic}, partition=${partition}, offset=${offset}]`,
    );

    try {
      await this.notificationService.handleJASearchProfileUpdated(message);
      this.logger.log(`Processed profile.updated: ${message.profileId}`);
    } catch (error) {
      this.logger.error(
        `Failed profile.updated: ${message.profileId}`,
        error.stack,
      );
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
