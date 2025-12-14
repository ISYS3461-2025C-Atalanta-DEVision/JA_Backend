export class SkillResponseDto {
  id: string;
  name: string;
  jobCategoryId: string;
  description?: string;
  icon?: string;
  createdBy?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
