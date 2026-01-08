import { EntityFilterConfig } from "@common/filters";

/**
 * Filter configuration for WorkHistory entity
 */
export const WORK_HISTORY_FILTER_CONFIG: EntityFilterConfig = {
  allowedFields: {
    applicantId: { type: "string", operators: ["equals"] },
    title: { type: "string" },
    companyId: { type: "string", operators: ["equals"] },
    description: { type: "string" },
    startDate: { type: "date" },
    endDate: { type: "date" },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  defaultFilter: {},
  defaultSort: { createdAt: -1 },
};
