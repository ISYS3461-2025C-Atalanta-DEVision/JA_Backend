import { EntityFilterConfig } from "@common/filters";

/**
 * Filter configuration for Education entity
 */
export const EDUCATION_FILTER_CONFIG: EntityFilterConfig = {
  allowedFields: {
    applicantId: { type: "string", operators: ["equals"] },
    levelStudy: { type: "string", operators: ["equals"] },
    major: { type: "string" },
    schoolName: { type: "string" },
    gpa: { type: "number" },
    startDate: { type: "date" },
    endDate: { type: "date" },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  defaultFilter: {},
  defaultSort: { createdAt: -1 },
};
