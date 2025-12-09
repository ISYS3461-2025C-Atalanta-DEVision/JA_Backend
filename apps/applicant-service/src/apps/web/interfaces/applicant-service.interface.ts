import { ApplicantResponseDto } from '../apis/applicant/dtos';
import { CreateApplicantDto, UpdateApplicantDto } from '../apis/applicant/dtos';

export interface IApplicantService {
  create(createDto: CreateApplicantDto): Promise<ApplicantResponseDto>;
  findById(id: string): Promise<ApplicantResponseDto>;
  findAll(page: number, limit: number): Promise<{
    data: ApplicantResponseDto[];
    total: number;
    page: number;
    limit: number;
  }>;
  update(id: string, updateDto: UpdateApplicantDto): Promise<ApplicantResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;
}
