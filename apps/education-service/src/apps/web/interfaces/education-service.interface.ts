import { EducationResponseDto } from "../apis/education/dtos";
import { CreateEducationDto, UpdateEducationDto } from "../apis/education/dtos";
import { FilterItem, SortItem } from "@common/dtos/filter.dto";

export interface IEducationService {
  create(
    createDto: CreateEducationDto,
    applicantId: string,
  ): Promise<EducationResponseDto>;
  findByApplicantId(applicantId: string): Promise<EducationResponseDto[]>;
  findById(id: string): Promise<EducationResponseDto>;
  findAll(
    page: number,
    limit: number,
    filters?: FilterItem[],
    sorting?: SortItem[],
  ): Promise<{
    data: EducationResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(
    id: string,
    updateDto: UpdateEducationDto,
  ): Promise<EducationResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;
}
