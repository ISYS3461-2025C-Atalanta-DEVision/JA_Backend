import { AdminApplicantResponseDto } from '../apis/admin-applicant/dtos';
import { CreateAdminApplicantDto, UpdateAdminApplicantDto } from '../apis/admin-applicant/dtos';

export interface IAdminApplicantService {
  create(createDto: CreateAdminApplicantDto): Promise<AdminApplicantResponseDto>;
  findById(id: string): Promise<AdminApplicantResponseDto>;
  findAll(page: number, limit: number): Promise<{
    data: AdminApplicantResponseDto[];
    total: number;
    page: number;
    limit: number;
  }>;
  update(id: string, updateDto: UpdateAdminApplicantDto): Promise<AdminApplicantResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;
}
