import { JobCategoryResponseDto } from '../apis/job-category/dtos';
import { CreateJobCategoryDto, UpdateJobCategoryDto } from '../apis/job-category/dtos';

export interface IJobCategoryService {
  create(createDto: CreateJobCategoryDto): Promise<JobCategoryResponseDto>;
  findById(id: string): Promise<JobCategoryResponseDto>;
  findAll(page: number, limit: number): Promise<{
    data: JobCategoryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }>;
  update(id: string, updateDto: UpdateJobCategoryDto): Promise<JobCategoryResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;
  hardDelete(id: string): Promise<{ success: boolean; message: string }>;
}
