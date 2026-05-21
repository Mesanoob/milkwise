/**
 * Formatting helpers — currency, numbers, missing values.
 *
 * Centralising these prevents the same `value?.toFixed(2)` snippet from
 * appearing in twenty components, each with a slightly different idea of
 * how to handle nulls. Every formatter in this file follows two rules:
 *
 *   1. Accepts `null | undefined` and returns the same placeholder for both.
 *   2. Never throws — invalid input becomes a dash, not a crash.
 */

import { CURRENCY_LABEL, LOCALE } from '../config/constants';

// Placeholder shown when a nutrition value is missing from the label.
// Centralised so we can swap "—" for "n/a" once if the design changes.
export const MISSING_VALUE = '—';

// ── Currency ────────────────────────────────────────────────────────────────
/**
 * Format a Singapore-dollar price.
 *
 * @example formatCurrency(18.64)   // "S$18.64"
 * @example formatCurrency(null)    // "—"
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return MISSING_VALUE;
  }
  return `${CURRENCY_LABEL}${value.toFixed(2)}`;
};

/**
 * Format a price-per-unit value (e.g. cents per gram).
 * Uses 3 decimal places because per-gram values are often < S$0.01.
 */
export const formatUnitPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return MISSING_VALUE;
  }
  return `${CURRENCY_LABEL}${value.toFixed(3)}`;
};

// ── Numbers ─────────────────────────────────────────────────────────────────
/**
 * Format a plain number with locale-aware thousands separators.
 *
 * @example formatNumber(1234.5)    // "1,234.5"
 * @example formatNumber(null)      // "—"
 */
export const formatNumber = (
  value:   number | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return MISSING_VALUE;
  }
  return new Intl.NumberFormat(LOCALE, options).format(value);
};

/**
 * Format a nutrition value with its unit, gracefully handling missing data.
 *
 * @example formatNutrient(112, 'mg')   // "112 mg"
 * @example formatNutrient(null, 'mg')  // "—"
 */
export const formatNutrient = (
  value: number | null | undefined,
  unit:  string,
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return MISSING_VALUE;
  }
  return `${formatNumber(value)} ${unit}`;
};

// ── Pack weight ─────────────────────────────────────────────────────────────
/**
 * Renders a tin weight in the most natural unit.
 *   1800 → "1.8 kg"
 *    900 → "900 g"
 */
export const formatWeight = (grams: number): string => {
  const ONE_KILOGRAM_IN_GRAMS = 1000;
  if (grams >= ONE_KILOGRAM_IN_GRAMS) {
    return `${(grams / ONE_KILOGRAM_IN_GRAMS).toFixed(grams % ONE_KILOGRAM_IN_GRAMS === 0 ? 0 : 1)} kg`;
  }
  return `${grams} g`;
};
