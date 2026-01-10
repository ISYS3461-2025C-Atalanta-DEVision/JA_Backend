export class ApplicantResponseDto {
  id: string;
  name: string;
  email: string;
  objectiveSummary?: string;
  phone?: string;
  country: string;
  address?: string;
  addressProvinceCode?: string;
  addressProvinceName?: string;
  avatarUrl?: string;
  isActive: boolean;
  isPremium: boolean;
  skillCategories?: string[];
  createdAt: Date;
  updatedAt: Date;
}
