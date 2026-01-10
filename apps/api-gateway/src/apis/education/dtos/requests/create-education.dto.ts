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
import { EducationLevel } from "./education.enums";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateEducationDto {
  @ApiProperty({
    description:
      "Level of education. Allowed values: HighSchool, Bachelor, Master, PhD, NoGiven",
    enum: EducationLevel,
    example: EducationLevel.Bachelor,
  })
  @IsNotEmpty()
  @IsEnum(EducationLevel)
  levelStudy: EducationLevel;

  @ApiProperty({
    description: "Major or field of study",
    example: "Computer Science",
  })
  @IsNotEmpty()
  @IsString()
  major: string;

  @ApiPropertyOptional({
    description: "Name of the educational institution",
    example: "Hanoi University of Science and Technology",
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
    example: "2019-09-01",
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({
    description: "End date of the education period (ISO 8601)",
    example: "2023-06-30",
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
