/**
 * `Formula[]` — the merged, design-shaped dataset the rebuilt screens read.
 *
 * STRATEGY (validated in Phase 1 exploration):
 *   The design's `formulas.json` (76 rows) is the same curated catalogue as
 *   our `products.json` (61 products) with pack-size variants un-nested. So
 *   we take the design rows verbatim as the component contract (all price
 *   numerics already derived, exactly the shape ported screens expect) and
 *   ENRICH each row from the current app:
 *     • `id`          — stable `/product/[id]` slug from the matched product
 *     • `img`         — the matched variant's WebP (never a design JPG; the
 *                        §7c WebP pipeline is the only image source)
 *     • `ingredients` — curated text from `productDetails.json`
 *     • `allergens`   — prefer curated `productDetails.allergen`, else the
 *                        design row's own `allergens`
 *
 * Join = aggressive name normalisation + a 6-entry alias map for verbose
 * design names. 74/76 rows resolve to a current product (and get curated
 * ingredients). The 2 genuinely design-only SKUs (Aptamil "+ Free Mideer"
 * promo dupe, Wyeth Stage-3 line) get a derived slug + a same-brand WebP
 * fallback; their ingredients fall back to the synthesised paragraph at
 * render time (`ingredientsParagraph`).
 *
 * `products.json` stays the single source of truth — this module derives
 * from it at load; nothing here is hand-maintained. `Product` /
 * `ProductDetail` are untouched (Most Sold + Calculator still use them).
 */

import rawFormulas from './formulas.json';
import productsJson from './products.json';
import detailsJson from './productDetails.json';
import type { Formula } from '../types/formula';
import type { Product, ProductDetail } from '../types/product';

const products = productsJson as unknown as Product[];
const details = detailsJson as unknown as Record<string, ProductDetail>;

// ── Name join ───────────────────────────────────────────────────────────
// Strip accents, punctuation and format-noise words so verbose design
// names collapse onto our `fullName`s. Tuned in Phase 1 so 68/76 match
// directly; the remaining 6 verbose variants are pinned by ALIAS below.
const norm = (s: string): string =>
  (s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(
      /\b(infant|milk|powder|formula|the|for|months?|step|stage|growing|up|follow|on|drink|specialized|special)\b/g,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();

// design `product` string → current `fullName` (verbose-name variants the
// normaliser alone can't collapse; verified 1:1 in Phase 1).
const ALIAS: Record<string, string> = {
  'Frisolac Gold Infant Formula Milk Powder - From 0-6 Months':
    'Frisolac Gold Infant Formula',
  'Nestle Nan Sensitive Specialized Infant Formula -Stage 1':
    'Nestle Nan Sensitive Specialized Infant Formula - Stage 1',
  'Enfamil Pro A+ Follow On Infant Milk Formula - Stage 2':
    'Enfamil Pro A+ Follow-On Formula - Stage 2',
  'Frisolac Gold Follow On Milk Formula - Stage 2':
    'Frisolac Gold Follow-on Formula - Stage 2',
  'Friso Gold Growing Up Milk Formula - Stage 3':
    'Friso Gold Growing Up Formula Milk Powder - Stage 3',
  'Nestle Nan Optipro Growing up Milk Formula - Stage 3':
    'Nestle NAN OPTIPRO Toddler Growing Up Milk (Now with 5-MO Complex) - Stage 3',
};

const byNormName = new Map<string, Product>();
for (const p of products) byNormName.set(norm(p.fullName), p);

// Same-brand WebP fallback for the 2 genuinely design-only SKUs (keyed by
// the design `product` string). Must be an existing key in imageMap.ts.
const DESIGN_ONLY_IMG: Record<string, string> = {
  'Aptamil Gold+ Toddler Milk Formula - Stage 3 + Free Mideer':
    'Aptamil_Gold-Plus_900g_Stage3.webp',
  'Wyeth S26 Progress Gold Grow Up Milk Formula - Stage 3':
    'Wyeth_S-26-Gold-PRO_900g_Stage1.webp',
};

const basename = (path: string): string => path.split('/').pop() || path;

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' ? v : 0);

function buildFormulas(): Formula[] {
  const usedIds = new Set<string>();

  return (rawFormulas as Record<string, unknown>[]).map((d) => {
    const product = str(d.product);
    const packSize = num(d.packSize);
    const match = byNormName.get(norm(ALIAS[product] || product));

    let id: string;
    let img: string;
    let ingredients: string | undefined;
    let allergens = str(d.allergens);

    if (match) {
      // Pick the variant for this pack size (fall back to the default).
      const variant =
        match.variants.find((v) => v.weightG === packSize) ??
        match.variants[0];
      img = basename(variant?.img ?? match.img ?? '');
      // Single-variant products keep the bare slug (preserves existing
      // /product/<slug> URLs); multi-variant rows are disambiguated by size.
      id =
        match.variants.length > 1
          ? `${match.id}--${packSize}`
          : match.id;
      const det = details[match.id];
      if (det) {
        if (det.ingredients) ingredients = det.ingredients;
        if (det.allergen) allergens = det.allergen;
      }
    } else {
      // Genuinely design-only SKU.
      img = DESIGN_ONLY_IMG[product] ?? '';
      id = slugify(`${str(d.brand)} ${product} ${packSize}`);
    }

    // Guarantee uniqueness even if two rows ever collide on the same slug.
    let uniqueId = id;
    let n = 2;
    while (usedIds.has(uniqueId)) uniqueId = `${id}--${n++}`;
    usedIds.add(uniqueId);

    return {
      id: uniqueId,
      img,
      ingredients,
      stage: str(d.stage),
      brand: str(d.brand),
      origin: str(d.origin),
      product,
      packSize,
      price: num(d.price),
      pricePerGram: num(d.pricePerGram),
      scoopSize: num(d.scoopSize),
      waterPerScoop: num(d.waterPerScoop),
      scoopsPerTin: num(d.scoopsPerTin),
      pricePerScoop: num(d.pricePerScoop),
      manufacturedIn: str(d.manufacturedIn),
      milkOrigin: str(d.milkOrigin),
      soyBased: str(d.soyBased),
      halal: str(d.halal),
      lactoseFree: str(d.lactoseFree),
      ar: str(d.ar),
      ha: str(d.ha),
      organic: str(d.organic),
      allergens,
      probiotic: str(d.probiotic),
      hmo: str(d.hmo),
      wheyCasein: str(d.wheyCasein),
      partiallyHydrolyzed: str(d.partiallyHydrolyzed),
      palmOil: str(d.palmOil),
      mainSugar: str(d.mainSugar),
      fillers: str(d.fillers),
    };
  });
}

// Built once at module load — the inputs are static bundled JSON.
const formulas: Formula[] = buildFormulas();

/** Every formula (one row per pack size). Returns a copy so callers may
 *  sort/filter freely without mutating the shared dataset. */
export const getAllFormulas = (): Formula[] => [...formulas];

/** Look up by the stable `/product/[id]` slug. */
export const getFormulaById = (id: string): Formula | undefined =>
  formulas.find((f) => f.id === id);

/**
 * Resolve a `/product/[id]` URL parameter that may carry the stripped
 * base id of a multi-variant product (Compare drops the `--<packSize>`
 * suffix when routing). Tries exact match first, then falls back to the
 * first formula whose stripped id equals the parameter — that's the
 * product's "default variant" (the v1 single-product page semantics).
 */
export const getFormulaByBaseId = (baseId: string): Formula | undefined => {
  const exact = formulas.find((f) => f.id === baseId);
  if (exact) return exact;
  return formulas.find((f) => f.id.split('--')[0] === baseId);
};

/** Every variant a multi-pack product is sold in (same base id). Used by
 *  ProductDetail to show all available tin sizes for the active product. */
export const getFormulaVariants = (baseId: string): Formula[] =>
  formulas.filter((f) => f.id.split('--')[0] === baseId);

/** Look up by the design's natural key (product name + pack size) — used by
 *  the compare tray / head-to-head which carry `product`+`packSize`. */
export const getFormulaByKey = (
  product: string,
  packSize: number,
): Formula | undefined =>
  formulas.find((f) => f.product === product && f.packSize === packSize);

/** Alphabetical unique brands (for the Compare brand strip). */
export const ALL_FORMULA_BRANDS: readonly string[] = Array.from(
  new Set(formulas.map((f) => f.brand)),
).sort((a, b) => a.localeCompare(b));

/** Canonical stage order (hard-coded so an empty list can't collapse the
 *  Compare stage tabs). */
export const ALL_FORMULA_STAGES: readonly string[] = [
  'Stage 1',
  'Stage 2',
  'Stage 3',
];
