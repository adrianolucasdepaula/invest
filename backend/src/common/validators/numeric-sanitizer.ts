import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * FASE 117: Centralized Numeric Sanitization
 *
 * Ensures numeric values are within safe JavaScript limits to prevent:
 * - Integer overflow (values > Number.MAX_SAFE_INTEGER)
 * - Floating point precision issues
 * - Infinity and NaN values
 *
 * Usage:
 * @IsNumericSafe()
 * price: number;
 *
 * @IsNumericSafe({ min: 0, max: 1000000 })
 * shares: number;
 */

// Constants for safe numeric ranges
export const SAFE_NUMERIC_LIMITS = {
  MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER, // -9007199254740991
  MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER, // 9007199254740991
  MIN_PRICE: 0,
  MAX_PRICE: 100000000, // R$100 milhões (BRL)
  MIN_SHARES: 0,
  MAX_SHARES: 10000000000, // 10 bilhões de ações
  MIN_PERCENTAGE: -100,
  MAX_PERCENTAGE: 100000, // Permitir grandes valorizações históricas
  MIN_MARKET_CAP: 0,
  MAX_MARKET_CAP: 10000000000000, // R$10 trilhões (Petrobras ~500B)
};

interface NumericSafeOptions {
  min?: number;
  max?: number;
  allowNaN?: boolean;
  allowInfinity?: boolean;
}

@ValidatorConstraint({ name: 'isNumericSafe', async: false })
export class IsNumericSafeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const options: NumericSafeOptions = args.constraints[0] || {};
    const { min = SAFE_NUMERIC_LIMITS.MIN_SAFE_INTEGER, max = SAFE_NUMERIC_LIMITS.MAX_SAFE_INTEGER, allowNaN = false, allowInfinity = false } = options;

    // Allow null/undefined (use @IsOptional() or @IsNotEmpty() separately)
    if (value === null || value === undefined) {
      return true;
    }

    // Must be a number
    if (typeof value !== 'number') {
      return false;
    }

    // Check for NaN
    if (Number.isNaN(value)) {
      return allowNaN;
    }

    // Check for Infinity
    if (!Number.isFinite(value)) {
      return allowInfinity;
    }

    // Check range
    return value >= min && value <= max;
  }

  defaultMessage(args: ValidationArguments): string {
    const options: NumericSafeOptions = args.constraints[0] || {};
    const { min = SAFE_NUMERIC_LIMITS.MIN_SAFE_INTEGER, max = SAFE_NUMERIC_LIMITS.MAX_SAFE_INTEGER } = options;

    return `${args.property} must be a safe number between ${min} and ${max}`;
  }
}

/**
 * Decorator: Validates that a number is within safe limits
 *
 * @param options - Optional configuration (min, max, allowNaN, allowInfinity)
 * @param validationOptions - Standard class-validator options
 */
export function IsNumericSafe(options?: NumericSafeOptions, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [options],
      validator: IsNumericSafeConstraint,
    });
  };
}

/**
 * Utility function: Sanitize a numeric value
 *
 * @param value - Value to sanitize
 * @param options - Sanitization options
 * @returns Sanitized value or null if invalid
 */
export function sanitizeNumber(
  value: unknown,
  options: NumericSafeOptions = {},
): number | null {
  const {
    min = SAFE_NUMERIC_LIMITS.MIN_SAFE_INTEGER,
    max = SAFE_NUMERIC_LIMITS.MAX_SAFE_INTEGER,
  } = options;

  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // Parse string to number if needed
  let num: number;
  if (typeof value === 'string') {
    // Clean BR format: "1.234,56" → "1234.56"
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    num = parseFloat(cleaned);
  } else if (typeof value === 'number') {
    num = value;
  } else {
    return null;
  }

  // Check for NaN or Infinity
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return null;
  }

  // Clamp to range
  if (num < min) return min;
  if (num > max) return max;

  return num;
}

/**
 * Utility function: Sanitize price values (R$ BRL)
 */
export function sanitizePrice(value: unknown): number | null {
  return sanitizeNumber(value, {
    min: SAFE_NUMERIC_LIMITS.MIN_PRICE,
    max: SAFE_NUMERIC_LIMITS.MAX_PRICE,
  });
}

/**
 * Utility function: Sanitize percentage values
 */
export function sanitizePercentage(value: unknown): number | null {
  return sanitizeNumber(value, {
    min: SAFE_NUMERIC_LIMITS.MIN_PERCENTAGE,
    max: SAFE_NUMERIC_LIMITS.MAX_PERCENTAGE,
  });
}

/**
 * Utility function: Sanitize share/volume values
 */
export function sanitizeShares(value: unknown): number | null {
  return sanitizeNumber(value, {
    min: SAFE_NUMERIC_LIMITS.MIN_SHARES,
    max: SAFE_NUMERIC_LIMITS.MAX_SHARES,
  });
}

/**
 * Utility function: Sanitize market cap values
 */
export function sanitizeMarketCap(value: unknown): number | null {
  return sanitizeNumber(value, {
    min: SAFE_NUMERIC_LIMITS.MIN_MARKET_CAP,
    max: SAFE_NUMERIC_LIMITS.MAX_MARKET_CAP,
  });
}

/**
 * Utility function: Check if a value is a safe number
 */
export function isSafeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
}
