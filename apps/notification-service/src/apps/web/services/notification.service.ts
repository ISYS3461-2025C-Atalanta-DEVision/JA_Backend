import { Injectable, Logger, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { MailerService } from "@libs/mailer";
import {
  IKafkaEvent,
  IJobCreatedPayload,
  IMatchingJMToJACompletedPayload,
  IPremiumJMCreatedPayload,
  IPremiumJACreatedPayload,
  IPremiumJAExpiredPayload,
  ISearchProfileCreatedPayload,
  ISearchProfileUpdatedPayload,
  ISearchProfilePayload,
} from "@kafka/interfaces";
import {
  NotificationPubSubService,
  IRealtimeNotification,
} from "@redis/services";
import { NotificationRepository } from "../../../libs";
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  EmploymentType,
} from "../../../libs/dals/mongodb/schemas";
import { SearchProfileProjectionRepository } from "../../../libs/dals/mongodb/repositories/search-profile-projection.repository";
import { IJobMatchCriteria } from "../../../libs/dals/mongodb/interfaces";
import { v4 as uuidv4 } from "uuid";
import { firstValueFrom, timeout, catchError, of } from "rxjs";
import { INotificationService } from "../interfaces";
import {
  GetNotificationsDto,
  NotificationListResponseDto,
} from "../apis/notification/dtos";

/**
 * Frontend notification type mapping
 */
type FrontendNotificationType =
  | "ApplicationAlert_Pass"
  | "ApplicationAlert_Reject"
  | "JobMatchingAlert"
  | "ProfileUpdateAlert"
  | "PremiumExpiredAlert";

/**
 * Applicant data returned from applicant-service
 */
interface IApplicantData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly searchProfileRepo: SearchProfileProjectionRepository,
    private readonly mailerService: MailerService,
    private readonly notificationPubSub: NotificationPubSubService,
    @Inject("APPLICANT_SERVICE") private readonly applicantClient: ClientProxy,
  ) {}

  /**
   * Validates applicant exists in applicant-service and returns applicant data including email.
   * Returns null if applicant not found or service unavailable.
   */
  private async validateAndGetApplicant(
    applicantId: string,
  ): Promise<IApplicantData | null> {
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "applicant.findById" }, { id: applicantId })
          .pipe(
            timeout(5000),
            catchError((error) => {
              this.logger.warn(
                `Failed to validate applicant ${applicantId}: ${error.message}`,
              );
              return of(null);
            }),
          ),
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Applicant validation error for ${applicantId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Handle new job created event (Requirement 5.3.1)
   * Instantly evaluate new job posts against active premium subscribers
   * and deliver real-time notifications to matching applicants
   */
  async handleJobCreated(
    event: IKafkaEvent<IJobCreatedPayload>,
  ): Promise<void> {
    const { payload, eventId } = event;

    this.logger.log(
      `Processing new job: ${payload.title} at ${payload.companyName}`,
    );

    // Build job match criteria from payload (using skill IDs for exact matching)
    const matchCriteria: IJobMatchCriteria = {
      jobId: payload.jobId,
      title: payload.title,
      requiredSkillIds: payload.criteria.requiredSkillIds || [],
      requiredSkillNames: payload.criteria.requiredSkillNames || [],
      location: payload.criteria.location,
      salaryMin: payload.criteria.salaryRange?.min,
      salaryMax: payload.criteria.salaryRange?.max,
      currency: payload.criteria.salaryRange?.currency || "USD",
      employmentType: this.mapEmploymentType(payload.criteria.employmentType),
      isFresherFriendly: payload.criteria.isFresherFriendly || false,
    };

    // Find all matching premium profiles
    const matchingProfiles =
      await this.searchProfileRepo.findMatchingProfiles(matchCriteria);

    this.logger.log(
      `Found ${matchingProfiles.length} matching profiles for job ${payload.jobId}`,
    );

    // Send notifications to each matching applicant
    for (const matchResult of matchingProfiles) {
      try {
        await this.sendJobMatchNotification({
          applicantId: matchResult.profile.applicantId,
          applicantEmail: matchResult.profile.applicantEmail,
          job: payload,
          matchScore: matchResult.matchScore,
          matchedCriteria: matchResult.matchedCriteria,
          sourceEventId: eventId,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send job notification to applicant ${matchResult.profile.applicantId}`,
          error.stack,
        );
      }
    }

    this.logger.log(
      `Job created notification processed for jobId: ${payload.jobId}, notified ${matchingProfiles.length} applicants`,
    );
  }

  /**
   * Map job payload employment type to schema EmploymentType
   */
  private mapEmploymentType(type: string): EmploymentType {
    const mapping: Record<string, EmploymentType> = {
      FULL_TIME: EmploymentType.FULL_TIME,
      PART_TIME: EmploymentType.PART_TIME,
      CONTRACT: EmploymentType.CONTRACT,
      INTERNSHIP: EmploymentType.INTERNSHIP,
      FRESHER: EmploymentType.FRESHER,
    };
    return mapping[type] || EmploymentType.FULL_TIME;
  }

  /**
   * Sync search profile from Kafka event to local projection
   * Used for CQRS pattern - keeps local copy for fast matching queries
   */
  private async syncSearchProfileProjection(params: {
    profileId: string;
    applicantId: string;
    searchProfile: ISearchProfilePayload;
    isPremium: boolean;
    premiumExpiresAt?: Date;
    applicantEmail?: string;
  }): Promise<void> {
    const {
      profileId,
      applicantId,
      searchProfile,
      isPremium,
      premiumExpiresAt,
      applicantEmail,
    } = params;

    try {
      await this.searchProfileRepo.upsertByProfileId(profileId, {
        profileId,
        applicantId,
        applicantEmail,
        desiredRoles: searchProfile.desiredRoles || [],
        skillIds: searchProfile.skillIds || [],
        skillNames: searchProfile.skillNames || [],
        experienceYears: searchProfile.experienceYears || 0,
        desiredLocations: searchProfile.desiredLocations || [],
        expectedSalary: searchProfile.expectedSalary
          ? {
              min: searchProfile.expectedSalary.min,
              max: searchProfile.expectedSalary.max,
              currency: searchProfile.expectedSalary.currency || "USD",
            }
          : { min: 0, currency: "USD" },
        employmentTypes: (searchProfile.employmentTypes || []).map((t) =>
          this.mapEmploymentType(t),
        ),
        isActive: searchProfile.isActive ?? true,
        isPremium,
        premiumExpiresAt,
      });

      this.logger.log(
        `Synced search profile projection: ${profileId} (premium: ${isPremium})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync search profile projection: ${profileId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send job match notification to a premium applicant
   */
  private async sendJobMatchNotification(params: {
    applicantId: string;
    applicantEmail?: string;
    job: IJobCreatedPayload;
    matchScore: number;
    matchedCriteria: {
      skillIds: string[];
      skillNames: string[];
      location: boolean;
      salary: boolean;
      employmentType: boolean;
      roleMatch: boolean;
    };
    sourceEventId: string;
  }): Promise<void> {
    // Validate applicant exists before sending notification
    const applicant = await this.validateAndGetApplicant(params.applicantId);
    if (!applicant) {
      this.logger.warn(
        `[SKIP] Applicant not found: ${params.applicantId}, skipping job match notification`,
      );
      return;
    }

    const notificationId = uuidv4();
    const title = "New Job Match Found!";
    const message = `A new job "${params.job.title}" at ${params.job.companyName} matches your search profile! Match score: ${params.matchScore}%`;

    // Use validated email from applicant-service
    const recipientEmail = applicant.email;

    // Create notification record (with validated email)
    await this.notificationRepository.create({
      notificationId,
      recipientId: params.applicantId,
      recipientType: "APPLICANT",
      recipientEmail,
      type: NotificationType.JA_NEW_MATCHING_JOB,
      title,
      message,
      data: {
        jobId: params.job.jobId,
        jobTitle: params.job.title,
        companyId: params.job.companyId,
        companyName: params.job.companyName,
        location: params.job.criteria.location,
        salaryRange: params.job.criteria.salaryRange,
        employmentType: params.job.criteria.employmentType,
        matchScore: params.matchScore,
        matchedCriteria: params.matchedCriteria,
      },
      deliveries: [
        {
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
        ...(recipientEmail
          ? [
              {
                channel: NotificationChannel.EMAIL,
                status: NotificationStatus.PENDING,
                retryCount: 0,
              },
            ]
          : []),
      ],
      priority: params.matchScore >= 70 ? "HIGH" : "NORMAL",
      sourceEventId: params.sourceEventId,
    });

    // Publish to Redis for real-time WebSocket delivery
    await this.publishRealtimeNotification(
      params.applicantId,
      notificationId,
      NotificationType.JA_NEW_MATCHING_JOB,
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
      `Job match notification sent to applicant: ${params.applicantId} (score: ${params.matchScore}%)`,
    );
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
      if (match.matchedEntityType === "APPLICANT") {
        try {
          await this.createAndSendMatchNotification({
            recipientId: match.matchedEntityId,
            recipientType: "APPLICANT",
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
    const { payload } = event;

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

    // Validate applicant exists before processing
    const applicant = await this.validateAndGetApplicant(payload.applicantId);
    if (!applicant) {
      this.logger.warn(
        `[SKIP] Applicant not found: ${payload.applicantId}, skipping premium activation`,
      );
      return;
    }

    this.logger.log(
      `Processing JA premium subscription: ${payload.applicantId}`,
    );

    const notificationId = uuidv4();
    const title = "Premium Subscription Activated!";
    const message = `Congratulations! Your premium subscription is now active until ${new Date(payload.endDate).toLocaleDateString()}. Enjoy enhanced job matching features!`;

    // Create notification record (with validated email)
    await this.notificationRepository.create({
      notificationId,
      recipientId: payload.applicantId,
      recipientType: "APPLICANT",
      recipientEmail: applicant.email,
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
      priority: "HIGH",
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

    // Update premium status in search profile projection
    if (payload.searchProfile) {
      await this.syncSearchProfileProjection({
        profileId: payload.searchProfile.profileId,
        applicantId: payload.applicantId,
        searchProfile: payload.searchProfile,
        isPremium: true,
        premiumExpiresAt: new Date(payload.endDate),
        applicantEmail: applicant.email,
      });
    } else {
      // Just update premium status if we have a projection already
      await this.searchProfileRepo.updatePremiumStatus(
        payload.applicantId,
        true,
        new Date(payload.endDate),
      );
    }

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

    // Validate applicant exists before processing
    const applicant = await this.validateAndGetApplicant(payload.applicantId);
    if (!applicant) {
      this.logger.warn(
        `[SKIP] Applicant not found: ${payload.applicantId}, skipping premium expiry`,
      );
      return;
    }

    this.logger.log(`Processing JA premium expiration: ${payload.applicantId}`);

    const notificationId = uuidv4();
    const title = "Premium Subscription Expired";
    const message = `Your premium subscription has expired on ${new Date(payload.expiredAt).toLocaleDateString()}. Renew now to continue enjoying enhanced job matching features!`;

    // Create notification record (with validated email)
    await this.notificationRepository.create({
      notificationId,
      recipientId: payload.applicantId,
      recipientType: "APPLICANT",
      recipientEmail: applicant.email,
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
      priority: "HIGH",
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

    // Update premium status to false in search profile projection
    await this.searchProfileRepo.updatePremiumStatus(
      payload.applicantId,
      false,
    );

    this.logger.log(
      `JA premium expiration notification sent: ${payload.applicantId}`,
    );
  }

  /**
   * Handle JA search profile created event
   * Sync profile to projection and send confirmation notification
   */
  async handleJASearchProfileCreated(
    event: IKafkaEvent<ISearchProfileCreatedPayload>,
  ): Promise<void> {
    const { payload, eventId } = event;

    if (payload.userType !== "APPLICANT") {
      this.logger.log(
        `Skipping non-applicant profile creation: ${payload.userId}`,
      );
      return;
    }

    // Validate applicant exists before processing
    const applicant = await this.validateAndGetApplicant(payload.userId);
    if (!applicant) {
      this.logger.warn(
        `[SKIP] Applicant not found: ${payload.userId}, skipping profile creation`,
      );
      return;
    }

    this.logger.log(`Processing JA profile creation: ${payload.userId}`);

    // Sync the search profile to our projection for matching (with email)
    await this.syncSearchProfileProjection({
      profileId: payload.profileId,
      applicantId: payload.userId,
      searchProfile: payload.searchProfile,
      isPremium: payload.isPremium,
      applicantEmail: applicant.email,
    });

    const notificationId = uuidv4();
    const title = "Search Profile Created!";
    const message = payload.isPremium
      ? "Your search profile has been created. As a premium member, you'll receive instant notifications when matching jobs are posted!"
      : "Your search profile has been created. Upgrade to premium to receive instant job match notifications!";

    // Create notification record (with validated email)
    await this.notificationRepository.create({
      notificationId,
      recipientId: payload.userId,
      recipientType: "APPLICANT",
      recipientEmail: applicant.email,
      type: NotificationType.JA_PROFILE_CREATED,
      title,
      message,
      data: {
        profileId: payload.profileId,
        isPremium: payload.isPremium,
      },
      deliveries: [
        {
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
      ],
      priority: "NORMAL",
      sourceEventId: eventId,
    });

    // Publish to Redis for real-time WebSocket delivery
    await this.publishRealtimeNotification(
      payload.userId,
      notificationId,
      NotificationType.JA_PROFILE_CREATED,
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

    this.logger.log(`JA profile creation notification sent: ${payload.userId}`);
  }

  /**
   * Handle JA search profile updated event
   * Sync profile to projection and send confirmation notification
   */
  async handleJASearchProfileUpdated(
    event: IKafkaEvent<ISearchProfileUpdatedPayload>,
  ): Promise<void> {
    const { payload, eventId } = event;

    // Only process if this is an APPLICANT profile update
    if (payload.userType !== "APPLICANT") {
      this.logger.log(
        `Skipping non-applicant profile update: ${payload.userId}`,
      );
      return;
    }

    // Validate applicant exists before processing
    const applicant = await this.validateAndGetApplicant(payload.userId);
    if (!applicant) {
      this.logger.warn(
        `[SKIP] Applicant not found: ${payload.userId}, skipping profile update`,
      );
      return;
    }

    this.logger.log(`Processing JA profile update: ${payload.userId}`);

    // Sync the search profile to our projection for matching (requirement 3.3.1)
    await this.syncSearchProfileProjection({
      profileId: payload.profileId,
      applicantId: payload.userId,
      searchProfile: payload.searchProfile,
      isPremium: payload.isPremium,
      applicantEmail: applicant.email,
    });

    const notificationId = uuidv4();
    const changedFieldsText = payload.changedFields.join(", ");
    const title = "Profile Updated Successfully";
    const message = `Your search profile has been updated. Changed fields: ${changedFieldsText}. We'll notify you when new matching jobs are found!`;

    // Create notification record (with validated email)
    await this.notificationRepository.create({
      notificationId,
      recipientId: payload.userId,
      recipientType: "APPLICANT",
      recipientEmail: applicant.email,
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
      priority: "NORMAL",
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

    this.logger.log(`JA profile update notification sent: ${payload.userId}`);
  }

  /**
   * Create and send a job match notification
   */
  private async createAndSendMatchNotification(params: {
    recipientId: string;
    recipientType: "APPLICANT" | "COMPANY";
    companyId: string;
    matchScore: number;
    matchedCriteria: {
      skillIds: string[];
      skillNames: string[];
      location: boolean;
      salary: boolean;
      experience: boolean;
    };
    sourceEventId: string;
  }): Promise<void> {
    // Validate applicant exists before sending notification (only for APPLICANT recipients)
    let recipientEmail = "";
    if (params.recipientType === "APPLICANT") {
      const applicant = await this.validateAndGetApplicant(params.recipientId);
      if (!applicant) {
        this.logger.warn(
          `[SKIP] Applicant not found: ${params.recipientId}, skipping match notification`,
        );
        return;
      }
      recipientEmail = applicant.email;
    }

    const notificationId = uuidv4();
    const title = "New Job Match Found!";
    const message = `You've been matched with a company based on your profile! Match score: ${params.matchScore}%`;

    // Create notification record (with validated email)
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
      priority: "NORMAL",
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

      await this.notificationPubSub.publishNotification(
        userId,
        realtimeNotification,
      );
      this.logger.log(`Published real-time notification for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish real-time notification: ${error.message}`,
      );
      // Don't throw - real-time delivery failure shouldn't block the rest
    }
  }

  /**
   * Map backend NotificationType to frontend type
   */
  private mapToFrontendType(type: NotificationType): FrontendNotificationType {
    switch (type) {
      case NotificationType.JA_NEW_MATCHING_JOB:
        return "JobMatchingAlert";
      case NotificationType.JA_PREMIUM_ACTIVATED:
        return "ApplicationAlert_Pass";
      case NotificationType.JA_PREMIUM_EXPIRING:
        return "ApplicationAlert_Reject";
      case NotificationType.JA_PREMIUM_EXPIRED:
        return "PremiumExpiredAlert";
      case NotificationType.JA_PROFILE_UPDATED:
        return "ProfileUpdateAlert";
      default:
        return "JobMatchingAlert";
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
      ${data?.matchScore ? `<p class="match-score">Match Score: ${data.matchScore}%</p>` : ""}
      ${
        data?.matchedCriteria
          ? `
      <div class="criteria">
        <h3>Matched Criteria:</h3>
        <div class="criteria-item">Skills: ${data.matchedCriteria.skillNames?.join(", ") || "N/A"}</div>
        <div class="criteria-item">Location: ${data.matchedCriteria.location ? "Yes" : "No"}</div>
        <div class="criteria-item">Salary: ${data.matchedCriteria.salary ? "Yes" : "No"}</div>
        <div class="criteria-item">Experience: ${data.matchedCriteria.experience ? "Yes" : "No"}</div>
      </div>
      `
          : ""
      }
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
      text += "\n\nMatched Criteria:";
      text += `\n- Skills: ${data.matchedCriteria.skillNames?.join(", ") || "N/A"}`;
      text += `\n- Location: ${data.matchedCriteria.location ? "Yes" : "No"}`;
      text += `\n- Salary: ${data.matchedCriteria.salary ? "Yes" : "No"}`;
      text += `\n- Experience: ${data.matchedCriteria.experience ? "Yes" : "No"}`;
    }

    text +=
      "\n\n---\nThis is an automated message from DEVision Job Matching System.";

    return text;
  }

  // ==================== TCP Message Handlers (INotificationService) ====================

  /**
   * Get notifications for a user (paginated)
   */
  async getNotifications(
    params: GetNotificationsDto,
  ): Promise<NotificationListResponseDto> {
    const { recipientId, limit = 20, offset = 0, unreadOnly = false } = params;

    const notifications = await this.notificationRepository.findByRecipient(
      recipientId,
      { limit, offset, unreadOnly },
    );

    const unreadCount =
      await this.notificationRepository.countUnread(recipientId);

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
