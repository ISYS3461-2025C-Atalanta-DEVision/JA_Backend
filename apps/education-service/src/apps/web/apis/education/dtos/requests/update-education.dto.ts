import { EducationLevel } from "apps/education-service/src/libs/dals";
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
  Min,
  Max,
} from "class-validator";

export class UpdateEducationDto {
  @IsOptional()
  @IsEnum(EducationLevel)
  levelStudy?: EducationLevel;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  schoolName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  gpa?: number;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
