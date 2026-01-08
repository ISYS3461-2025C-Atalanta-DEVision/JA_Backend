import { FilterOperator } from "../filters/filter-types";

/**
 * Filter item from TanStack Table ColumnFiltersState
 * Format: [{ id: 'name', value: 'John', operator: 'contains' }]
 */
export interface FilterItem {
  id: string;
  value: string;
  operator?: FilterOperator;
}

export { FilterOperator };

/**
 * Sort item from TanStack Table SortingState
 * Format: [{ id: 'name', desc: false }]
 */
export interface SortItem {
  id: string;
  desc?: boolean;
}

/**
 * Query params for paginated findAll with filters/sorting
 */
export interface FindAllQueryParams {
  page?: number;
  limit?: number;
  filters?: FilterItem[];
  sorting?: SortItem[];
}
