/**
 * `Formula` — the flat, one-row-per-pack-size record the *new design*
 * screens (Compare / ProductDetail / HeadToHead / Calculator) consume.
 *
 * WHY this exists alongside `Product` (src/types/product.ts):
 *   The design prototype (`MilkWiseFinalDesign/`) was built against a flat
 *   `formulas.json` (76 rows = the curated 61 products with their pack-size
 *   variants un-nested). Its components read `p.product`, `p.packSize`,
 *   `p.pricePerGram`, string flags (`halal: "Yes"`)… — a different shape
 *   from our nested, boolean-flagged `Product`. Rather than rewrite every
 *   ported screen, we keep the design's shape verbatim as the contract and
 *   build it from our data (see `src/data/formulas.ts`).
 *
 *   `Product` / `ProductDetail` remain the source of truth and stay in use
 *   by Most Sold + Calculator until those screens are ported. The two
 *   models coexist by design during the rebuild.
 *
 * String flags: the design encodes booleans as human strings ("Yes", "No",
 * "Yes (Soy ONLY - no milk)"). The ported classifiers (`formulaClassifiers
 * .ts`) interpret them exactly as the prototype did (`.startsWith('yes')`),
 * so we preserve the strings rather than normalising to booleans.
 */

export interface Formula {
  // ── Identity / routing / media (enrichment, not in raw design JSON) ──
  /** Stable slug for `/product/[id]`. Single-variant products keep the
   *  product's slug; extra pack sizes get a `--<packSize>` suffix; the two
   *  design-only SKUs get a derived slug. Always unique. */
  id: string;
  /** Resolved WebP packshot filename key into `imageMap.ts` (never a JPG —
   *  honours the §7c WebP pipeline). */
  img: string;
  /** Curated ingredients list (from `productDetails.json`) when the row
   *  maps to a current product; the 2 design-only SKUs have none and fall
   *  back to the synthesised paragraph in `formulaClassifiers.ts`. */
  ingredients?: string;

  // ── Raw design fields (verbatim from formulas.json) ──────────────────
  stage: string;
  brand: string;
  origin: string;
  product: string;
  packSize: number;
  price: number;
  pricePerGram: number;
  scoopSize: number;
  waterPerScoop: number;
  scoopsPerTin: number;
  pricePerScoop: number;
  manufacturedIn: string;
  milkOrigin: string;
  soyBased: string;
  halal: string;
  lactoseFree: string;
  ar: string;
  ha: string;
  organic: string;
  allergens: string;
  probiotic: string;
  hmo: string;
  wheyCasein: string;
  partiallyHydrolyzed: string;
  palmOil: string;
  mainSugar: string;
  fillers: string;
}

/** One nutrient cell in `nutrition.json` (per-product, keyed by name). */
export interface NutrientValue {
  unit: string;
  per100g: number | null;
  per100ml: number | null;
}

/** `nutrition.json` shape: product short-name → nutrient → value. */
export type FormulaNutrition = Record<string, Record<string, NutrientValue>>;
