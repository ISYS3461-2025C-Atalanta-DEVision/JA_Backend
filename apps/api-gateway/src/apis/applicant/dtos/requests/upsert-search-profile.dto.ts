import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export enum EmploymentType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP",
  FRESHER = "FRESHER",
}

export class SalaryRangeDto {
  @ApiProperty({ example: 1000, description: "Minimum expected salary" })
  @IsNumber()
  @Min(0)
  min: number;

  @ApiProperty({
    example: 3000,
    description: "Maximum expected salary",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;

  @ApiProperty({
    example: "USD",
    description: "Salary currency",
    default: "USD",
  })
  @IsString()
  currency: string;
}

export class UpsertSearchProfileDto {
  @ApiProperty({
    example: ["Software Engineer", "Backend Developer"],
    description: "Desired job roles/titles",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  desiredRoles?: string[];

  @ApiProperty({
    example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    description: "Skill IDs from job-skill-service",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillIds?: string[];

  @ApiProperty({
    example: ["React", "TypeScript"],
    description: "Cached skill names for display",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillNames?: string[];

  @ApiProperty({
    example: 3,
    description: "Years of experience",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiProperty({
    example: ["Ho Chi Minh", "Remote"],
    description: "Desired work locations",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  desiredLocations?: string[];

  @ApiProperty({
    type: SalaryRangeDto,
    description: "Expected salary range",
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryRangeDto)
  expectedSalary?: SalaryRangeDto;

  @ApiProperty({
    example: ["FULL_TIME", "CONTRACT"],
    enum: EmploymentType,
    isArray: true,
    description: "Desired employment types",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(EmploymentType, { each: true })
  employmentTypes?: EmploymentType[];

  @ApiProperty({
    example: true,
    description: "Whether profile is active",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
