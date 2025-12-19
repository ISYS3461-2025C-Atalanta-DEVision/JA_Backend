import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateJobCategoryDto {
  @ApiProperty({ example: 'Software Development', description: 'Job category name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Jobs related to software development', description: 'Category description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'code-icon', description: 'Icon identifier', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ example: true, description: 'Whether the category is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
