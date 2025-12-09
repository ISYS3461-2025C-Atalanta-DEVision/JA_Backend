export class ApplicantResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  addressProvinceCode?: string;
  addressProvinceName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
