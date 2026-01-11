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

@Injectable()
export class ApplicantService implements IApplicantService {
  private readonly logger = new Logger(ApplicantService.name);
  private readonly filterBuilder = new FilterBuilder<Applicant>(
    APPLICANT_FILTER_CONFIG,
  );

  constructor(
    private readonly applicantRepository: ApplicantRepository,
    private readonly mailerService: MailerService,
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

      const updated = await this.applicantRepository.update(id, updateDto);
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
