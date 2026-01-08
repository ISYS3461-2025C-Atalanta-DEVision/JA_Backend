import { EntityFilterConfig } from "@common/filters";

/**
 * Filter configuration for Skill entity
 */
export const SKILL_FILTER_CONFIG: EntityFilterConfig = {
  allowedFields: {
    name: { type: "string" },
    jobCategoryId: { type: "string", operators: ["equals"] },
    description: { type: "string" },
    createdBy: { type: "string", operators: ["equals"] },
    isActive: { type: "boolean", operators: ["equals"] },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  defaultFilter: { isActive: true },
  defaultSort: { createdAt: -1 },
};

/**
 * Filter configuration for JobCategory entity
 */
export const JOB_CATEGORY_FILTER_CONFIG: EntityFilterConfig = {
  allowedFields: {
    name: { type: "string" },
    slug: { type: "string", operators: ["equals"] },
    description: { type: "string" },
    isActive: { type: "boolean", operators: ["equals"] },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  defaultFilter: {},
  defaultSort: { createdAt: -1 },
};
