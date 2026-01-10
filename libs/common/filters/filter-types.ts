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
  | "lte" // less than or equal
  | "in"; // matches any value in comma-separated list

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
  string: ["contains", "equals", "startsWith", "in"],
  number: ["equals", "gt", "gte", "lt", "lte", "in"],
  date: ["equals", "gt", "gte", "lt", "lte", "in"],
  boolean: ["equals", "in"],
  objectId: ["equals", "in"],
};
