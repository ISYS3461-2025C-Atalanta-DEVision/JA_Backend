import { EntityFilterConfig } from "@common/filters";

/**
 * Filter configuration for Applicant entity
 * Defines which fields can be filtered/sorted and their types
 */
export const APPLICANT_FILTER_CONFIG: EntityFilterConfig = {
  allowedFields: {
    name: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    address: { type: "string" },
    addressProvinceName: { type: "string" },
    country: { type: "string", operators: ["equals"] },
    city: { type: "string" },
    isPremium: { type: "boolean", operators: ["equals"] },
    emailVerified: { type: "boolean", operators: ["equals"] },
    isActive: { type: "boolean", operators: ["equals", "in"] },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  defaultFilter: { isActive: true },
  defaultSort: { createdAt: -1 },
};
