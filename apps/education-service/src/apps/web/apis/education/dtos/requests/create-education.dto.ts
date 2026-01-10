import { EducationLevel } from "apps/education-service/src/libs/dals/mongodb/schemas/education.schema";
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  Max,
} from "class-validator";

export class CreateEducationDto {
  @IsNotEmpty()
  @IsString()
  applicantId: string;

  @IsNotEmpty()
  @IsEnum(EducationLevel)
  levelStudy: EducationLevel;

  @IsNotEmpty()
  @IsString()
  major: string;

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
