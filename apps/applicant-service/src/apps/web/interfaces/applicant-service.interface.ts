import { ApplicantResponseDto } from "../apis/applicant/dtos";
import { CreateApplicantDto, UpdateApplicantDto } from "../apis/applicant/dtos";
import { FilterItem, SortItem } from "@common/dtos/filter.dto";

export interface IApplicantService {
  create(createDto: CreateApplicantDto): Promise<ApplicantResponseDto>;
  findById(id: string): Promise<ApplicantResponseDto>;
  findAll(
    page: number,
    limit: number,
    filters?: FilterItem[],
    sorting?: SortItem[],
  ): Promise<{
    data: ApplicantResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(
    id: string,
    updateDto: UpdateApplicantDto,
  ): Promise<ApplicantResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;
  sendVerificationEmail(
    id: string,
  ): Promise<{ success: boolean; message: string }>;
  verifyEmail(token: string): Promise<{ success: boolean; message: string }>;
  setPremiumStatus(
    applicantId: string,
    isPremium: boolean,
  ): Promise<{ success: boolean }>;
}
