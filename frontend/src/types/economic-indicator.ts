/**
 * Economic Indicator Types - FASE 1.4
 *
 * TypeScript interfaces for economic indicators (8 types total)
 * matching backend DTOs from FASE 2.
 *
 * @created 2025-11-21 - FASE 1 (Frontend Economic Indicators)
 * @updated 2025-11-23 - FASE 1.4 (Added 5 new indicator types)
 */

/**
 * Indicator Type - All supported types (FASE 1.4: 8 types)
 */
export type IndicatorType =
  | 'SELIC'
  | 'IPCA'
  | 'CDI'
  | 'IPCA_15'
  | 'IDP_INGRESSOS'
  | 'IDE_SAIDAS'
  | 'IDP_LIQUIDO'
  | 'OURO_MONETARIO';

/**
 * EconomicIndicator - Full entity from database
 * Matches backend: EconomicIndicator entity
 */
export interface EconomicIndicator {
  id: string;
  indicatorType: IndicatorType;
  value: number;
  referenceDate: string; // ISO 8601 format
  source: string;
  metadata?: {
    unit?: string; // "% a.a." | "US$ millions"
    period?: string; // "annual" | "monthly"
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * LatestIndicatorResponse - Latest indicator with change calculation
 * Matches backend: LatestIndicatorResponseDto
 *
 * Used by GET /api/v1/economic-indicators/:type endpoint
 */
export interface LatestIndicatorResponse {
  type: string; // "SELIC" | "IPCA" | "CDI"
  currentValue: number; // IMPORTANT: NOT rounded (precision maintained)
  previousValue?: number;
  change?: number; // currentValue - previousValue
  referenceDate: string; // ISO 8601 format
  source: string; // "BRAPI" | "BRAPI (calculated)"
  unit: string; // "% a.a."
}

/**
 * LatestWithAccumulatedResponse - Latest indicator + 12-month accumulated
 * Matches backend: LatestWithAccumulatedResponseDto
 *
 * Used by GET /api/v1/economic-indicators/:type/accumulated endpoint
 * FASE 1.1 - Economic Indicators with Accumulated Data
 */
export interface LatestWithAccumulatedResponse extends LatestIndicatorResponse {
  accumulated12Months: number; // Sum of last 12 months
  monthsCount: number; // Number of months used in calculation (may be < 12 if insufficient data)
}

/**
 * IndicatorsListResponse - List of indicators with pagination
 * Matches backend: IndicatorsListResponseDto
 *
 * Used by GET /api/v1/economic-indicators endpoint
 */
export interface IndicatorsListResponse {
  indicators: EconomicIndicator[];
  total: number;
  updatedAt: string; // ISO 8601 format
}
