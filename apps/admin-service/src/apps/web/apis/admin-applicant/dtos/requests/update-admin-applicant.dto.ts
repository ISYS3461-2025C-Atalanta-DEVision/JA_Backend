import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateAdminApplicantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
