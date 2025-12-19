import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'TypeScript', description: 'Skill name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Job category ID this skill belongs to' })
  @IsNotEmpty()
  @IsString()
  jobCategoryId: string;

  @ApiProperty({ example: 'A typed superset of JavaScript', description: 'Skill description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'typescript-icon', description: 'Icon identifier', required: false })
  @IsOptional()
  @IsString()
  icon?: string;
}
