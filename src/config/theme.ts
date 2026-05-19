/**
 * Design tokens — the single source of truth for brand colour, spacing,
 * typography, and elevation used anywhere in the app.
 *
 * WHY this file exists separately from `tailwind.config.js`:
 *   Tailwind config drives `className="bg-mw-bg"` (NativeWind/web styling),
 *   but pieces of the app written in plain `StyleSheet` / RN `style` props
 *   (which can't take a class) read the same values via
 *   `useTheme().tokens` → `themeFor(scheme)`. Both files are mirrors and
 *   must stay in sync.
 *
 * The v1 flat palette / t-shirt scales were removed in the v2 re-skin
 * Phase 4c. Everything theme-reactive now flows through `palette` +
 * `themeFor`; `specialtyColors` / `stageColors` are the only flat,
 * spec-exact maps that deliberately survive (design-handoff contract).
 */

// ── Specialty colours ───────────────────────────────────────────────────────
// One colour pair per specialty tag. Each entry has a `bg` (light tint used
// as pill background) and a `fg` (dark variant used for text + border + icon).
//
// These hex values are LIFTED VERBATIM from the design handoff
// (`SPECIALTY_COLOR` map in the prototype `index.html`). Do not "fix" the
// contrast or tune the hues — the design team picked these to read as a
// coherent system across all 11 specialties. Every pair is WCAG AA at the
// 10–12px tag sizes we ship.
//
// Keys MUST match the raw specialty strings in `products.json` — see
// `ALL_SPECIALTIES` in `src/data/products.ts`.
export const specialtyColors = {
  ar:             { bg: '#FEF3C7', fg: '#92400E' }, // anti-reflux — warm amber
  budget:         { bg: '#DBEAFE', fg: '#1E40AF' }, // value/budget — blue
  csection:       { bg: '#F3E8FF', fg: '#6B21A8' }, // c-section recovery — purple
  gentle:         { bg: '#FCE7F3', fg: '#9D174D' }, // gentle digestion — pink
  goat:           { bg: '#FEF9C3', fg: '#713F12' }, // goat milk — mustard
  ha:             { bg: '#EDE9FE', fg: '#6D28D9' }, // hypoallergenic-lite (HA) — violet
  hypoallergenic: { bg: '#FFE4E6', fg: '#9F1239' }, // full hypoallergenic — rose
  lactosefree:    { bg: '#E0F2FE', fg: '#0369A1' }, // lactose-free — sky blue
  organic:        { bg: '#DCFCE7', fg: '#166534' }, // organic — fresh green
  premature:      { bg: '#FFF7ED', fg: '#9A3412' }, // premature/low-birthweight — orange
  soy:            { bg: '#D1FAE5', fg: '#065F46' }, // soy-based — emerald
} as const;

// ── Stage badge palette ─────────────────────────────────────────────────────
// Subtle pastel pills used to flag what life stage a formula targets.
// Also lifted from the design handoff. Each stage has its own colour so the
// eye can spot "Stage 1 vs Stage 2" without reading the text.
export const stageColors = {
  'Stage 1': { bg: '#DBEAFE', fg: '#1E40AF' },
  'Stage 2': { bg: '#FCE7F3', fg: '#9D174D' },
  'Stage 3': { bg: '#D1FAE5', fg: '#065F46' },
  'Newborn': { bg: '#FFE4E6', fg: '#9F1239' },
} as const;

export type StageKey = keyof typeof stageColors;

export type SpecialtyKey = keyof typeof specialtyColors;

// ── Typography (v2 design system) ───────────────────────────────────────────
// Font family names must match the keys passed to `useFonts` in
// `app/_layout.tsx`. The `@expo-google-fonts/*` packages use the literal
// "<Family>_<Weight><Style>" naming convention — keep it intact.
//
// On native, React Native does NOT synthesise weights for custom fonts —
// `fontWeight: '700'` on `Inter_400Regular` renders at 400. To get a
// heavier cut you MUST set the explicit family. Hence one key per weight.
//
// v2 roles (from design-reference/tokens.ts):
//   • display — Inter Tight 600/700 — headings, big numbers-as-headlines
//   • body    — Inter 400/500/600  — UI + prose (no 700: 600 is the ceiling)
//   • mono    — JetBrains Mono 400/500 — every price/ratio/per-unit numeral
export const fonts = {
  // Semantic v2 keys — prefer these in new/migrated code.
  displaySemibold: 'InterTight_600SemiBold',
  displayBold:     'InterTight_700Bold',
  body:            'Inter_400Regular',
  bodyMedium:      'Inter_500Medium',
  bodySemibold:    'Inter_600SemiBold',
  mono:            'JetBrainsMono_400Regular',
  monoMedium:      'JetBrainsMono_500Medium',
} as const;

// ── Shape ───────────────────────────────────────────────────────────────────
// v2 semantic radii (design-reference/tokens.ts — canonical). The v1
// t-shirt keys (sm/md/lg/xl/full) were removed in Phase 4c. Phase 6
// applies these per the §7b surface rules.
export const radius = {
  input: 8,
  card: 12,
  cardLg: 18,
  pill: 999,
  circle: 9999,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// v2 DESIGN SYSTEM TOKENS — canonical, ported from design-reference/tokens.ts
// ════════════════════════════════════════════════════════════════════════════
// Phase 2 of the re-skin MAKES these available; it does NOT yet wire them into
// components (that is Phase 4's hex sweep) or make them flip with the OS theme
// (that is Phase 3's mechanism). The v1 exports above remain the live values
// until Phase 4 migrates every call site, after which the v1 block is deleted.
//
// Source of truth is the upstream CSS (`colors_and_type.css`). Do NOT hand-tune
// these hex values — fix the CSS upstream and re-port. `specialtyColors` /
// `stageColors` are deliberately NOT part of v2: they are spec-exact per the
// design handoff and survive the re-skin unchanged.

export const palette = {
  light: {
    bg: '#F7F3EA',
    bgPanel: '#EFE9DA',
    bgCard: '#FCF8EE',
    bgInverse: '#25241F',

    text: '#2A2823',
    textMuted: '#6E6A60',
    textFaint: '#9B9789',
    textInverse: '#F7F3EA',

    accent: '#6B9682',
    accentHover: '#547A68', // also the "pressed" state on native
    accentSoft: '#D6E3DA', // best-value highlight
    accentTint: '#E8EFE9', // row hover -> row pressed/selected
    // a11y role token (Phase 7). `accent` is brand-locked but only ~3:1
    // on light surfaces → fails WCAG AA as SMALL text / as a small-text
    // badge fill. `accentText` is a darker same-hue sage derived to clear
    // 4.5:1 on every light surface (~5:1 on bgPanel/bgCard/bg). Use for
    // small accent text/links + accent badge/chip/header fills carrying
    // text. Large display accent / fills / borders / bars keep `accent`
    // (they clear the 3:1 large-text/UI bar). Derivation in §9b; push
    // upstream to design-reference per §7b when possible.
    accentText: '#3F6B54',

    cream: '#E8D4BC',
    creamSoft: '#F2E4CE',
    creamTint: '#FAF1DF',

    butter: '#F0DC9A',
    butterSoft: '#F8ECC4',

    clay: '#D4A893',
    claySoft: '#EBD4C5',

    info: '#7DA1B2',
    infoSoft: '#D8E3E8',

    danger: '#B07A78',
    dangerSoft: '#EAD4D2',

    warnBg: '#F8ECC4',
    warnText: '#7A5A1F',

    success: '#6B9682',

    border: '#DCD3BD',
    borderStrong: '#C0B79F',
    divider: '#E5DDC8',

    navBg: 'rgba(247,243,234,0.82)',
    // --mw-shadow-focus colour (the 3px input-focus halo). Theme-split per
    // colors_and_type.css: light 0.20, dark 0.25. Phase 4 form-porting
    // renders this as the focus ring on .mw-input-equivalents. Additive —
    // nothing consumes it before Phase 4.
    focusRing: 'rgba(107,150,130,0.20)',
  },
  dark: {
    bg: '#1A1916',
    bgPanel: '#232220',
    bgCard: '#2A2925',
    bgInverse: '#F7F3EA',

    text: '#F0EBDD',
    textMuted: '#B5AF9F',
    textFaint: '#837E70',
    textInverse: '#1A1916',

    accent: '#9CC4AB',
    accentHover: '#B8D6C3',
    accentSoft: '#2F4A3B',
    accentTint: '#2A332E',
    // a11y role token (Phase 7). Dark accent is light-sage on near-black
    // and already clears AA as small text (~7:1) and as a badge fill with
    // `textInverse`; reuse it so the role is theme-symmetric.
    accentText: '#9CC4AB',

    cream: '#6B5A40',
    creamSoft: '#4A4030',
    creamTint: '#332D22',

    butter: '#C9B26B',
    butterSoft: '#443D24',

    clay: '#B08770',
    claySoft: '#4A3A30',

    info: '#A8C4D2',
    infoSoft: '#2A3640',

    danger: '#C99693',
    dangerSoft: '#4A332F',

    warnBg: '#443D24',
    warnText: '#E8D38C',

    success: '#9CC4AB',

    border: '#3A3833',
    borderStrong: '#524F47',
    divider: '#2F2D29',

    navBg: 'rgba(26,25,22,0.78)',
    focusRing: 'rgba(156,196,171,0.25)',
  },
} as const;

/** 4px base spacing scale (key === step number in the upstream CSS). */
export const space = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
  8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96, 30: 120,
} as const;

export const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** v2 type scale (px), from design-reference/tokens.ts. */
export const fontSize = {
  displayXl: 72, displayL: 56, displayM: 40,
  h1: 36, h2: 28, h3: 22, h4: 18,
  body: 16, bodyS: 14, caption: 13, micro: 11,
  dataXl: 56, dataL: 36, dataM: 22, dataS: 15,
} as const;

export const lineHeight = {
  tight: 1.08, snug: 1.2, normal: 1.5, relaxed: 1.7,
} as const;

/**
 * Tracking is `em` in the CSS; RN `letterSpacing` is px. Convert per use site:
 *   letterSpacing = tracking(trackingEm.tight, fontSizePx)
 */
export const trackingEm = {
  tight: -0.022, // display headlines
  snug: -0.012,
  normal: 0,
  caps: 0.08, // small-caps eyebrow (pair with textTransform: 'uppercase')
} as const;
export const tracking = (em: number, size: number) => em * size;

export const motion = {
  // cubic-bezier(0.2, 0.6, 0.2, 1) — feed to Reanimated Easing.bezier(...)
  easeBezier: [0.2, 0.6, 0.2, 1] as const,
  durFast: 150,
  durBase: 200,
  durSlow: 320,
};

export const layout = {
  maxContent: 1200, // web/PWA only; native screens are full-width
  maxProse: 680,
  sidebar: 280, // --mw-sidebar: design's desktop filter-column width
  navH: 64,
  bannerH: 36,
} as const;

/**
 * v2 elevation. Named `elevation` (not `shadow`) so it doesn't collide with
 * the still-live v1 `shadow` export. Theme-keyed: dark needs a heavier,
 * pure-black shadow to register on near-black surfaces. RN consumes these
 * style objects directly; on web NativeWind maps them fine.
 *   s1 = resting card · s2 = hover/float · s3 = modals only
 */
export const elevation = {
  light: {
    s1: { shadowColor: '#2A2823', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    s2: { shadowColor: '#2A2823', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 4 },
    s3: { shadowColor: '#2A2823', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.09, shadowRadius: 48, elevation: 12 },
  },
  dark: {
    s1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.40, shadowRadius: 3, elevation: 1 },
    s2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.50, shadowRadius: 20, elevation: 4 },
    s3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.60, shadowRadius: 48, elevation: 12 },
  },
  // 3px focus halo: render as a same-radius outer View, accent @ ~0.20 opacity.
  focusHaloOpacity: 0.2,
} as const;

/**
 * Hero-mesh anchor colours — the single biggest native-fidelity compromise.
 * The CSS mesh (6 stacked gradients + blend modes + vignette) can't be
 * reproduced in RN; preferred route is the pre-rendered plate in the design
 * repo's `design-reference/hero-mesh/`. These anchors back the SVG fallback.
 */
export const heroMesh = {
  light: {
    base: ['#F2E4CE', '#F7F3EA', '#EBD4C5'],
    blobs: ['rgba(217,168,116,0.55)', 'rgba(212,168,147,0.70)', 'rgba(196,142,130,0.55)', 'rgba(240,220,154,0.55)', 'rgba(165,110,90,0.45)'],
    vignette: 'rgba(110,70,50,0.18)',
  },
  dark: {
    base: ['#2A2520', '#1A1916', '#2F221C'],
    blobs: ['rgba(140,90,70,0.42)', 'rgba(120,80,70,0.55)', 'rgba(100,60,50,0.45)', 'rgba(160,130,70,0.30)', 'rgba(80,50,40,0.55)'],
    vignette: 'rgba(0,0,0,0.45)',
  },
} as const;

export type Scheme = keyof typeof palette;

/**
 * Resolve the full v2 token set for one colour scheme. Phase 3's ThemeContext
 * calls this with the active scheme; components read theme-correct colours
 * without any per-component hex.
 */
export const themeFor = (s: Scheme) => ({
  colors: palette[s],
  shadow: elevation[s],
  heroMesh: heroMesh[s],
  space,
  radius,
  fonts,
  fontSize,
  weight,
  lineHeight,
  trackingEm,
  tracking,
  motion,
  layout,
  specialtyColors,
  stageColors,
});
export type V2Theme = ReturnType<typeof themeFor>;
