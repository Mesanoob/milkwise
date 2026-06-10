# AGENTS.md — MilkWise SG

Single source of truth for this project. Read top-to-bottom on first session.
Last updated 2026-05-21.

---

## What this project is

**MilkWise SG** — an independent baby-formula comparison and price calculator
for Singapore parents. Browse 76 formula SKUs, compare them side-by-side,
calculate monthly + lifetime spend, and read plain-English guidance on
nutrition / stages / safe preparation. Health-adjacent: strong disclaimers
mandatory, no medical advice.

**Audience:** Singapore parents 26–42, mostly browsing on mobile, often
sleep-deprived. Tone is calm, factual, no marketing copy.

**Distribution:** one codebase → Web (PWA), iOS App Store, Google Play.

---

## What it's built on

| Layer       | Choice                                              |
| ----------- | --------------------------------------------------- |
| Framework   | Expo SDK 54 + Expo Router + React Native 0.81       |
| Language    | TypeScript strict mode                              |
| Styling     | NativeWind (Tailwind for RN) + tokens in `theme.ts` |
| Charts      | `react-native-svg`                                  |
| State       | React hooks + 2 contexts (`ProductsContext` legacy, `FormulaCompareContext` new) |
| Persistence | `@react-native-async-storage/async-storage`         |
| Fonts       | Inter / Inter Tight / JetBrains Mono via `@expo-google-fonts/*` |
| Data        | Bundled JSON — `products.json` (61 curated) + `formulas.json` (76 merged) + `productDetails.json` + `nutrition.json` |

`npm install`, `npm run typecheck`, `npm run web` (port 8081). Use Puppeteer
MCP for visual QA — Chrome MCP localhost grant doesn't work in this setup.

---

## Where things live

| Path                                                            | What                                                |
| --------------------------------------------------------------- | --------------------------------------------------- |
| `/Users/dave/Documents/Codex/Projects/milkwise-Codex-design/milkwise/` | **Project root** — the Expo app                  |
| `../MilkWiseFinalDesign/`                                       | **Design references** — the canonical web prototype port source |
| `../MilkWiseFinalDesign/ui_kits/website/*.jsx`                  | Per-page design ports (Home, Compare, ProductDetail, Calculator, HeadToHead, Pages) |
| `../MilkWiseFinalDesign/colors_and_type.css`                    | Design tokens (matched in `src/config/theme.ts` + `global.css`) |
| `../MilkWiseFinalDesign/data/`                                  | `formulas.json` + `nutrition.json` — copied to `src/data/` |
| `app/`                                                          | Expo Router screens (`index`, `compare`, `head-to-head`, `product/[id]`, `calculator`, `most-sold`, `nutrition`, `parents`, `about`) |
| `src/components/`                                               | Shared UI components (Header/NavBar, Footer, DisclaimerBanner, Screen, Section, HeroMesh, SourceBadge) |
| `src/components/compare/v2/`                                    | Compare-page sub-components (atoms, StageTabs, BrandBar, Toolbar, FilterPanel, GridCard, ListRow, CompareTray) |
| `src/contexts/`                                                 | ThemeContext, ProductsContext (legacy), FormulaCompareContext (new) |
| `src/data/formulas.ts`                                          | Merge engine — joins design's 76 SKUs to current products.json via name-normalizer + 6-entry alias map |
| `src/utils/formulaClassifiers.ts`                               | Typed ports of design classifiers (`milkSourceOf`, `specialtiesOf`, `bucketize`, `highlightSegments`, `ingredientsParagraph`, …) |
| `src/utils/formulaFormat.ts`                                    | Design-exact $ / per-gram formatters (separate from `src/utils/format.ts` which uses `S$` for legacy screens) |
| `assets/products/`                                              | 72 normalized WebP packshots (§7c pipeline: 1200×1200 transparent, 84% content height) |
| `src/data/imageMap.ts`                                          | Auto-generated `require()` map for the WebP packshots — regenerate via `npm run generate:images` |

---

## GitHub repo + branches

- **Remote:** `github.com:Mesanoob/milkwise` (do NOT push to `main` or any branch unless asked)
- **`final-design-rebuild`** ⭐ **active** — cut from `FinalDesign`. Pushed at `6dd906e` (Phases 0–1); subsequent commits (`ac618b8` for Phases 2–9 + the Calculator rebuild + this AGENTS.md trim) are local and ready to push.
- `FinalDesign` — previous baseline (v2 re-skin Phases 0–7 + §9c calculator redesign + dark-mode latency fixes). Left as the rollback target.
- `redesign-v2` — preserved snapshot from the v2 re-skin work.
- `testingprod` — original v1 design (forest green, DM fonts). Shippable; untouched.
- `main` — do not touch.

---

## What's been done

The site has been ported page-by-page from `../MilkWiseFinalDesign/` into
this RN/Expo app. Web pixel-1:1, native "close not exact" (mesh, sticky
nav, blur, `<mark>` highlights all have documented native fallbacks).

- **Tokens** — Design's `colors_and_type.css` already matched
  `theme.ts`/`global.css`; added the few missing pieces (`layout.sidebar`,
  theme-split `palette.focusRing`, exact `--mw-mesh*` CSS vars).
- **Data** — Merged 76-row `Formula[]` dataset in `src/data/formulas.ts`:
  design's flat shape as the component contract, enriched with curated
  ingredients / allergens / WebP images from this repo's products.json +
  productDetails.json. Join: name normalizer + 6-entry alias map; 74/76
  match curated content, 2 design-only SKUs fall back to brand WebP.
  Ported design classifiers + formatters to typed TS.
- **App shell** — New NavBar (🍼 wordmark + SG pill, 6 nav links incl.
  Most Sold per user decision, 🇸🇬/SGD/theme toggle, hamburger flyout),
  DisclaimerBanner (persisted dismiss), 4-col Footer. BottomNav retired.
  Routing: `/` = Home, `/compare` = Compare, plus `/nutrition`,
  `/parents`, `/head-to-head`. Screen wraps Banner + NavBar + scroll
  content + Footer.
- **9 pages** — Home (mesh hero + stats + features + steps + butter
  disclaimer), Compare (StageTabs + BrandBar + Toolbar + FilterPanel +
  GridCard / ListRow + CompareTray, tray survives nav via
  FormulaCompareContext), Product Detail (breadcrumb + hero card with
  7 badge tones + DHA/ARA tone highlights + price ranking + 9-cell
  specs + claims + ingredients + bucketized nutrition + similar),
  Head-to-Head (empty/1-up/2-3-way with best-cell sage highlight),
  Calculator (`What you'll actually spend.` layout — INTAKE BENCHMARK +
  2×2 CountUp ResultCards + Singapore Feeding Benchmark line chart +
  Formula Usage & Cost tiles + Monthly bars + Estimated Lifetime Spend +
  cumulative curve + Causeway saving + HPB Guidelines table; DOB
  persisted via AsyncStorage; constrained Tin Size dropdown by selected
  product's variants), Most Sold (unchanged — already on v2 tokens +
  inherits chrome), Nutrition Guide (feeding table + safe-prep steps +
  pHF/eHF + key nutrients), For New Parents (stages + milk sources +
  cost drivers + flag cards), About (mission + methodology + T&C).
- **Dead code removed** — `src/utils/feedingCalculator.ts`,
  `src/data/feedingGuidelines.ts`, and the four files in
  `src/components/calculator/` (BenchmarkChart, SpendChart,
  CumulativeSpendChart, Stepper) are deleted — the calculator rebuild
  inlines the math + new SVG charts directly.

Verified: `npm run typecheck` = 0. Puppeteer sweep at 1280×900 + 375×812
in both themes — all 9 routes render, dark-mode tokens flip atomically,
in-app navigation preserves Compare tray + persisted DOB.

---

## Next steps

1. **Push** `final-design-rebuild` to `origin/final-design-rebuild`
   (currently only Phases 0–1 are on remote; everything since is local).
2. **Open a PR** against `FinalDesign` (or `main` once ready). The phase
   table at the top of "What's been done" is the executive summary; the
   diff against `FinalDesign` is the change set.
3. **Phase-10 polish backlog** — known residuals that didn't warrant
   immediate fix and can ship in follow-up PRs:
   - Sticky Compare StageTabs + Toolbar (scroll away today)
   - Real sort-dropdown UI (Compare toolbar currently tap-to-cycle)
   - Compare in-toolbar search field (currently absent post P2)
   - H2H side-by-side table layout at 375px (tight today; consider
     stacking product columns vertically as cards on phones)
   - PDF download in H2H (currently `alert()` stub)
   - Safari sweep (all visual QA was Chromium/Puppeteer)
   - Real-device pass on iPhone Safari + Android Chrome
   - PWA "Add to Home Screen" prompt
   - Lighthouse audit on built bundle (target a11y ≥ 95, perf ≥ 85)
4. **Launch blockers** (pre-existing from earlier work):
   - Production hosting (Vercel or Cloudflare Pages) + auto-deploy
   - Domain + DNS
   - Legal pages — privacy, terms, medical/health disclaimer
   - SEO metadata — title, description, OG image, favicon, robots.txt, sitemap.xml
   - `npm audit` triage (4 moderate vulnerabilities at last check)
   - Plausible analytics + Sentry error tracking
5. **Native delivery** (Phase ∞ if mobile-first becomes the target):
   - Apple Developer + Google Play accounts
   - Native fidelity true-up (the documented mesh / sticky / blur / PDF
     compromises become real on those platforms)

---

## House rules

- **Mode: shipping.** Production-grade code with comments on the *why*.
  No "you-try-first" mentor protocol unless the user types
  `switch to mentor mode`.
- **Don't push** to `main` or any branch unless the user explicitly asks.
- **Don't commit** unless the user explicitly asks.
- **Tokens, not hex.** Every colour reads from `theme.ts` palette or
  `mw-*` Tailwind utility. The only exceptions are the spec-frozen
  palettes (`specialtyColors`, `stageColors`, chip palette in
  `compare/v2/atoms.tsx`, HeroBadge tones in `product/[id].tsx`).
- **Mono on numerals.** Every isolated price / ratio / per-unit / scoop
  count / month uses `fonts.mono` or `fonts.monoMedium` +
  `fontVariant: ['tabular-nums']`.
- **`text-muted` is the v1 cool grey** still leaking in via Tailwind in a
  few legacy spots. Use `text-mw-text-muted` for new code.
- **WebP only** for product images. Never reference the design's
  `MilkWiseFinalDesign/assets/products/*.jpg` from runtime code — only
  `src/data/imageMap.ts` (Metro `require()` map of `assets/products/*.webp`).
- **Run `npm run typecheck` before claiming done. Must be 0 errors.**
