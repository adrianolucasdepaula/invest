/**
 * Date Parser Utilities for Brazilian APIs
 *
 * Utilities for parsing dates from Brazilian government APIs (Banco Central Brasil)
 * that use the DD/MM/YYYY format, which is ambiguous in JavaScript.
 *
 * @created 2025-11-21 - FASE 2 (Backend Economic Indicators)
 * @author Claude Code
 */

/**
 * Parse date from BCB (Banco Central Brasil) format DD/MM/YYYY to JavaScript Date
 *
 * BCB API returns dates in Brazilian format: "DD/MM/YYYY" (e.g., "19/11/2025")
 * JavaScript's `new Date(string)` interprets this as MM/DD/YYYY (American format),
 * causing incorrect dates or Invalid Date errors.
 *
 * This parser explicitly handles the DD/MM/YYYY format with comprehensive validation:
 * - Format validation (3 parts separated by '/')
 * - Component validation (numeric values)
 * - Range validation (day 1-31, month 1-12, year >= 1900)
 * - Calendar validation (catches invalid dates like 31/02/2025)
 *
 * @param dateStr Date string in Brazilian format (e.g., "19/11/2025" for Nov 19, 2025)
 * @returns JavaScript Date object (UTC midnight)
 * @throws Error if date format is invalid or date is not a valid calendar date
 *
 * @example
 * ```typescript
 * parseBCBDate("19/11/2025") // Returns Date(2025, 10, 19) - November 19, 2025
 * parseBCBDate("01/10/2025") // Returns Date(2025, 9, 1)  - October 1, 2025
 * parseBCBDate("31/02/2025") // Throws Error: Invalid date (not a valid calendar date)
 * parseBCBDate("2025-11-19") // Throws Error: Invalid date format (expected DD/MM/YYYY)
 * ```
 */
export function parseBCBDate(dateStr: string): Date {
  // Validate input is a string
  if (typeof dateStr !== 'string') {
    throw new Error(`Invalid date input: expected string, got ${typeof dateStr}`);
  }

  // Split by '/' and validate format DD/MM/YYYY
  const parts = dateStr.trim().split('/');

  if (parts.length !== 3) {
    throw new Error(
      `Invalid date format: ${dateStr} (expected DD/MM/YYYY, got ${parts.length} parts)`
    );
  }

  // Parse components
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Validate components are numeric
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error(
      `Invalid date components: ${dateStr} (day=${parts[0]}, month=${parts[1]}, year=${parts[2]} - expected numbers)`
    );
  }

  // Validate ranges
  if (day < 1 || day > 31) {
    throw new Error(`Day out of range: ${day} (expected 1-31) in date ${dateStr}`);
  }

  if (month < 1 || month > 12) {
    throw new Error(`Month out of range: ${month} (expected 1-12) in date ${dateStr}`);
  }

  if (year < 1900 || year > 2100) {
    throw new Error(`Year out of range: ${year} (expected 1900-2100) in date ${dateStr}`);
  }

  // Create Date object (month is 0-indexed in JavaScript: 0=Jan, 11=Dec)
  const date = new Date(year, month - 1, day);

  // Verify created date matches input components
  // This catches invalid calendar dates like 31/02/2025 (February 31st doesn't exist)
  // JavaScript's Date constructor "rolls over" invalid dates (e.g., Feb 31 becomes Mar 3)
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) {
    throw new Error(
      `Invalid date: ${dateStr} (not a valid calendar date - did you mean ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}?)`
    );
  }

  return date;
}
