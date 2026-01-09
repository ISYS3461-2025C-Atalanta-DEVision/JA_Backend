import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
  Inject,
} from "@nestjs/common";
import { WorkHistoryRepository, WorkHistory } from "../../../libs/dals/mongodb";
import {
  CreateWorkHistoryDto,
  UpdateWorkHistoryDto,
  WorkHistoryResponseDto,
} from "../apis/work-history/dtos";
import { IWorkHistoryService } from "../interfaces";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, timeout, catchError, of } from "rxjs";
import { FilterBuilder } from "@common/filters";
import { FilterItem, SortItem } from "@common/dtos/filter.dto";
import { WORK_HISTORY_FILTER_CONFIG } from "../../../configs";

@Injectable()
export class WorkHistoryService implements IWorkHistoryService {
  private readonly logger = new Logger(WorkHistoryService.name);
  private readonly filterBuilder = new FilterBuilder<WorkHistory>(
    WORK_HISTORY_FILTER_CONFIG,
  );

  constructor(
    private readonly workHistoryRepository: WorkHistoryRepository,
    @Inject("APPLICANT_SERVICE") private readonly applicantClient: ClientProxy,
  ) { }

  async create(
    createDto: CreateWorkHistoryDto,
    applicantId: string,
  ): Promise<WorkHistoryResponseDto> {
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

      const workHistory = await this.workHistoryRepository.create({
        ...createDto,
        applicantId: applicantId,
      });

      return this.toResponseDto(workHistory);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000)
        throw new ConflictException(
          "WorkHistory with this name already exists",
        );
      throw new InternalServerErrorException("Failed to create workHistory");
    }
  }

  async findByApplicantId(
    applicantId: string,
  ): Promise<WorkHistoryResponseDto[]> {
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

      const workHistories = await this.workHistoryRepository.findMany({
        applicantId: applicantId,
      });

      if (!workHistories.length) {
        return [];
      }

      return workHistories.map((wh) => this.toResponseDto(wh));
    } catch (error) {
      this.logger.error(
        `Find workHistory failed for Applicant ${applicantId}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to find workHistory");
    }
  }

  async findById(id: string): Promise<WorkHistoryResponseDto> {
    try {
      const workHistory = await this.workHistoryRepository.findById(id);
      if (!workHistory) {
        throw new NotFoundException(`WorkHistory with ID ${id} not found`);
      }
      return this.toResponseDto(workHistory);
    } catch (error) {
      this.logger.error(`Find workHistory failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to find workHistory");
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterItem[],
    sorting?: SortItem[],
  ): Promise<{
    data: WorkHistoryResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query = this.filterBuilder.buildQuery(filters);
      const sort = this.filterBuilder.buildSort(sorting);

      const [workHistories, total] =
        await this.workHistoryRepository.findManyAndCount(query, {
          skip,
          limit,
          sort,
        });

      return {
        data: workHistories.map((c) => this.toResponseDto(c)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Find all work-histories failed`, error.stack);
      throw new InternalServerErrorException("Failed to fetch work-histories");
    }
  }

  async update(
    id: string,
    updateDto: UpdateWorkHistoryDto,
  ): Promise<WorkHistoryResponseDto> {
    try {
      const workHistory = await this.workHistoryRepository.findById(id);
      if (!workHistory) {
        throw new NotFoundException(`WorkHistory with ID ${id} not found`);
      }

      const updated = await this.workHistoryRepository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update workHistory failed for ${id}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      if (error.code === 11000)
        throw new ConflictException("Name already in use");
      throw new InternalServerErrorException("Failed to update workHistory");
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const workHistory = await this.workHistoryRepository.findById(id);
      if (!workHistory) {
        throw new NotFoundException(`WorkHistory with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.workHistoryRepository.delete(id);
      return {
        success: true,
        message: "WorkHistory deleted successfully",
      };
    } catch (error) {
      this.logger.error(`Delete workHistory failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to delete workHistory");
    }
  }

  private toResponseDto(workHistory: WorkHistory): WorkHistoryResponseDto {
    return {
      id: workHistory._id.toString(),
      applicantId: workHistory.applicantId.toString(),
      companyName: workHistory.companyName,
      title: workHistory.title,
      description: workHistory.description,
      startDate: workHistory.startDate,
      endDate: workHistory.endDate,
      skillCategories: workHistory.skillCategories.map((id) => id.toString()),
      createdAt: workHistory.createdAt,
      updatedAt: workHistory.updatedAt,
    };
  }
}
