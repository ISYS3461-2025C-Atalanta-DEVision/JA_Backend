import { EntityFilterConfig } from "@common/filters";

/**
 * Filter configuration for AdminApplicant entity
 */
export const ADMIN_APPLICANT_FILTER_CONFIG: EntityFilterConfig = {
  allowedFields: {
    name: { type: "string" },
    email: { type: "string" },
    description: { type: "string" },
    emailVerified: { type: "boolean", operators: ["equals"] },
    isActive: { type: "boolean", operators: ["equals"] },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  defaultFilter: { isActive: true },
  defaultSort: { createdAt: -1 },
};
