import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { ApplicantRepository, Applicant } from "../../../libs/dals/mongodb";
import {
  CreateApplicantDto,
  UpdateApplicantDto,
  ApplicantResponseDto,
} from "../apis/applicant/dtos";
import { IApplicantService } from "../interfaces";
import { MailerService } from "@libs/mailer";
import { generateEmailVerificationToken } from "@libs/auth";
import { AddEmailHashDto } from "../apis/applicant/dtos/requests/add-email-verification-hash";
import { createHash } from "crypto";
import { FilterBuilder } from "@common/filters";
import { FilterItem, SortItem } from "@common/dtos/filter.dto";
import { APPLICANT_FILTER_CONFIG } from "../../../configs";
import { KafkaService } from "@kafka/kafka.service";
import { TOPIC_PROFILE_JA_APPLICANT_UPDATED } from "@kafka/constants";
import { IApplicantProfileUpdatedPayload } from "@kafka/interfaces";

@Injectable()
export class ApplicantService implements IApplicantService {
  private readonly logger = new Logger(ApplicantService.name);
  private readonly filterBuilder = new FilterBuilder<Applicant>(
    APPLICANT_FILTER_CONFIG,
  );

  constructor(
    private readonly applicantRepository: ApplicantRepository,
    private readonly mailerService: MailerService,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(createDto: CreateApplicantDto): Promise<ApplicantResponseDto> {
    try {
      const existing = await this.applicantRepository.findByEmail(
        createDto.email,
      );
      if (existing) {
        throw new ConflictException("Applicant with this email already exists");
      }

      const applicant = await this.applicantRepository.create(createDto);
      this.sendVerificationEmail(applicant._id.toString());

      return this.toResponseDto(applicant);
    } catch (error) {
      this.logger.error(
        `Create applicant failed for ${createDto.email}`,
        error.stack,
      );
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000)
        throw new ConflictException("Applicant with this email already exists");
      throw new InternalServerErrorException("Failed to create applicant");
    }
  }

  async findById(id: string): Promise<ApplicantResponseDto> {
    try {
      const applicant = await this.applicantRepository.findById(id);
      if (!applicant) {
        throw new NotFoundException(`Applicant with ID ${id} not found`);
      }
      return this.toResponseDto(applicant);
    } catch (error) {
      this.logger.error(`Find applicant failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to find applicant");
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterItem[],
    sorting?: SortItem[],
  ): Promise<{
    data: ApplicantResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query = this.filterBuilder.buildQuery(filters);
      const sort = this.filterBuilder.buildSort(sorting);

      const [applicants, total] =
        await this.applicantRepository.findManyAndCount(query, {
          skip,
          limit,
          sort,
        });

      return {
        data: applicants.map((c) => this.toResponseDto(c)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Find all applicants failed`, error.stack);
      throw new InternalServerErrorException("Failed to fetch applicants");
    }
  }

  async update(
    id: string,
    updateDto: UpdateApplicantDto,
  ): Promise<ApplicantResponseDto> {
    try {
      const applicant = await this.applicantRepository.findById(id);
      if (!applicant) {
        throw new NotFoundException(`Applicant with ID ${id} not found`);
      }

      if (updateDto.email && updateDto.email !== applicant.email) {
        const existing = await this.applicantRepository.findByEmail(
          updateDto.email,
        );
        if (existing) {
          throw new ConflictException("Email already in use");
        }
      }

      // Track changes for Kafka event
      const changedFields = this.detectProfileChanges(applicant, updateDto);
      const previousCountry = changedFields.includes("country")
        ? applicant.country
        : undefined;

      const updated = await this.applicantRepository.update(id, updateDto);

      // Publish Kafka event if skills or country changed
      if (changedFields.length > 0) {
        await this.publishProfileUpdateEvent(
          id,
          updated,
          changedFields,
          previousCountry,
        );
      }

      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update applicant failed for ${id}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      if (error.code === 11000)
        throw new ConflictException("Email already in use");
      throw new InternalServerErrorException("Failed to update applicant");
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const applicant = await this.applicantRepository.findById(id);
      if (!applicant) {
        throw new NotFoundException(`Applicant with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.applicantRepository.update(id, { isActive: false });
      return {
        success: true,
        message: "Applicant deleted successfully",
      };
    } catch (error) {
      this.logger.error(`Delete applicant failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to delete applicant");
    }
  }

  async sendVerificationEmail(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const applicant = await this.applicantRepository.findById(id);
      if (!applicant) {
        throw new NotFoundException(`Applicant with ID ${id} not found`);
      }

      const { rawToken, hashedToken, expires } =
        generateEmailVerificationToken();

      await this.mailerService.sendEmailVerification(applicant.email, rawToken);

      applicant.emailVerificationToken = hashedToken;
      applicant.emailVerificationTokenExpires = expires;

      const updateDto: AddEmailHashDto = {
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpires: expires,
      };

      await this.applicantRepository.update(id, updateDto);

      return {
        success: true,
        message: `Email successfully sent to ${applicant.email}`,
      };
    } catch (error) {
      this.logger.error(
        `Cannot activate applicant email failed for ${id}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to activate email");
    }
  }

  async verifyEmail(
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const hashedToken = createHash("sha256").update(token).digest("hex");

      const user = await this.applicantRepository.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new NotFoundException(`Applicant account not found`);
      }

      const updateDto: AddEmailHashDto = {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      };

      await this.applicantRepository.update(user._id.toString(), updateDto);

      return {
        success: true,
        message: `Email successfully activated for ${user._id.toString()}`,
      };
    } catch (error) {
      this.logger.error(`Cannot activate applicant email`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to activate email");
    }
  }

  /**
   * Set premium status for an applicant (internal service use only)
   * Called by notification-service when subscription status changes
   */
  async setPremiumStatus(
    applicantId: string,
    isPremium: boolean,
  ): Promise<{ success: boolean }> {
    try {
      const applicant = await this.applicantRepository.findById(applicantId);
      if (!applicant) {
        this.logger.warn(
          `setPremiumStatus: Applicant ${applicantId} not found`,
        );
        return { success: false };
      }

      await this.applicantRepository.update(applicantId, { isPremium });
      this.logger.log(
        `Set isPremium=${isPremium} for applicant ${applicantId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `setPremiumStatus failed for ${applicantId}`,
        error.stack,
      );
      return { success: false };
    }
  }

  /**
   * Detect changes in skills or country fields
   */
  private detectProfileChanges(
    existing: Applicant,
    updateDto: UpdateApplicantDto,
  ): ("skillCategories" | "country")[] {
    const changedFields: ("skillCategories" | "country")[] = [];

    // Check skillCategories change
    if (updateDto.skillCategories !== undefined) {
      const oldSkills = (existing.skillCategories || []).sort().join(",");
      const newSkills = (updateDto.skillCategories || []).sort().join(",");
      if (oldSkills !== newSkills) {
        changedFields.push("skillCategories");
      }
    }

    // Check country change
    if (
      updateDto.country !== undefined &&
      existing.country !== updateDto.country
    ) {
      changedFields.push("country");
    }

    return changedFields;
  }

  /**
   * Publish Kafka event for profile updates (skills/country changes)
   */
  private async publishProfileUpdateEvent(
    applicantId: string,
    applicant: Applicant,
    changedFields: ("skillCategories" | "country")[],
    previousCountry?: string,
  ): Promise<void> {
    try {
      const payload: IApplicantProfileUpdatedPayload = {
        applicantId,
        changedFields,
        skillCategories: applicant.skillCategories,
        country: applicant.country,
        previousCountry,
        isPremium: applicant.isPremium,
      };

      await this.kafkaService.publish(
        TOPIC_PROFILE_JA_APPLICANT_UPDATED,
        "profile.ja.applicant.updated",
        payload,
        { key: applicantId },
      );

      this.logger.log(
        `Published profile update event for applicant ${applicantId}, changed: ${changedFields.join(", ")}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish profile update event for applicant ${applicantId}`,
        error.stack,
      );
      // Don't throw - profile was saved, Kafka is non-critical
    }
  }

  private toResponseDto(applicant: Applicant): ApplicantResponseDto {
    return {
      id: applicant._id.toString(),
      name: applicant.name,
      email: applicant.email,
      objectiveSummary: applicant.objectiveSummary,
      phone: applicant.phone,
      highestEducation: applicant.highestEducation,
      country: applicant.country,
      address: applicant.address,
      addressProvinceCode: applicant.addressProvinceCode,
      addressProvinceName: applicant.addressProvinceName,
      avatarUrl: applicant.avatarUrl,
      isActive: applicant.isActive,
      isPremium: applicant.isPremium,
      skillCategories: applicant.skillCategories,
      createdAt: applicant.createdAt,
      updatedAt: applicant.updatedAt,
    };
  }
}
