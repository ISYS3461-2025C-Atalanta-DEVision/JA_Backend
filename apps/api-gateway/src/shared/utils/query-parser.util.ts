import { BadRequestException } from "@nestjs/common";
import { FilterItem, SortItem } from "@common/dtos/filter.dto";

/** Security limits to prevent DoS attacks */
const MAX_FILTERS = 50;
const MAX_SORTS = 10;
const MAX_VALUE_LENGTH = 1000;

/**
 * Parse JSON string to FilterItem array
 * Validates format and returns undefined if empty/invalid
 *
 * @param json - JSON string from query param
 * @returns FilterItem[] or undefined
 * @throws BadRequestException if JSON is malformed or exceeds limits
 */
export function parseFilters(json?: string): FilterItem[] | undefined {
  if (!json || json.trim() === "") return undefined;

  try {
    const parsed = JSON.parse(json);

    if (!Array.isArray(parsed)) {
      throw new BadRequestException("Filters must be an array");
    }

    // Limit array size to prevent DoS
    if (parsed.length > MAX_FILTERS) {
      throw new BadRequestException(`Maximum ${MAX_FILTERS} filters allowed`);
    }

    // Validate each filter item has required fields
    for (const item of parsed) {
      if (typeof item.id !== "string" || typeof item.value !== "string") {
        throw new BadRequestException(
          "Each filter must have id and value as strings",
        );
      }
      // Limit value length to prevent resource exhaustion
      if (item.value.length > MAX_VALUE_LENGTH) {
        throw new BadRequestException(
          `Filter value exceeds maximum length of ${MAX_VALUE_LENGTH}`,
        );
      }
    }

    return parsed.length > 0 ? parsed : undefined;
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(
      "Invalid filters format: must be valid JSON array",
    );
  }
}

/**
 * Parse JSON string to SortItem array
 * Validates format and returns undefined if empty/invalid
 *
 * @param json - JSON string from query param
 * @returns SortItem[] or undefined
 * @throws BadRequestException if JSON is malformed or exceeds limits
 */
export function parseSorting(json?: string): SortItem[] | undefined {
  if (!json || json.trim() === "") return undefined;

  try {
    const parsed = JSON.parse(json);

    if (!Array.isArray(parsed)) {
      throw new BadRequestException("Sorting must be an array");
    }

    // Limit array size to prevent DoS
    if (parsed.length > MAX_SORTS) {
      throw new BadRequestException(`Maximum ${MAX_SORTS} sort fields allowed`);
    }

    // Validate each sort item has required fields
    for (const item of parsed) {
      if (typeof item.id !== "string") {
        throw new BadRequestException("Each sort item must have id as string");
      }
    }

    return parsed.length > 0 ? parsed : undefined;
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(
      "Invalid sorting format: must be valid JSON array",
    );
  }
}

/**
 * Validate and normalize pagination parameters
 * Enforces reasonable limits to prevent DoS
 *
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Normalized { page, limit }
 */
export function validatePagination(
  page?: number | string,
  limit?: number | string,
): { page: number; limit: number } {
  const MIN_PAGE = 1;
  const MAX_PAGE = 10000;
  const MIN_LIMIT = 1;
  const MAX_LIMIT = 100;
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 10;

  let normalizedPage = Number(page) || DEFAULT_PAGE;
  let normalizedLimit = Number(limit) || DEFAULT_LIMIT;

  // Clamp values to valid ranges
  normalizedPage = Math.max(MIN_PAGE, Math.min(MAX_PAGE, normalizedPage));
  normalizedLimit = Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, normalizedLimit));

  return { page: normalizedPage, limit: normalizedLimit };
}
