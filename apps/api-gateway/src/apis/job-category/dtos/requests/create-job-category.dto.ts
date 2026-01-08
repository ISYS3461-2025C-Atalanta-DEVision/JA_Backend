import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateJobCategoryDto {
  @ApiProperty({
    example: "Software Development",
    description: "Job category name",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: "Jobs related to software development",
    description: "Category description",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: "code-icon",
    description: "Icon identifier",
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;
}
