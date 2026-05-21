/**
 * Classifiers / derivations ported verbatim (typed) from the design
 * prototype so the rebuilt screens behave identically:
 *   • atoms.jsx        — COUNTRY_FLAGS, originCountry, flagFor, SOURCE_EMOJI
 *   • Compare.jsx      — milkSourceOf, dietOf, specialtiesOf, shortName,
 *                        featureBlurb
 *   • ProductDetail.jsx — NUTRIENT_BUCKETS, bucketize, HIGHLIGHTS,
 *                         highlightSegments, ingredientsParagraph
 *
 * Logic is intentionally unchanged from the prototype (incl. the loose
 * `.startsWith('yes')` string-flag reading and regex set) — these decide
 * filter membership, badges and the price tier, so any "improvement" here
 * would silently diverge the rebuilt UI from the approved design.
 *
 * The one deliberate adaptation: `highlight()` returned React `<mark>`
 * elements (DOM-only). React Native has no `<mark>`, so we expose the pure
 * tokenizer `highlightSegments()` returning ordered `{ text, tone }` spans;
 * the Phase-5 ProductDetail component renders them as styled `<Text>`. It
 * uses `String.matchAll` (the prototype used a regex-iteration loop) — the
 * resolution order is identical.
 */

import type { Formula, NutrientValue } from '../types/formula';

// A structural subset is enough for the classifiers — they only read flag
// strings. Accepting the wider `Formula` keeps call sites simple.
type Classifiable = Pick<
  Formula,
  | 'soyBased' | 'brand' | 'product' | 'partiallyHydrolyzed' | 'lactoseFree'
  | 'ar' | 'ha' | 'organic' | 'halal' | 'hmo' | 'probiotic' | 'palmOil'
  | 'stage' | 'fillers'
>;

const yes = (v: string | undefined | null): boolean =>
  !!v && v.toLowerCase().startsWith('yes');

// ── Milk source ─────────────────────────────────────────────────────────
export type MilkSource = 'Cow' | 'Goat' | 'Soy' | 'pHF' | 'eHF';

export function milkSourceOf(p: Classifiable): MilkSource {
  if (yes(p.soyBased)) return 'Soy';
  if (
    (p.brand || '').toLowerCase().includes('karihome') ||
    (p.product || '').toLowerCase().includes('goat')
  )
    return 'Goat';
  if (yes(p.partiallyHydrolyzed)) return 'pHF';
  if ((p.product || '').toLowerCase().match(/nutramigen|amino acid|extensively/))
    return 'eHF';
  return 'Cow';
}

export function dietOf(p: Classifiable): string[] {
  const flags: string[] = [];
  if (yes(p.lactoseFree)) flags.push('lactose-free');
  if (yes(p.ar)) flags.push('ar');
  if (yes(p.ha)) flags.push('ha');
  if ((p.product || '').toLowerCase().match(/nutramigen|extensively/))
    flags.push('ehf');
  if (yes(p.partiallyHydrolyzed)) flags.push('phf');
  if (!flags.length) flags.push('regular');
  return flags;
}

/** Specialty / claim badges that apply (matches prototype set semantics). */
export function specialtiesOf(p: Classifiable): Set<string> {
  const tags = new Set<string>();
  const n = (p.product || '').toLowerCase();
  if (yes(p.organic)) tags.add('organic');
  if (yes(p.halal)) tags.add('halal');
  if (yes(p.ar) || n.includes('a.r.') || n.includes('reflux'))
    tags.add('anti-reflux');
  if (yes(p.ha) || n.includes('h.a') || n.includes('hypoallergenic'))
    tags.add('hypoallergenic');
  if (
    yes(p.lactoseFree) ||
    n.includes('lactofree') ||
    n.includes('lactose-free') ||
    n.includes('lactose free')
  )
    tags.add('lactose-free');
  if (n.includes('neosure') || n.includes('premature') || n.includes('preterm'))
    tags.add('premature');
  if (yes(p.partiallyHydrolyzed)) tags.add('phf');
  if (n.includes('nutramigen') || n.includes('extensively')) tags.add('ehf');
  if (p.hmo && p.hmo.length > 2 && !p.hmo.toLowerCase().startsWith('no'))
    tags.add('hmo');
  if (
    p.probiotic &&
    p.probiotic.length > 2 &&
    !p.probiotic.toLowerCase().startsWith('no')
  )
    tags.add('probiotic');
  if (!p.palmOil || p.palmOil.toLowerCase().startsWith('no'))
    tags.add('palm-free');
  return tags;
}

/** Strip stage/format noise from a product name for headings. */
export function shortName(name: string): string {
  return (name || '')
    .replace(
      /(- Step \d+| - Stage \d+|Infant Milk Formula|Infant Formula|Milk Powder Formula)/gi,
      '',
    )
    .trim();
}

export function featureBlurb(p: Classifiable): string {
  const n = (p.product || '').toLowerCase();
  if (n.includes('gentlease') || n.includes('comfort'))
    return 'Colic & gas relief';
  if (n.includes('c-biome') || (p.hmo && p.hmo.length > 2))
    return 'Gut microbiome diversity';
  if (n.includes('lactofree') || yes(p.lactoseFree))
    return 'Lactose intolerance';
  if (n.includes('a.r.') || yes(p.ar)) return 'Anti-reflux';
  if (n.includes('h.a') || yes(p.ha)) return 'Hypoallergenic';
  if (n.includes('soy') || yes(p.soyBased)) return 'Soy-based';
  if (n.includes('goat')) return 'Goat milk alternative';
  if (n.includes('cesarbiotik') || (p.probiotic && p.probiotic.length > 2))
    return 'Probiotic';
  if (yes(p.organic)) return 'Organic farming';
  if (p.stage === 'Stage 2') return 'Brain development follow-on';
  if (p.stage === 'Stage 3') return 'Brain development toddler';
  return 'Brain development';
}

// ── Country flags ───────────────────────────────────────────────────────
export const COUNTRY_FLAGS: Record<string, string> = {
  singapore: '🇸🇬',
  malaysia: '🇲🇾',
  netherlands: '🇳🇱',
  switzerland: '🇨🇭',
  germany: '🇩🇪',
  ireland: '🇮🇪',
  spain: '🇪🇸',
  france: '🇫🇷',
  usa: '🇺🇸',
  'united states': '🇺🇸',
  us: '🇺🇸',
  australia: '🇦🇺',
  'new zealand': '🇳🇿',
  thailand: '🇹🇭',
  uk: '🇬🇧',
  'united kingdom': '🇬🇧',
  china: '🇨🇳',
  taiwan: '🇹🇼',
  'south korea': '🇰🇷',
  japan: '🇯🇵',
  indonesia: '🇮🇩',
  belgium: '🇧🇪',
  denmark: '🇩🇰',
  austria: '🇦🇹',
  philippines: '🇵🇭',
  vietnam: '🇻🇳',
};

/** "Netherlands (FrieslandCampina)" → "Netherlands". */
export function originCountry(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw.split(/[(/,]/)[0].trim();
}

export function flagFor(country: string | undefined | null): string {
  if (!country) return '';
  return COUNTRY_FLAGS[country.toLowerCase().trim()] || '🏳️';
}

export const SOURCE_EMOJI: Record<string, string> = {
  Cow: '🐄',
  Goat: '🐐',
  Soy: '🌱',
  pHF: '💧',
  eHF: '💧',
};

// ── Nutrition bucketing (ProductDetail table grouping) ──────────────────
const NUTRIENT_BUCKETS: { name: string; keys: string[] }[] = [
  {
    name: 'Macronutrients',
    keys: [
      'Energy', 'Protein', 'Fat', 'Total Fat', 'Carbohydrate',
      'Carbohydrates', 'Dietary Fibre (scFOS, Inulin)', 'Dietary Fibre',
      'Alpha-Linolenic Acid (Omega-3)', 'Alpha-Linolenic Acid (ALA)',
      'DHA (Docosahexaenoic Acid)', 'DHA',
      'ARA (Arachidonic Acid)', 'ARA',
      'Linoleic Acid (Omega-6)', 'Linoleic Acid (LA)',
      '60% Whey Protein', 'Whey Protein', 'Casein',
    ],
  },
  {
    name: 'Vitamins',
    keys: [
      'Vitamin A', 'Vitamin B1', 'Vitamin B2', 'Vitamin B6', 'Vitamin B12',
      'Vitamin C', 'Vitamin D', 'Vitamin D3', 'Vitamin E', 'Vitamin K',
      'Vitamin K1', 'Pantothenic Acid', 'Pantothenic acid', 'Folic Acid',
      'Niacin', 'Biotin', 'Choline', 'Camitine', 'Inositol', 'Myo-Inositol',
    ],
  },
  {
    name: 'Minerals',
    keys: [
      'Potassium', 'Calcium', 'Phosphorus', 'Magnesium', 'Sodium',
      'Chloride', 'Zinc', 'Copper', 'Iodine', 'Manganese', 'Selenium',
      'Iron',
    ],
  },
  {
    name: 'Bioactives',
    keys: [
      'Myo-Inositol', 'Taurine', 'Choline', 'L-Carnitine', 'Carnitine',
      'Camitine', 'Oligosaccharide blend', 'Polyunsaturated fatty acids',
      'Alpha-Lactalbumin',
      'Long chain fructo-oligosaccharides (lcFOS) (chicory root)',
    ],
  },
];

export interface NutrientBucket {
  name: string;
  rows: [string, NutrientValue][];
}

export function bucketize(
  nutrition: Record<string, NutrientValue> | null | undefined,
): NutrientBucket[] {
  if (!nutrition) return [];
  const used = new Set<string>();
  const buckets: NutrientBucket[] = NUTRIENT_BUCKETS.map((b) => {
    const rows: [string, NutrientValue][] = [];
    for (const key of b.keys) {
      if (nutrition[key] && !used.has(key)) {
        rows.push([key, nutrition[key]]);
        used.add(key);
      }
    }
    return { name: b.name, rows };
  });
  const other: [string, NutrientValue][] = [];
  for (const [k, v] of Object.entries(nutrition)) {
    if (!used.has(k)) other.push([k, v]);
  }
  if (other.length) buckets.push({ name: 'Other', rows: other });
  return buckets.filter((b) => b.rows.length);
}

// ── Ingredient highlight tokenizer (pure; RN renders the spans) ─────────
export type HighlightTone =
  | 'brain' | 'gut' | 'sugar' | 'warn' | 'allergen' | 'micro' | 'cert';

const HIGHLIGHTS: { re: RegExp; tone: HighlightTone }[] = [
  { re: /\b(DHA|Docosahexaenoic Acid)\b/gi, tone: 'brain' },
  { re: /\b(ARA|Arachidonic Acid)\b/gi, tone: 'brain' },
  { re: /\bHMO[s]?\b/g, tone: 'gut' },
  { re: /\b2['′]?-?\s?FL\b/g, tone: 'gut' },
  {
    re: /\b(Bifidobacterium[^,]*|Lactobacillus[^,]*|L\.\s?reuteri|LGG|B\.\s?lactis|Probiotic[s]?)\b/gi,
    tone: 'gut',
  },
  {
    re: /\b(Prebiotic[s]?|FOS|GOS|lcFOS|fructo-oligosaccharides|galacto-oligosaccharides)\b/gi,
    tone: 'gut',
  },
  { re: /\b(Lactose|Maltodextrin|Glucose Syrup)\b/g, tone: 'sugar' },
  { re: /\b(Palm Oil)\b/gi, tone: 'warn' },
  {
    re: /\b(Soy Lecithin|Soy(?:bean)? Oil|Soy Protein Isolate)\b/gi,
    tone: 'allergen',
  },
  { re: /\b(Fish Oil)\b/gi, tone: 'allergen' },
  {
    re: /\b(Cow['’]?s Milk|Whey|Casein|Skimmed Milk|Goat Milk)\b/gi,
    tone: 'allergen',
  },
  {
    re: /\b(Calcium|Iron|Iodine|Zinc|Vitamin [A-K]\d*|Folic Acid|Choline|Taurine|Selenium|Magnesium|Potassium)\b/gi,
    tone: 'micro',
  },
  {
    re: /\b(Halal Certified|Certified Organic|Organic Farming)\b/gi,
    tone: 'cert',
  },
];

export interface HighlightSpan {
  text: string;
  tone: HighlightTone | null;
}

/** Ordered spans; `tone === null` = plain text. Mirrors the prototype's
 *  longest-match-wins, no-overlap resolution (via `String.matchAll`). */
export function highlightSegments(text: string): HighlightSpan[] {
  if (!text) return [];
  const marks: { start: number; end: number; tone: HighlightTone }[] = [];
  for (const h of HIGHLIGHTS) {
    for (const m of text.matchAll(h.re)) {
      if (m.index === undefined) continue;
      marks.push({ start: m.index, end: m.index + m[0].length, tone: h.tone });
    }
  }
  marks.sort((a, b) => a.start - b.start || b.end - a.end);
  const filtered: typeof marks = [];
  let lastEnd = -1;
  for (const m of marks) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }
  const out: HighlightSpan[] = [];
  let cur = 0;
  for (const m of filtered) {
    if (m.start > cur) out.push({ text: text.slice(cur, m.start), tone: null });
    out.push({ text: text.slice(m.start, m.end), tone: m.tone });
    cur = m.end;
  }
  if (cur < text.length) out.push({ text: text.slice(cur), tone: null });
  return out;
}

/** Synthesised ingredients paragraph — fallback ONLY for the 2 design-only
 *  SKUs with no curated `productDetails` entry. Ported from the prototype. */
export function ingredientsParagraph(p: Classifiable): string {
  const parts: string[] = [];
  const source = milkSourceOf(p);
  if (source === 'Soy') parts.push('Soy Protein Isolate, Glucose Syrup Solids');
  else if (source === 'Goat')
    parts.push('Goat Milk Solids, Goat Whey Protein Concentrate, Lactose');
  else
    parts.push(
      "Demineralised Whey (Cow's Milk), Skimmed Cow's Milk (Cow's Milk)",
    );
  parts.push(
    'Vegetable Oils Blend (Palm Oil, Coconut Oil, Sunflower Oil, Soya Bean Oil and Canola Oil)',
  );
  parts.push("Lactose (Cow's Milk)");
  if (p.fillers && p.fillers !== 'None detected')
    parts.push(p.fillers[0].toUpperCase() + p.fillers.slice(1));
  parts.push('Maltodextrin (Corn)');
  parts.push('Long Chain Fructo-oligosaccharides (lcFOS) (Chicory Root)');
  parts.push(
    'Docosahexaenoic Acid (DHA) (Fish Oil), Arachidonic Acid (ARA) (Mortierella Alpina Oil)',
  );
  parts.push(
    'Calcium Carbonate, Potassium Citrate, Calcium Phosphate, Potassium Chloride, Magnesium Chloride, Potassium Phosphate, Sodium Citrate, Sodium Chloride, Ascorbic Acid, Calcium Hydroxide, Taurine',
  );
  parts.push(
    'Sodium Ascorbate, Soy Lecithin, Choline Chloride, Ferrous Hydroxide, Ferrous Sulfate, DL-alphatocopheryl Acetate, Zinc Sulphate, Myo-Inositol, Vitamin A Acetate, Niacinamide, Calcium Pantothenate, Cholecalciferol, Pyridoxine Hydrochloride, Ascorbyl Palmitate, Beta-Carotene, Cupric Sulphate, L-Carnitine, Phytomenadione, Cyanocobalamin, Sodium Selenite, Folic Acid, Thiamine Hydrochloride, D-Biotin, Citric Acid, Potassium Iodide, Manganese Sulfate, Riboflavin',
  );
  return parts.join(', ');
}
