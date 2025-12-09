import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdminApplicantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
