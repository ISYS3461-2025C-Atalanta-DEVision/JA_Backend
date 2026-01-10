import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsArray, IsDateString } from "class-validator";

export class UpdateWorkHistoryDto {
  @ApiProperty({
    example: "Junior Backend Engineer",
    required: false,
    description: "Updated job title",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: "Apple",
    description: "Name of the company ",
    required: false,
  })
  @IsOptional()
  @IsString()
  companyName: string;

  @ApiProperty({
    example: "2024-07-01",
    required: false,
    description: "Updated employment start date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({
    example: "2025-03-01",
    required: false,
    description: "Updated employment end date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({
    example: "Led API design and database optimization",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ["66c1f3b2e8f4c1a9b1111111", "66c1f3b2e8f4c1a9b2222222"],
    required: false,
    description: "Updated skill category IDs (ObjectId as strings)",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillCategories?: string[];
}
