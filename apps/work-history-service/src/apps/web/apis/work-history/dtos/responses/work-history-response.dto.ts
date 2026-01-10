export class WorkHistoryResponseDto {
  id: string;
  applicantId: string;
  companyName: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  skillCategories: string[];
  createdAt: Date;
  updatedAt: Date;
}
