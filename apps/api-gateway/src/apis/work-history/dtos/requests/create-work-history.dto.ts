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
    example: "Apple",
    description: "Name of the company ",
  })
  @IsNotEmpty()
  @IsString()
  companyName: string;

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
}
