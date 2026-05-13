/**
 * Singapore HPB (Health Promotion Board) / KKH (KK Women's and Children's Hospital)
 * infant formula feeding guidelines, indexed by age in months.
 *
 * Source: HPB infant feeding recommendations + KKH infant formula preparation guide.
 * These are population-level guidelines — always defer to a paediatrician for
 * individual advice, which is why we surface the disclaimer prominently in the UI.
 */

export interface FeedingGuideline {
  m: number;       // month of age (0 = newborn)
  label: string;   // human-readable age label
  mlMin: number;   // minimum ml per individual feed
  mlMax: number;   // maximum ml per individual feed
  fMin: number;    // minimum feeds per day
  fMax: number;    // maximum feeds per day
  dMin: number;    // minimum total daily ml
  dMax: number;    // maximum total daily ml
  note: string;    // HPB developmental note for this age
}

export const SG_GUIDELINES: FeedingGuideline[] = [
  { m: 0,  label: 'Birth',      mlMin: 60,  mlMax: 90,  fMin: 8,  fMax: 12, dMin: 480,  dMax: 1080, note: 'Very frequent feeds; stomach is tiny (~5–7ml at day 1, ~45ml by week 1)' },
  { m: 1,  label: '1 month',    mlMin: 90,  mlMax: 120, fMin: 7,  fMax: 9,  dMin: 630,  dMax: 1080, note: 'Growth spurt often around 3 weeks' },
  { m: 2,  label: '2 months',   mlMin: 120, mlMax: 150, fMin: 6,  fMax: 8,  dMin: 720,  dMax: 1200, note: 'Feeds becoming more predictable' },
  { m: 3,  label: '3 months',   mlMin: 150, mlMax: 180, fMin: 5,  fMax: 7,  dMin: 750,  dMax: 1260, note: 'Many babies begin stretching feeds at night' },
  { m: 4,  label: '4 months',   mlMin: 150, mlMax: 200, fMin: 5,  fMax: 6,  dMin: 750,  dMax: 1200, note: '4-month sleep regression is common' },
  { m: 5,  label: '5 months',   mlMin: 180, mlMax: 210, fMin: 4,  fMax: 6,  dMin: 720,  dMax: 1260, note: 'Watch for signs of readiness for solids' },
  { m: 6,  label: '6 months',   mlMin: 180, mlMax: 210, fMin: 4,  fMax: 5,  dMin: 720,  dMax: 1050, note: 'HPB recommends introducing solids at 6 months' },
  { m: 7,  label: '7 months',   mlMin: 180, mlMax: 210, fMin: 3,  fMax: 5,  dMin: 540,  dMax: 1050, note: 'Milk remains primary nutrition; solids are complementary' },
  { m: 8,  label: '8 months',   mlMin: 170, mlMax: 210, fMin: 3,  fMax: 4,  dMin: 510,  dMax: 840,  note: 'Texture progression in solids — lumpy/mashed' },
  { m: 9,  label: '9 months',   mlMin: 170, mlMax: 200, fMin: 3,  fMax: 4,  dMin: 510,  dMax: 800,  note: 'Finger foods can be introduced' },
  { m: 10, label: '10 months',  mlMin: 150, mlMax: 200, fMin: 3,  fMax: 4,  dMin: 450,  dMax: 800,  note: 'Milk intake naturally begins to decrease' },
  { m: 11, label: '11 months',  mlMin: 150, mlMax: 180, fMin: 3,  fMax: 3,  dMin: 450,  dMax: 540,  note: 'Approaching transition to cow\'s milk at 12 months' },
];

/** Reduction factor applied to formula once solids are introduced at 6m+ */
export function solidsFactor(m: number): number {
  if (m >= 9) return 0.75;
  if (m >= 7) return 0.85;
  if (m >= 6) return 0.92;
  return 1.0;
}
