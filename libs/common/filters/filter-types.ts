/**
 * Filter operators for query building
 * Compatible with TanStack Table ColumnFiltersState
 */
export type FilterOperator =
  | "contains" // regex partial match (default)
  | "equals" // exact match
  | "startsWith" // prefix match
  | "gt" // greater than
  | "gte" // greater than or equal
  | "lt" // less than
  | "lte"; // less than or equal

/**
 * Field type for determining how to build conditions
 */
export type FilterFieldType =
  | "string"
  | "number"
  | "date"
  | "boolean"
  | "objectId";

/**
 * Default operators per field type
 */
export const DEFAULT_OPERATORS: Record<FilterFieldType, FilterOperator[]> = {
  string: ["contains", "equals", "startsWith"],
  number: ["equals", "gt", "gte", "lt", "lte"],
  date: ["equals", "gt", "gte", "lt", "lte"],
  boolean: ["equals"],
  objectId: ["equals"],
};
