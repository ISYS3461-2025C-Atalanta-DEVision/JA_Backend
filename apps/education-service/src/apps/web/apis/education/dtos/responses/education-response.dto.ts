import { EducationLevel } from "apps/education-service/src/libs/dals";

export class EducationResponseDto {
  id: string;
  applicantId: string;
  levelStudy: EducationLevel;
  major: string;
  schoolName?: string;
  gpa?: number;
  startDate?: Date;
  endDate?: Date;
  skillCategories: string[];
  createdAt: Date;
  updatedAt: Date;
}
