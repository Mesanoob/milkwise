import type { Product } from '../types/product';
import { SG_GUIDELINES, solidsFactor } from '../data/feedingGuidelines';

export interface AgeResult {
  months: number;
  days: number;
  totalDays: number;
}

export interface FormulaInputs {
  primary: Product | null;
  supplemental: Product | null;
  primaryIsBreastmilk: boolean;
  useSupplement: boolean;
  primarySharePct: number;
  mlPerFeed: number;
  feedsPerDay: number;
  ageMonths: number | null;
  /**
   * Manual spec overrides. When a parent edits the scoop / tin-size /
   * price fields (or they're auto-filled from a product and then tweaked),
   * these take precedence over the values derived from the selected
   * Product. `null`/absent ⇒ fall back to product-derived, so callers
   * that don't expose manual entry are unaffected.
   *
   * `pricePerGramOverride` is intentionally per-GRAM, not per-tin: the
   * screen knows the tin weight at edit time and the whole engine already
   * costs in $/g, so converting once at the boundary keeps this file's
   * math in a single unit.
   */
  scoopGOverride?: number | null;
  tinWeightGOverride?: number | null;
  pricePerGramOverride?: number | null;
}

export interface MonthlyFormulaCost {
  month: number;
  dailyMl: number;
  powderG: number;
  cost: number;
}

export interface FeedingEstimate {
  dailyMl: number;
  formulaShare: number;
  formulaDailyMl: number;
  powderDayG: number;
  powderMonthG: number;
  tinsPerMonth: number | null;
  costPerMonth: number | null;
  effectiveScoopG: number;
  effectivePricePerGram: number | null;
  monthlyData: MonthlyFormulaCost[];
  retroSpend: number;
  projectedSpend: number;
  totalSpend: number;
}

const DAYS_PER_MONTH = 30.4375;
const DEFAULT_SCOOP_G = 4.4;

export const calcAge = (dob: Date, referenceDate = new Date()): AgeResult => {
  const totalDays = Math.max(0, Math.floor((referenceDate.getTime() - dob.getTime()) / 86_400_000));
  return {
    months: Math.floor(totalDays / DAYS_PER_MONTH),
    days: Math.floor(totalDays % DAYS_PER_MONTH),
    totalDays,
  };
};

export const parseDobParts = (
  day: string,
  month: string,
  year: string,
  referenceDate = new Date(),
): Date | null => {
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;

  const dd = Number.parseInt(day, 10);
  const mm = Number.parseInt(month, 10) - 1;
  const yyyy = Number.parseInt(year, 10);
  if ([dd, mm, yyyy].some(Number.isNaN)) return null;

  const candidate = new Date(yyyy, mm, dd);
  const isRealDate =
    candidate.getFullYear() === yyyy &&
    candidate.getMonth() === mm &&
    candidate.getDate() === dd;
  if (!isRealDate) return null;

  if (candidate > referenceDate) return null;
  if (candidate < new Date(2023, 0, 1)) return null;
  return candidate;
};

export const calculateFeedingEstimate = ({
  primary,
  supplemental,
  primaryIsBreastmilk,
  useSupplement,
  primarySharePct,
  mlPerFeed,
  feedsPerDay,
  ageMonths,
  scoopGOverride = null,
  tinWeightGOverride = null,
  pricePerGramOverride = null,
}: FormulaInputs): FeedingEstimate => {
  const primaryShare = primarySharePct / 100;
  const supplementalShare = 1 - primaryShare;

  const formulaShare = (() => {
    if (primaryIsBreastmilk) return useSupplement && supplemental ? supplementalShare : 0;
    // Manual-entry path: no product picked, but the parent typed a
    // scoop/tin/price by hand. Treat it as 100% formula so the cost,
    // monthly curve and spend totals compute off the manual spec — the
    // "manual entry first" model from the design.
    if (!primary) return pricePerGramOverride != null ? 1 : 0;
    return 1;
  })();

  const effectiveScoopG = (() => {
    if (primaryIsBreastmilk) return supplemental?.scoopG ?? DEFAULT_SCOOP_G;
    if (!primary) return DEFAULT_SCOOP_G;
    if (useSupplement && supplemental) {
      return (primary.scoopG ?? DEFAULT_SCOOP_G) * primaryShare +
        (supplemental.scoopG ?? DEFAULT_SCOOP_G) * supplementalShare;
    }
    return primary.scoopG ?? DEFAULT_SCOOP_G;
  })();

  const effectivePricePerGram = (() => {
    if (primaryIsBreastmilk) return useSupplement && supplemental ? supplemental.pricePerGram ?? null : null;
    if (!primary) return null;
    if (useSupplement && supplemental) {
      const primaryPpg = primary.pricePerGram ?? 0;
      const supplementalPpg = supplemental.pricePerGram ?? 0;
      return primaryPpg * primaryShare + supplementalPpg * supplementalShare;
    }
    return primary.pricePerGram ?? null;
  })();

  // Fold manual overrides over the product-derived values. Everything
  // below costs from these three, so a single substitution point flows
  // through monthlyData / retroSpend / projectedSpend with no parallel
  // math path.
  const scoopG = scoopGOverride ?? effectiveScoopG;
  const pricePerGram = pricePerGramOverride ?? effectivePricePerGram;
  const tinWeightG =
    tinWeightGOverride ??
    (primaryIsBreastmilk ? supplemental?.weightG : primary?.weightG) ??
    null;

  const dailyMl = mlPerFeed * feedsPerDay;
  const formulaDailyMl = dailyMl * formulaShare;
  const gramsPerMl = scoopG / 30;
  const powderDayG = formulaDailyMl * gramsPerMl;
  const powderMonthG = powderDayG * DAYS_PER_MONTH;
  const tinsPerMonth = tinWeightG && powderMonthG > 0
    ? powderMonthG / tinWeightG
    : null;
  const costPerMonth = pricePerGram && formulaShare > 0
    ? pricePerGram * powderMonthG
    : null;

  const monthlyData = SG_GUIDELINES.map((guideline, month) => {
    const benchmarkMidpoint = (guideline.dMin + guideline.dMax) / 2;
    const baselineMl = month === ageMonths ? dailyMl : benchmarkMidpoint;
    const adjustedMl = month >= 6 ? baselineMl * solidsFactor(month) : baselineMl;
    const monthPowderG = adjustedMl * formulaShare * gramsPerMl * DAYS_PER_MONTH;
    const cost = pricePerGram ? pricePerGram * monthPowderG : 0;
    return {
      month,
      dailyMl: Math.round(adjustedMl),
      powderG: Math.round(monthPowderG),
      cost: Math.round(cost * 100) / 100,
    };
  });

  const retroSpend = (() => {
    if (ageMonths === null || !pricePerGram) return 0;
    let total = 0;
    for (let month = 0; month < ageMonths; month += 1) {
      const guideline = SG_GUIDELINES[month];
      if (!guideline) continue;
      const midpointMl = (guideline.dMin + guideline.dMax) / 2;
      const adjustedMl = month >= 6 ? midpointMl * solidsFactor(month) : midpointMl;
      total += adjustedMl * formulaShare * gramsPerMl * DAYS_PER_MONTH * pricePerGram;
    }
    return total;
  })();

  const projectedSpend = ageMonths === null
    ? 0
    : monthlyData.slice(ageMonths).reduce((sum, item) => sum + item.cost, 0);

  return {
    dailyMl,
    formulaShare,
    formulaDailyMl,
    powderDayG,
    powderMonthG,
    tinsPerMonth,
    costPerMonth,
    // Expose the *effective* values (override folded in) so the UI shows
    // what the math actually used, not the pre-override product spec.
    effectiveScoopG: scoopG,
    effectivePricePerGram: pricePerGram,
    monthlyData,
    retroSpend,
    projectedSpend,
    totalSpend: retroSpend + projectedSpend,
  };
};
