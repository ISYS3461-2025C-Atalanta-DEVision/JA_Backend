import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
  Inject,
} from "@nestjs/common";
import { EducationRepository, Education } from "../../../libs/dals/mongodb";
import {
  CreateEducationDto,
  UpdateEducationDto,
  EducationResponseDto,
} from "../apis/education/dtos";
import { IEducationService } from "../interfaces";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, timeout, catchError, of } from "rxjs";
import { FilterBuilder } from "@common/filters";
import { FilterItem, SortItem } from "@common/dtos/filter.dto";
import { EDUCATION_FILTER_CONFIG } from "../../../configs";

@Injectable()
export class EducationService implements IEducationService {
  private readonly logger = new Logger(EducationService.name);
  private readonly filterBuilder = new FilterBuilder<Education>(
    EDUCATION_FILTER_CONFIG,
  );

  constructor(
    private readonly educationRepository: EducationRepository,
    @Inject("APPLICANT_SERVICE") private readonly applicantClient: ClientProxy,
  ) { }

  async create(
    createDto: CreateEducationDto,
    applicantId: string,
  ): Promise<EducationResponseDto> {
    try {
      const applicant = await firstValueFrom(
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

      if (!applicant) {
        throw new NotFoundException(
          `Applicant with ID ${applicantId} not found`,
        );
      }

      const education = await this.educationRepository.create({
        ...createDto,
        applicantId: applicantId,
      });
      return this.toResponseDto(education);
    } catch (error) {
      this.logger.error(
        `Create education failed for applicant ${applicantId}`,
        error.stack,
      );
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000)
        throw new ConflictException("Education with this name already exists");
      throw new InternalServerErrorException("Failed to create education");
    }
  }

  async findByApplicantId(
    applicantId: string,
  ): Promise<EducationResponseDto[]> {
    try {
      const applicant = await firstValueFrom(
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

      if (!applicant) {
        throw new NotFoundException(
          `Applicant with ID ${applicantId} not found`,
        );
      }

      const educations = await this.educationRepository.findMany({
        applicantId: applicantId,
      });

      if (!educations.length) {
        return [];
      }

      return educations.map((wh) => this.toResponseDto(wh));
    } catch (error) {
      this.logger.error(
        `Find education failed for Applicant ${applicantId}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to find education ");
    }
  }

  async findById(id: string): Promise<EducationResponseDto> {
    try {
      const education = await this.educationRepository.findById(id);
      if (!education) {
        throw new NotFoundException(`Education with ID ${id} not found`);
      }
      return this.toResponseDto(education);
    } catch (error) {
      this.logger.error(`Find education failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to find education");
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterItem[],
    sorting?: SortItem[],
  ): Promise<{
    data: EducationResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query = this.filterBuilder.buildQuery(filters);
      const sort = this.filterBuilder.buildSort(sorting);

      const [educations, total] =
        await this.educationRepository.findManyAndCount(query, {
          skip,
          limit,
          sort,
        });

      return {
        data: educations.map((c) => this.toResponseDto(c)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Find all educations failed`, error.stack);
      throw new InternalServerErrorException("Failed to fetch educations");
    }
  }

  async update(
    id: string,
    updateDto: UpdateEducationDto,
  ): Promise<EducationResponseDto> {
    try {
      const education = await this.educationRepository.findById(id);
      if (!education) {
        throw new NotFoundException(`Education with ID ${id} not found`);
      }

      const updated = await this.educationRepository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update education failed for ${id}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      if (error.code === 11000)
        throw new ConflictException("Name already in use");
      throw new InternalServerErrorException("Failed to update education");
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const education = await this.educationRepository.findById(id);
      if (!education) {
        throw new NotFoundException(`Education with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.educationRepository.delete(id);
      return {
        success: true,
        message: "Education deleted successfully",
      };
    } catch (error) {
      this.logger.error(`Delete education failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to delete education");
    }
  }

  private toResponseDto(education: Education): EducationResponseDto {
    return {
      id: education._id.toString(),
      applicantId: education.applicantId.toString(),
      levelStudy: education.levelStudy,
      major: education.major,
      schoolName: education.schoolName,
      gpa: education.gpa,
      startDate: education.startDate,
      endDate: education.endDate,
      createdAt: education.createdAt,
      updatedAt: education.updatedAt,
    };
  }
}
