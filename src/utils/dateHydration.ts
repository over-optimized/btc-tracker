/**
 * Utility for safely converting string dates back to Date objects
 * after JSON deserialization from localStorage
 */

export interface CacheEntryWithDates {
  timestamp: number | string | Date;
  lastUpdated?: number | string | Date;
  expiresAt?: number | string | Date;
  [key: string]: unknown;
}

/**
 * Safely convert a value to a Date object
 * Handles various input formats from JSON deserialization
 */
export function safeDateConversion(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Numeric timestamp (Unix timestamp in milliseconds)
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // String date (ISO string or other parseable format)
  if (typeof value === 'string') {
    if (value.trim() === '') return null;

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Hydrate date fields in a cache entry object
 * Converts string dates back to Date objects after JSON.parse()
 */
export function hydrateCacheEntry<T extends CacheEntryWithDates>(entry: T): T {
  const hydrated = { ...entry };

  // Common date fields that need hydration
  const dateFields = ['timestamp', 'lastUpdated', 'expiresAt'] as const;

  for (const field of dateFields) {
    if (field in hydrated) {
      const converted = safeDateConversion(hydrated[field]);
      if (converted !== null) {
        (hydrated as any)[field] = converted;
      }
    }
  }

  return hydrated;
}

/**
 * Recursively hydrate date fields in nested objects
 * Useful for complex cache structures
 */
export function deepHydrateDates<T extends Record<string, unknown>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Create a mutable copy that allows property assignment
  const hydrated: Record<string, unknown> = { ...obj };

  for (const [key, value] of Object.entries(hydrated)) {
    // Check if this looks like a date field
    if (isDateField(key)) {
      const converted = safeDateConversion(value);
      if (converted !== null) {
        hydrated[key] = converted;
      }
    }
    // Recursively process nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      hydrated[key] = deepHydrateDates(value as Record<string, unknown>);
    }
  }

  return hydrated as T;
}

/**
 * Check if a field name suggests it contains a date
 */
function isDateField(fieldName: string): boolean {
  const dateFieldPatterns = [
    /date$/i,
    /time$/i,
    /timestamp$/i,
    /updated$/i,
    /created/i,
    /expires/i,
    /last.*updated/i,
    /at$/i, // covers createdAt, updatedAt, etc.
  ];

  return dateFieldPatterns.some((pattern) => pattern.test(fieldName));
}

/**
 * Get current timestamp as a standardized format for storage
 */
export function getStorageTimestamp(): number {
  return Date.now();
}

/**
 * Validate that a date object is valid and within reasonable bounds
 */
export function isValidDate(date: Date | null | undefined): date is Date {
  if (!date || !(date instanceof Date)) {
    return false;
  }

  const timestamp = date.getTime();

  // Check for invalid dates
  if (isNaN(timestamp)) {
    return false;
  }

  // Check for reasonable bounds (not too far in past or future)
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

  return timestamp >= oneYearAgo && timestamp <= oneYearFromNow;
}
