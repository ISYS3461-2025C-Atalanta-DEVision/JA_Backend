import { FilterOperator, FilterFieldType } from "./filter-types";

/**
 * Configuration for a single filterable field
 */
export interface FilterFieldConfig {
  /**
   * Map to a different MongoDB field name
   * e.g., { id: 'name', mongoField: 'fullName' }
   */
  mongoField?: string;

  /**
   * Field type for value conversion and operator validation
   */
  type: FilterFieldType;

  /**
   * Allowed operators for this field
   * Defaults to all operators for the field type
   */
  operators?: FilterOperator[];
}

/**
 * Entity-level filter configuration
 * Each service defines this for their entities
 */
export interface EntityFilterConfig {
  /**
   * Map of field ID to field configuration
   * Only fields in this map can be filtered
   */
  allowedFields: Record<string, FilterFieldConfig>;

  /**
   * Default filter applied to all queries
   * e.g., { isActive: true }
   */
  defaultFilter?: Record<string, unknown>;

  /**
   * Default sort order
   * e.g., { createdAt: -1 }
   */
  defaultSort?: Record<string, 1 | -1>;
}
