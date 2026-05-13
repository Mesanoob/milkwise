/**
 * Product domain types.
 *
 * One source of truth for what a "product" looks like in MilkWise.
 * Every other module — services, hooks, components — depends on these,
 * so changes here ripple intentionally through the whole app.
 *
 * Design choices worth remembering:
 *   • `Product.id` is a stable slug (e.g. "abbott-grow-s1") so URLs do not
 *     break when the database row id changes.
 *   • Numeric nutrition fields are nullable: real-world labels are
 *     inconsistent, and a missing value is meaningful information — we
 *     render it as "—" rather than silently substituting zero.
 *   • Variants live on the product (one product → many SKUs) so the
 *     compare screen can show the cheapest variant by default while
 *     still letting the user inspect pack-size differences.
 */

// ── Enumerations ────────────────────────────────────────────────────────────
// Using string literal unions instead of TypeScript `enum` because they
// serialise to plain JSON, play nicely with switch statements, and don't
// produce extra runtime objects in the bundle.

export type Stage = 'Stage 1' | 'Stage 2' | 'Stage 3' | 'Newborn';

export type MilkType = 'cow' | 'goat' | 'soy';

// Keep this union in sync with:
//   • `specialtyColors` in `src/config/theme.ts` (visual palette)
//   • `SPECIALTY_LABELS` in `src/utils/strings.ts` (human-readable copy)
//   • The literal strings stored in `products.json`
// All four are mirrors of the same vocabulary; drift = silent UI bugs.
export type Specialty =
  | 'budget'
  | 'organic'
  | 'gentle'
  | 'goat'
  | 'soy'
  | 'lactosefree'
  | 'ha'
  | 'hypoallergenic'
  | 'ar'
  | 'csection'
  | 'premature'
  | null;

// ── Nutrition (per 100g of powder) ──────────────────────────────────────────
export interface NutritionSummary {
  energy:  number | null; // kcal
  protein: number | null; // g
  fat:     number | null; // g
  carbs:   number | null; // g
  dha:     number | null; // mg
}

// ── Variants (pack-size SKUs) ───────────────────────────────────────────────
// A single product line may be sold in multiple pack sizes; each one has
// its own price and (derived) cost-per-gram. We keep the derived numbers
// alongside the raw inputs because they are expensive to recompute on
// every render and they never change without the raw inputs also changing.
export interface ProductVariant {
  weightG:        number;          // pack weight in grams
  price:          number;          // retail price in SGD
  scoopG:         number;          // grams per scoop
  waterMl:        number;          // ml of water per scoop
  img:            string;          // path inside `assets/products/`
  scoopsPerTin?:  number;          // derived: weightG / scoopG
  pricePerGram?:  number;          // derived: price / weightG
  pricePerScoop?: number;          // derived: price / scoopsPerTin
  pricePerMl?:    number;          // derived: pricePerScoop / waterMl
}

// ── Core product record ─────────────────────────────────────────────────────
export interface Product {
  id:           string;
  numId?:       number;   // legacy numeric id from the original prototype
  stage:        Stage;
  brand:        string;
  name:         string;
  fullName:     string;
  milkType:     MilkType;
  origin:       string;          // country of manufacture
  milkOrigin:   string;          // origin of the milk itself (may differ)

  // Flags — keep these as discrete booleans rather than a tag array so the
  // filter UI can show "Halal", "Organic" etc. without parsing strings.
  halal:        boolean;
  soyBased:     boolean;
  lactoseFree:  boolean;
  ar:           boolean;          // anti-regurgitation
  ha:           boolean;          // hypoallergenic
  organic:      boolean;
  palmFree:     boolean;
  partialHydro: boolean;
  extHydro?:     boolean;

  probiotic:    string;
  hmo:          string;
  mainSugar:    string;
  specialty:    Specialty;

  desc:         string;
  bestFor:      string;

  nutrition:    NutritionSummary;
  variants:     ProductVariant[];

  // Convenience mirrors of the default variant (variants[0]). These are
  // populated by the data loader so list screens don't need to dig into
  // `variants[0]` on every render.
  img?:         string;
  weightG?:     number;
  price?:       number;
  scoopG?:      number;
  waterMl?:     number;
  scoopsPerTin?: number;
  pricePerGram?: number;
  pricePerScoop?: number;
  pricePerMl?:   number;
}

// ── Detail record (lazy-loaded per product) ─────────────────────────────────
// The full nutrition table for a single product is ~30 rows. Loading it for
// 61 products on every page open would waste bandwidth, so we store it in a
// separate JSON keyed by product id and only fetch what the detail screen
// actually needs.
export interface NutrientRow {
  nutrient: string;
  unit:     string;
  per100g:  number | null;
  per100ml: number | null;
}

export interface ProductDetail {
  ingredients:   string;
  allergen:      string;
  fullNutrition: NutrientRow[];
}
