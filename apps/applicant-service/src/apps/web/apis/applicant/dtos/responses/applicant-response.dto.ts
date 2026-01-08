export class ApplicantResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  address?: string;
  addressProvinceCode?: string;
  addressProvinceName?: string;
  avatarUrl?: string;
  isActive: boolean;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}
