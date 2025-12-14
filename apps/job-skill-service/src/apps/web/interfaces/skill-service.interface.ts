import { SkillResponseDto } from '../apis/skill/dtos';
import { CreateSkillDto, UpdateSkillDto } from '../apis/skill/dtos';

export interface ISkillService {
  create(createDto: CreateSkillDto): Promise<SkillResponseDto>;
  findById(id: string): Promise<SkillResponseDto>;
  findAll(page: number, limit: number): Promise<{
    data: SkillResponseDto[];
    total: number;
    page: number;
    limit: number;
  }>;
  findByCategory(categoryId: string): Promise<SkillResponseDto[]>;
  update(id: string, updateDto: UpdateSkillDto): Promise<SkillResponseDto>;
  softDelete(id: string): Promise<{ success: boolean; message: string }>;
  hardDelete(id: string): Promise<{ success: boolean; message: string }>;
}
