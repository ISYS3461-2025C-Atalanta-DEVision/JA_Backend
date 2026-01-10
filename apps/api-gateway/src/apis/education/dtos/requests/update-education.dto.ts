import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { EducationLevel } from "./education.enums";

export class UpdateEducationDto {
  @ApiPropertyOptional({
    description: "Level of education",
    enum: EducationLevel,
    example: EducationLevel.Master,
  })
  @IsOptional()
  @IsEnum(EducationLevel)
  levelStudy?: EducationLevel;

  @ApiPropertyOptional({
    description: "Major or field of study",
    example: "Software Engineering",
  })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({
    description: "Name of the educational institution",
    example: "Vietnam National University",
  })
  @IsOptional()
  @IsString()
  schoolName?: string;

  @ApiPropertyOptional({
    description: "Grade Point Average (from 0-4)",
    minimum: 0,
    maximum: 100,
    example: 78,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  gpa?: number;

  @ApiPropertyOptional({
    description: "Start date of the education period (ISO 8601)",
    example: "2020-09-01",
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({
    description: "End date of the education period (ISO 8601)",
    example: "2024-06-30",
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
