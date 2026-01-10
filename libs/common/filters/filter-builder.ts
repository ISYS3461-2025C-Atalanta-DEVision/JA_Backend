import { FilterQuery } from "mongoose";
import { FilterItem, SortItem } from "../dtos/filter.dto";
import {
  EntityFilterConfig,
  FilterFieldConfig,
} from "./filter-config.interface";
import { FilterOperator, DEFAULT_OPERATORS } from "./filter-types";

/**
 * Generic filter builder for MongoDB queries
 * Converts FilterItem[] and SortItem[] to MongoDB FilterQuery and sort objects
 *
 * Security features:
 * - Field allowlist prevents NoSQL injection
 * - Regex escaping prevents ReDoS attacks
 * - Operator validation per field type
 */
export class FilterBuilder<T> {
  constructor(private readonly config: EntityFilterConfig) {}

  /**
   * Build MongoDB filter query from FilterItem array
   *
   * @param filters - Array of filter items from TanStack Table
   * @returns MongoDB FilterQuery with default filter merged
   */
  buildQuery(filters?: FilterItem[]): FilterQuery<T> {
    const query: FilterQuery<T> = {
      ...(this.config.defaultFilter || {}),
    } as FilterQuery<T>;

    if (!filters?.length) return query;

    for (const filter of filters) {
      const fieldConfig = this.config.allowedFields[filter.id];

      // Skip if field not in allowlist or no value
      if (!fieldConfig || !filter.value) continue;

      const mongoField = fieldConfig.mongoField || filter.id;
      const operator = filter.operator || "contains";

      // Validate operator is allowed for this field
      if (!this.isOperatorAllowed(operator, fieldConfig)) {
        continue;
      }

      const condition = this.buildCondition(
        filter.value,
        operator,
        fieldConfig.type,
      );
      if (condition !== undefined) {
        (query as Record<string, unknown>)[mongoField] = condition;
      }
    }

    console.log("[FilterBuilder] Final query:", JSON.stringify(query));
    return query;
  }

  /**
   * Build MongoDB sort object from SortItem array
   *
   * @param sorting - Array of sort items from TanStack Table
   * @returns MongoDB sort object
   */
  buildSort(sorting?: SortItem[]): Record<string, 1 | -1> {
    if (!sorting?.length) {
      return this.config.defaultSort || { createdAt: -1 };
    }

    const sort: Record<string, 1 | -1> = {};

    for (const item of sorting) {
      const fieldConfig = this.config.allowedFields[item.id];

      // Skip if field not in allowlist
      if (!fieldConfig) continue;

      const mongoField = fieldConfig.mongoField || item.id;
      sort[mongoField] = item.desc ? -1 : 1;
    }

    // Return default sort if no valid fields
    return Object.keys(sort).length > 0
      ? sort
      : this.config.defaultSort || { createdAt: -1 };
  }

  /**
   * Check if operator is allowed for the field
   */
  private isOperatorAllowed(
    operator: FilterOperator,
    config: FilterFieldConfig,
  ): boolean {
    const allowedOperators =
      config.operators || DEFAULT_OPERATORS[config.type] || [];
    return allowedOperators.includes(operator);
  }

  /**
   * Build MongoDB condition based on operator and field type
   */
  private buildCondition(
    value: string,
    operator: FilterOperator,
    type: FilterFieldConfig["type"],
  ): unknown {
    // Escape regex special chars for text operations
    const escaped = this.escapeRegex(value);

    switch (operator) {
      case "contains":
        return { $regex: escaped, $options: "i" };

      case "equals":
        return this.convertValue(value, type);

      case "startsWith":
        return { $regex: `^${escaped}`, $options: "i" };

      case "gt":
        return { $gt: this.convertValue(value, type) };

      case "gte":
        return { $gte: this.convertValue(value, type) };

      case "lt":
        return { $lt: this.convertValue(value, type) };

      case "lte":
        return { $lte: this.convertValue(value, type) };

      case "in":
        const values = value
          .split(",")
          .map((v) => this.convertValue(v.trim(), type));
        return { $in: values };

      default:
        return { $regex: escaped, $options: "i" };
    }
  }

  /**
   * Convert string value to appropriate type
   */
  private convertValue(
    value: string,
    type: FilterFieldConfig["type"],
  ): unknown {
    switch (type) {
      case "number":
        const num = Number(value);
        return isNaN(num) ? value : num;

      case "boolean":
        return value === "true" || value === "1";

      case "date":
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date;

      case "objectId":
      case "string":
      default:
        return value;
    }
  }

  /**
   * Escape regex special characters to prevent ReDoS
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
