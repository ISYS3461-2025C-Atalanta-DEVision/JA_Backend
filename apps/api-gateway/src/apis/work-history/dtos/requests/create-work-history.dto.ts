import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateWorkHistoryDto {
  @ApiProperty({
    example: "SE Intern",
    description: "Job title",
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: "66c1f3b2e8f4c1a9b7654321",
    description: "Company ID (ObjectId as string)",
  })
  @IsNotEmpty()
  @IsString()
  companyId: string;

  @ApiProperty({
    example: "2024-06-01",
    description: "Employment start date (ISO 8601)",
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @ApiProperty({
    example: "2025-01-01",
    description: "Employment end date (ISO 8601)",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({
    example: "Worked on backend services using NestJS",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ["66c1f3b2e8f4c1a9b1111111", "66c1f3b2e8f4c1a9b2222222"],
    description: "Skill category IDs (ObjectId as strings)",
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillCategories?: string[];
}
