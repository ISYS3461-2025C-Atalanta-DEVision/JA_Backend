import { WorkHistoryResponseDto } from "../apis/work-history/dtos";
import {
  CreateWorkHistoryDto,
  UpdateWorkHistoryDto,
} from "../apis/work-history/dtos";
import { FilterItem, SortItem } from "@common/dtos/filter.dto";

export interface IWorkHistoryService {
  create(
    createDto: CreateWorkHistoryDto,
    applicantId: string,
  ): Promise<WorkHistoryResponseDto>;
  findById(id: string): Promise<WorkHistoryResponseDto>;
  findByApplicantId(applicantId: string): Promise<WorkHistoryResponseDto[]>;
  findAll(
    page: number,
    limit: number,
    filters?: FilterItem[],
    sorting?: SortItem[],
  ): Promise<{
    data: WorkHistoryResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(
    id: string,
    updateDto: UpdateWorkHistoryDto,
  ): Promise<WorkHistoryResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;
}
