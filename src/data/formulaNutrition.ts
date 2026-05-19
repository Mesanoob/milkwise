/**
 * Per-product nutrient table (`nutrition.json`, copied verbatim from the
 * design) keyed by product name. Consumed by the rebuilt ProductDetail and
 * HeadToHead screens.
 *
 * `getFormulaNutrition` reproduces the prototype's exact lookup fallback
 * chain (ProductDetail.jsx / HeadToHead.jsx): full product name → short
 * name → name with the trailing "- Step/Stage N…" stripped. Keeping the
 * resolution identical means the ported screens surface nutrition for the
 * same set of products the design did (63 of the 76 rows have an entry —
 * pack-size variants of one product share a single nutrition record).
 */

import nutritionJson from './nutrition.json';
import type { FormulaNutrition, NutrientValue } from '../types/formula';
import { shortName } from '../utils/formulaClassifiers';

const nutrition = nutritionJson as unknown as FormulaNutrition;

/** Resolve a product's nutrient map, or `null` if none is on file. */
export const getFormulaNutrition = (
  productName: string,
): Record<string, NutrientValue> | null =>
  nutrition[productName] ??
  nutrition[shortName(productName)] ??
  nutrition[productName.replace(/\s-\s(Step|Stage)\s\d+.*$/, '')] ??
  null;
