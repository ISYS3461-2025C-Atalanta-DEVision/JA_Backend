export class WorkHistoryResponseDto {
  id: string;
  applicantId: string;
  companyName: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
