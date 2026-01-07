import { WorkHistoryResponseDto } from '../apis/work-history/dtos';
import { CreateWorkHistoryDto, UpdateWorkHistoryDto } from '../apis/work-history/dtos';

export interface IWorkHistoryService {
  create(createDto: CreateWorkHistoryDto, applicantId: string): Promise<WorkHistoryResponseDto>;
  findById(id: string): Promise<WorkHistoryResponseDto>;
  findAll(page: number, limit: number): Promise<{
    data: WorkHistoryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }>;
  update(id: string, updateDto: UpdateWorkHistoryDto): Promise<WorkHistoryResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;

}
