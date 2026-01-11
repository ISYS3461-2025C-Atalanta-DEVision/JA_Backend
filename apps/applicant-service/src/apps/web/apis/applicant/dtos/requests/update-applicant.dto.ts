import { EducationLevel } from "apps/applicant-service/src/libs/dals";
import { IsEmail, IsOptional, IsString, IsBoolean, IsArray, IsEnum } from "class-validator";

export class UpdateApplicantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  objectiveSummary?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(EducationLevel)
  highestEducation?: EducationLevel;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // NOTE: isPremium removed for security - use applicant.setPremiumStatus TCP handler

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillCategories?: string[];
}
