import { JobCategoryResponseDto } from "../apis/job-category/dtos";
import {
  CreateJobCategoryDto,
  UpdateJobCategoryDto,
} from "../apis/job-category/dtos";
import { FilterItem, SortItem } from "@common/dtos/filter.dto";

export interface IJobCategoryService {
  create(createDto: CreateJobCategoryDto): Promise<JobCategoryResponseDto>;
  findById(id: string): Promise<JobCategoryResponseDto>;
  findAll(
    page: number,
    limit: number,
    filters?: FilterItem[],
    sorting?: SortItem[],
  ): Promise<{
    data: JobCategoryResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(
    id: string,
    updateDto: UpdateJobCategoryDto,
  ): Promise<JobCategoryResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;
  hardDelete(id: string): Promise<{ success: boolean; message: string }>;
}
