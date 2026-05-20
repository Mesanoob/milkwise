# CLAUDE.md — MilkWise SG

Single source of truth for this project. Read top-to-bottom on first session, then jump back to sections 8, 9, 9b, **9c**, and **9d (FINAL DESIGN REBUILD — latest)** as work progresses. Last updated 2026-05-20.

> **▶ START HERE (2026-05-20):** Active branch is **`final-design-rebuild`** (cut from `FinalDesign`, pushed `origin/final-design-rebuild` at commit `6dd906e` — Phases 0–1 only; **Phases 2–9 work-in-progress, uncommitted**). The rebuild ports `../MilkWiseFinalDesign/` (a full new web design — 6 nav pages incl. Home/Nutrition/Parents and a Head-to-Head overlay) into this RN/Expo app while preserving cross-platform. **See §9d for the full rebuild plan + per-phase status + handoff.** ⚠️ **Run `npm install` first** if reinstalling.

> **✅ v2 design re-skin COMPLETE (Phases 0–7) on `FinalDesign`** — see §9b for full trail; left as the stable baseline. The new branch `final-design-rebuild` builds the FULL design replacement on top.

> **✅ Final-design rebuild COMPLETE — all 9 phases shipped (2026-05-20).** Token reconciliation (P0), merged 76-row Formula dataset with WebP-only imagery (P1), new app shell with NavBar+DisclaimerBanner+Footer (P2), Home with mesh hero (P3), Compare with FormulaCompareContext (P4), Product Detail with HeroBadge+RankRow+HighlightedText+bucketize-nutrition (P5), Head-to-Head with best-cell highlights (P6), Calculator picker migrated to Formula[] via thin adapter (P7), Nutrition Guide + For New Parents + About long-form content + Most Sold chrome inheritance (P8), final cross-cutting QA + 9-route mobile (375px) + dark sweep (P9). **`typecheck = 0`**. Known residuals listed at the bottom of §9d.

---

## 1. Project

**MilkWise SG** — side-by-side baby formula comparison tool for Singapore parents.

- **Catalogue:** 76 hand-curated products, 15 brands, prices and nutrition from major SG retailers
- **Distribution:** one codebase → Web (PWA), iOS App Store, Google Play
- **Audience:** Singapore parents, mobile-first
- **Posture:** health-adjacent — strong disclaimers required, no medical advice

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54 + Expo Router + React Native 0.81 |
| Language | TypeScript strict mode |
| Styling | NativeWind (Tailwind for RN) + tokens in `src/config/theme.ts` |
| Data | Bundled `products.json` (61) + `productDetails.json` |
| State | React hooks + one Context (`ProductsContext`) for filter/selection persistence |
| Fonts | DM Sans 300-700 + DM Serif Display via `@expo-google-fonts/*` |
| Backend | Static JSON today; `supabaseProductRepository.ts` stub exists for future |

---

## 3. Operating mode — SHIPPING

Senior Tech Lead + Cybersecurity Expert posture. The earlier "Beginner Mentor / You Try First" protocol is **OFF** unless the user types exactly `switch to mentor mode`.

- Ship production code directly. Don't ask the user to try first.
- Comments explain the *why*, never the *what*.
- Proactively flag and fix security issues (XSS, secret leaks, insecure storage).
- Verify accessibility (WCAG AA), tap targets (≥44 px), and contrast on every UI change.
- Run `npm run typecheck` before claiming done — must be 0 errors.

---

## 4. Repo + branch rules

- **Repo path:** `/Users/dave/Documents/Claude/Projects/milkwise-claude-design/milkwise`
- **Remote:** `github.com:Mesanoob/milkwise`
- **Do NOT push** to `main` or any branch unless the user explicitly asks

**Branch model:**
| Branch | Role |
|---|---|
| `FinalDesign` | **★ ACTIVE (2026-05-20).** Cut from `redesign-v2`. Full v2 re-skin + post-Phase-7 calculator redesign + dark-mode latency fixes (§9c). Pushed to `origin/FinalDesign`. **Do work here.** |
| `redesign-v2` | v2 re-skin through Phase 7 + session-3 work (commit `50e9151 save1`). Preserved; synced with origin. |
| `testingprod` | **v1 — shippable.** Original design (forest green, DM fonts). Untouched; synced with origin. |
| `main` | Do not touch. |

- **v1 design source (current, on `testingprod`):** `/private/tmp/milkwise-design/milk-comparison-website/project/design_handoff_milkwise_sg/`
- **v2 design source (new, drives `redesign-v2`):** `../Milkwise-designrepo/` — sibling of this repo. Canonical token files: `design-reference/tokens.ts`, `design-reference/tokens.json`, `colors_and_type.css`. Visual reference: `ui_kits/website/` prototype + `design-reference/screens/` PNGs.

---

## 5. Quick start

```bash
cd /Users/dave/Documents/Claude/Projects/milkwise-claude-design/milkwise
npm install              # first time only
npm run typecheck        # MUST be 0 errors
npm run web              # dev server on http://localhost:8081
git log --oneline -10    # recent commits
```

- Port 8081 busy: `lsof -ti:8081 | xargs kill`
- For visual QA, use **Puppeteer MCP** (`mcp__puppeteer__*`). The Chrome MCP localhost grant doesn't work in this setup.

---

## 6. Project structure

```
app/                          Expo Router screens
  _layout.tsx                 Root — fonts, ProductsProvider, Stack
  index.tsx                   Compare screen (home)
  product/[id].tsx            Product detail
  most-sold.tsx, calculator.tsx, about.tsx, +not-found.tsx

src/
  components/
    Header, BottomNav, Screen, SearchBar, SortDropdown, DisplayToggle, Tag, EmptyState
    filters/      StageTabs, BrandPills, SpecialtyChips, AdvancedFilterChips
    product/      ProductCard, ProductListRow, ProductPicture, ProductGrid
    compare/      CompareDrawer, CompareModal
    calculator/   (sub-pieces; orchestrator is app/calculator.tsx)
  contexts/       ProductsContext.tsx
  hooks/          useProducts.ts, useFocusTrap.ts
  services/       productRepository.ts, staticProductRepository.ts, supabaseProductRepository.ts
  data/           products.json, productDetails.json, products.ts, productDetails.ts, imageMap.ts
  config/         theme.ts, constants.ts, env.ts
  types/          product.ts, filters.ts
  utils/          format.ts, strings.ts, icons.ts

assets/products/  72 transparent WebP packshots (1200² @84% — see §7c)
assets/products-original/    71 archived original JPGs (untracked backup)
assets/_webp_prenormalize/   72 pre-normalisation WebPs (untracked backup)
scripts/          generate-image-map.mjs
```

---

## 7. Architecture decisions — read before editing

These choices are non-obvious from the code alone.

- **Filter state lives in `ProductsContext`** (mounted in `app/_layout.tsx`), not in the Compare screen. The screen unmounts on nav; the context survives. A hard browser refresh resets state — intentional. Promote to URL params when shareable filter sets are needed.

- **Multi-select filters are `readonly` arrays.** Empty = no constraint. Non-empty = OR within dimension, AND across dimensions.

- **Variant pills and select dots do NOT navigate.** Original `<Link asChild><Pressable>` wrapper on `react-native-web` rendered an `<a>` that captured clicks even after `stopPropagation()`. Fix: card outer is a plain `View`; three "click target" Pressables (image, body, footer CTA) call `router.push()` directly. Tradeoff: right-click "open in new tab" no longer works on web. Restorable via a `RouterLink` web helper.

- **`CompareModal` platform branch:** web uses `position: 'fixed'` overlay; native uses RN `<Modal>` (`transparent`, `slide`, `statusBarTranslucent`, `onRequestClose`). Sticky table behaviour (first column + header row) silently no-ops on native — accepted for v1.

- **Icon helper contract:** `getOriginFlag(product.origin)` is keyed by origin **country**, NOT brand. Don't substitute `getCountryFlag(p.brand)`.

- **Specialty + stage palettes** in `src/config/theme.ts` are **spec-exact** from the design handoff. Don't retune. Mirrored in `tailwind.config.js`.

- **Font weight on native:** React Native does NOT synthesize weights. `font-bold` on `DMSans_400Regular` renders at 400. Always use `font-sans-bold` (`DMSans_700Bold`).

- **Image filename rule:** Metro mangles `+` to ` ` (space) in filenames. Use `-` instead.

- **Tailwind `content` must include `./src/`.** A Session 1 bug had arbitrary widths (`min-w-[160px]`) not compiling. Don't drop the path.

---

## 7b. Design system v2 — re-skin rules (active on `redesign-v2`)

The v2 work is a **visual re-skin ONLY**. Hard scope boundary:

- ✅ **In scope:** fonts, colors, dark mode, radii, shadows, spacing tokens, mono-tabular numerals, focus ring.
- ❌ **Out of scope:** screens (no Home / Nutrition Guide / For New Parents — keep the existing 5), component restructure, routing, `ProductsContext`, `useProducts`, repository, `products.json`, `productDetails.json`, nutrition data, the design's `formulas.json`/`nutrition.json` (reference only — do NOT import). No logic or data changes of any kind.

**Canonical source & a known trap:**
- `../Milkwise-designrepo/design-reference/tokens.ts` is **canonical** (it declares itself so). `tokens.json` = raw values, `colors_and_type.css` = upstream CSS vars.
- ⚠️ The repo's `README.md` prose is **stale and self-contradictory** — it says "forest green `#1A6B4A`" and "Fraunces/Geist". **Ignore the prose.** The accent is **sage `#6B9682`** (light) / `#9CC4AB` (dark); fonts are **Inter / Inter Tight / JetBrains Mono** per `tokens.ts` + `INTEGRATION.md`. Do not "fix" sage back to green.

**Rules (carry into every v2 change):**
- **No hardcoded hex anywhere.** Reference token keys only. The full inline-hex sweep (decision: full, all components) replaces every literal like `#1B5E3B` with a token ref. This is prerequisite for dark mode to work everywhere.
- **Fonts:** Inter (body 400/500/600), Inter Tight (display 600/700), JetBrains Mono (all numerals). Remove `@expo-google-fonts/dm-*`. RN doesn't synthesize weights — use the explicit family per weight.
- **Numerals:** every price / ratio / per-gram / per-scoop / scoop count / calculator output uses `fonts.mono` + `style={{ fontVariant: ['tabular-nums'] }}`. Currency `$42.90`, `RM 89`, per-gram `$0.048` (3dp), en-dash ranges.
- **Dark mode:** decision = **OS-seeded + manual toggle, persisted (AsyncStorage)**. Needs a small theme context + sun/moon toggle in the nav (~40 lines new code — the *only* new code; still no logic/data change). All tokens flip; no per-component hex.
- **Surfaces:** page is `bg` (never pure white), `bgPanel` for bands/alt rows/inputs, `bgCard` only where a card lifts. Radii: 4px inputs, 8px cards, 24px pills. Shadows: 2-step (`s1` resting, `s2` hover/float), `s3` modals only.
- **Tracking** is `em` in CSS; RN `letterSpacing` is px → convert.
- **Re-apply Phase D a11y against new tokens:** WCAG AA contrast must hold in BOTH themes; re-verify focus ring visibility on sage/dark surfaces.

---

## 7c. Product imagery pipeline — read before touching `assets/products/`

Done this session (uncommitted on `redesign-v2`). Non-obvious; a fresh agent **will** break things without this.

**State:** `assets/products/` is now **72 transparent-background WebP** packshots, **0 JPG**. Every file is a **1200×1200 square** canvas with the product **alpha-trimmed and re-padded to exactly 84% content height** → all cans render at identical scale under `resizeMode="contain"`.

**Why each piece exists:**
- **JPG → WebP + `products.json` `.jpg`→`.webp` (135 refs) is a USER-DIRECTED EXCEPTION to the §7b "no data changes" fence.** Do **not** "fix"/revert it as a scope violation. `productDetails.json` has no image refs. `imageMap.ts` is regenerated (`npm run generate:images`) — keys are filename+ext, lookup is exact-match, so data ext and disk ext must agree.
- **Scale normalisation** fixed the real bug: the background-removal tool left wildly different transparent margins (content height 63–92% of canvas; FairPrice Gold Stage 3 was a 1024×1536 portrait at 60%). CSS cannot fix this — `contain`/`object-fit` work on the canvas, not the alpha content. Normalisation is the only correct fix and makes the cheap CSS uniform for free.
- **Dark "sticker halo"** = `.mw-packshot` / `.dark .mw-packshot` in `global.css` (drop-shadow stack: 1-pass ambient on light, 12-pass die-cut white edge + bloom + ambient on dark). Scoped via the existing `.dark` ancestor selector — light pays for 1 shadow, the heavy stack only runs in dark where the blend problem exists. `filter: drop-shadow()` traces the element's rendered alpha (incl. RN-Web's background-image) so it follows the can silhouette, not the box. Attached to the `<Image>` in `ProductCard` + `ProductPicture` only (Compare Cards/Photos — the reported surface); `padding` bumped (8→16 / +14) so the halo lives inside the card's `overflow-hidden` clip. List/modal thumbnails (tiny `overflow:hidden` wells) and the detail-hero white plate are deliberately **excluded**.

**Reproduce / add a new image:** drop the WebP in `assets/products/`, then re-run the normalisation (Pillow ≥11, user-scoped `pip3 install --user Pillow`): alpha-trim at α>4 → centre on 1200² transparent canvas at 84% height (LANCZOS, quality 90, method 6, RGBA preserved), then `npm run generate:images`. An un-normalised image will visibly mis-scale next to the rest. The one-off script was run inline (not saved) — params above are the spec.

**Backups (untracked, outside the generator's scan path → no side effects):**
- `assets/products-original/` — 71 original JPGs (the `FairPrice_Gold_900g_Stage3.jpg` original was lost: the user's manual WebP conversion removed it before archival — 71/72, not recoverable from this repo).
- `assets/_webp_prenormalize/` — the 72 pre-normalisation WebPs (delete once happy).

**Known source-asset defect (out of scope, NOT a CSS/normalisation bug):** Nature One Standard, FairPrice Follow-On/Newborn have a circular *"Breastfeeding is best… IMPORTANT NOTICE"* watermark baked into the artwork. Cannot be removed without altering the product (user constraint) — needs clean source re-exports.

---

## 8. ✅ What's been built (Sessions 1 + 2 combined)

### Compare screen
- 61-product grid with 3 view modes (Cards, List, Photos)
- Multi-select filters: stages (4), brands (15), specialties (11), origins, milk types, halal, partially hydrolyzed, extensively hydrolyzed
- Specialty + advanced filters live in a "Filters" overflow chip drawer (`AdvancedFilterChips` Trigger + Drawer pair)
- Single unified toolbar — `[sort | dir | hint | Filters] … [count | view]`
- Direction hint ("cheapest first") shown for cost-based sorts only
- Sort by 8 fields (price, $/g, $/scoop, $/mL, protein, DHA, name, brand) with direction toggle
- Real-time search across name + brand + specialty (input lives in the nav header)
- Empty state with reset action

### Product detail
- Hero card — 320 px image column + content column
- Variant cards with thumbnails for pack-size selection
- 4-stat pricing grid ($ tin, $/g highlighted, $/scoop, $/mL)
- Scoop info strip (scoop size, water, scoops per tin, tin weight)
- Same-stage price comparison list with bar fills
- 2-column specs table
- All-sizes pricing table with "best ✓" highlighting
- Features & claims grid + probiotic / HMO callouts
- Macronutrient tiles + ingredients list + allergen warning
- Categorised full nutrition table (Macros / Vitamins / Minerals / Bioactives)
- Similar products row + disclaimer

### Most Sold
- Curated 12-product ranking
- Top-3 podium reordered `[2nd, 1st, 3rd]` to match design
- Rank rows with market-share bars
- Horizontal market-share chart

### Calculator
- Date-of-birth + gender form
- HPB/KKH-style feeding benchmarks per age bucket
- Daily intake estimate + monthly formula spend
- Per-pack-size selection via composite `productId#variantIdx` keys
- Cost chart over 12 months

### About
- Full-bleed green hero with serif headline + CTA
- 4-pillar mission grid
- 5-step methodology with numbered green badges
- Amber paediatrician notice
- 8-question FAQ accordion
- Stats row + green footer

### Compare flow
- Select up to 5 products via per-card / per-row dot
- Bottom drawer with chip strip, per-item remove, Clear, Compare
- Modal opens on Compare (when ≥2 selected)
- Full-screen comparison table — sticky first column + header row on web, horizontal scroll for columns
- Cheapest cell per pricing row highlighted in brand green with ✓
- Backdrop tap, ✕ button, and Esc all dismiss
- Platform branch: web uses `position: 'fixed'`; native uses RN `<Modal>` (back-button + slide animation)

### Header / navigation
- Sticky green-tile logo + serif "MilkWise SG" wordmark (SG in brand green)
- Desktop nav: Compare / Most Sold / Calculator / About + in-nav search
- Mobile: logo only + search field on second row; BottomNav with 4 tabs
- `usePathname` highlights the active route

### Design system — **v2 re-skin layered on (see §9b for live status)**
- **Fonts (v2, shipped):** Inter (body 400/500/600) + Inter Tight (display 600/700) + JetBrains Mono (400/500) via `@expo-google-fonts/*`; DM removed. `theme.ts` `fonts` exposes only semantic v2 keys (back-compat `serif`/`sans*` aliases + `font-serif`/`font-sans*` classes deleted in Phase 4c — all call-sites use `font-display-bold`/`font-body*`/`font-mono*`). Splash held until fonts resolve (no FOUT).
- **Tokens (v2, shipped):** full v2 surface in `theme.ts` — `palette` (light+dark), `space`, `radius` (v1+v2 keys coexist), `elevation`, `weight`, `fontSize`, `lineHeight`, `trackingEm`/`tracking()`, `motion`, `layout`, `heroMesh`, `themeFor()`. Mirrored in `tailwind.config.js` as `mw-*` colours backed by CSS vars (`global.css` `:root`/`.dark` channel triplets) → one `.dark` swap flips everything.
- **Dark mode (v2, shipped):** `ThemeContext` — OS-seeded, `system→light→dark` cycle, AsyncStorage-persisted; drives NativeWind `colorScheme` + the `.dark` web class. Sun/moon/auto toggle in `Header` (desktop + mobile).
- **v1 token layer fully removed (Phase 4c, `ccdda22`):** the flat `colors`/`fontSizes`/`spacing`/`shadow` exports, v1 t-shirt `radius` keys, and the `theme` aggregate + `Theme` type are deleted from `theme.ts`. Nothing imports them. `themeFor`/`palette` + `mw-*`/`font-*` classes are the sole token source. `specialtyColors`/`stageColors` retained (spec-exact). Stale `bg-green`/`theme.fonts.*` doc-comments refreshed.
- 11 specialty + 4 stage palettes — spec-exact, **NOT part of v2** (deliberately untouched by the re-skin per §7b); medal gold/silver/bronze in `most-sold.tsx` likewise theme-independent.
- System font fallback stack in `global.css` to minimise CLS; web shell bg + focus ring now flip via CSS vars.

### State management
- `ProductsContext` is the single source of truth for filter + selection state (mounted in `_layout.tsx`)
- Filter state survives Compare ↔ Detail navigation
- `useProducts` hook handles filter / sort / search composition
- `useFocusTrap` hook handles web modal focus management

### Accessibility (Phase D, latest)
- `CompareModal` has `role="dialog"`, `aria-modal`, `aria-labelledby`, body-scroll lock
- Focus moves into modal on open, Tab/Shift+Tab cycles within, Esc dismisses, focus restored on close
- All small Pressables have `hitSlop` for ≥44 px tap targets (WCAG 2.5.5)
- Variant pill rows use `role="radiogroup"` with label
- StageTabs container has `role="tablist"`
- BottomNav links use `role="link"` + `selected` state
- Filter count is `role="status"` + `aria-live="polite"` (announces on change)
- Global `:focus-visible` has white-halo inset so the ring stays visible on green/dark surfaces
- `.sr-only` utility class added for visually-hidden text
- Product images marked decorative (`alt=""`); name is read via adjacent text

### Cross-browser verification
- ⚠️ **This verification predates the v2 re-skin.** During the re-skin, web light+dark was Puppeteer-verified through the leaf-component layer only; a full light+dark sweep of all 5 screens is the open Phase 4c task (§9b). Treat the rows below as v1-era.
- **Chromium (Puppeteer):** all 4 routes + product detail + Compare modal flow (desktop + 375 px mobile) — pass
- **Safari:** all 4 routes via native screencapture — visual parity to Chromium — pass
- **Firefox:** not installed, not tested

### Tooling
- `npm run typecheck` clean (0 TS errors)
- `scripts/generate-image-map.mjs` regenerates `imageMap.ts` from `assets/products/`
- Tailwind `content` scans both `app/` and `src/`

### Bug fixes locked in
- Filters reset on "back to compare" → moved state to `ProductsContext`
- Variant pill triggered navigation → removed `<Link>` wrapper, click-target Pressables pattern
- Image filenames with `+` → renamed 11 images to use `-`
- Tailwind not scanning `src/` → added `./src/**/*.{js,jsx,ts,tsx}` to `content`
- ProductGrid last-row stretch → CSS Grid (`repeat(auto-fill, minmax(220px, 1fr))`) on web
- Mobile list row tile layout → `grow` prop on `MetricTile` for full-width 3-tile split below 768 px

---

## 9. ⏳ What's left

Ordered by launch-readiness. Effort: **L** = under 1 hr, **M** = 1-4 hr, **H** = half day+.

### Launch blockers (web)
| # | Task | Effort |
|---|---|---|
| 1 | Production hosting (Vercel or Cloudflare Pages) + auto-deploy from `testingprod` | L |
| 2 | Domain + DNS pointing | L |
| 3 | Legal pages — privacy, terms, **medical/health disclaimer** (non-negotiable; health-adjacent) | M |
| 4 | Real-device pass on iPhone Safari + Android Chrome | L |
| 5 | SEO metadata — title, description, OG image, favicon, robots.txt, sitemap.xml | L |
| 6 | Lighthouse audit on built bundle (target a11y ≥95, perf ≥85) | M |
| 7 | Image optimization — WebP ✅ (transparent, normalised 1200², 9.6→8.2 MB; see §7c). **Remaining:** responsive `srcset` (375 / 768 / 1280) | M |
| 8 | `npm audit` triage — 4 moderate vulnerabilities (do NOT `--force`) | L |

### Strongly recommended pre-launch
| # | Task | Effort |
|---|---|---|
| 9 | Analytics (Plausible — no cookie banner needed under PDPA) | L |
| 10 | Error tracking (Sentry free tier) | L |
| 11 | VoiceOver + TalkBack screen-reader pass (DOM verified; AT announcement is the gap) | M |
| 12 | Structured data (`schema.org/Product`) on detail pages for Google rich results | L |
| 13 | Firefox visual smoke (`brew install --cask firefox` then re-run sweep) | L |
| 13b | **v2 a11y residual (design input needed).** Phase 7 fixed the systemic accent-text AA failure via `accentText`, but two WCAG-AA gaps remain because they can't be auto-fixed without a design call: **(a)** small text (subtitles/footer nav/copyright) on the full-bleed **sage hero/footer bands** — mid-tone sage `#6B9682` admits no AA-compliant foreground; fix = darken those bands to `accentText`-deep-sage OR enlarge/embolden the small text to WCAG-large (3:1). **(b)** white-on-**gold/silver/bronze** medal strips on Most Sold podium — §7b-frozen spec-exact palette, pre-existing (not v2-introduced); fix = design re-spec of the medal text treatment. Health-adjacent + §3 mandates AA, so resolve before public launch. | M |
| 13c | **Safari visual sweep** — all v2 QA (Phases 1–7) was Chromium/Puppeteer only. Run the light+dark 5-screen sweep in Safari (native screencapture) before launch. | L |

### Nice-to-have / post-launch
| # | Task | Notes |
|---|---|---|
| 14 | URL state for filters | Context-only today; refresh wipes it. Promote for shareable filter sets. |
| 15 | Native iOS/Android smoke test of Compare modal | Web verified; native structurally sound but not exercised on simulator. |
| 16 | Right-click "open in new tab" on cards | Restorable with a web-only `RouterLink` helper. |
| 17 | PWA "Add to Home Screen" prompt | Expo PWA support is built-in. |
| 18 | Supabase backend + admin dashboard (Session 3) | Price updates currently require code change + redeploy. |
| 19 | App Store + Play Store submission (Session 4) | $99/yr Apple + $25 Google; TestFlight + internal testing flows. |

---

## 9b. ⏳ v2 re-skin roadmap (ACTIVE — branch `redesign-v2`)

The current priority. Visual re-skin only (see §7b for the hard scope boundary).
Each phase is independently shippable and `npm run typecheck`-clean before moving on.

| Phase | Task | Touches | Effort |
|---|---|---|---|
| 0 | ✅ **DONE** Pull `tokens.ts` / `tokens.json` / `colors_and_type.css` (+`data-mapping.md`, `INTEGRATION.md`, `README.md`) into `milkwise/design-reference/`. Gitignored + `tsconfig` `exclude`d so it's never built/typechecked. Re-pull cmd in that README. | ref dir, `.gitignore`, `tsconfig.json` | L |
| 1 | ✅ **DONE** **Fonts** — Inter/Inter Tight/JetBrains Mono installed, DM removed, 7 weights loaded in `_layout.tsx`. `theme.ts` `fonts` has semantic v2 keys (`displayBold`, `body`, `mono`, …) + **back-compat aliases** (`serif`/`sans*`) so un-migrated components still render; aliases (and their `tailwind` mirrors) get deleted after Phase 4. | `_layout.tsx`, `theme.ts`, `tailwind.config.js`, `global.css` | M |
| 2 | ✅ **DONE** **Token merge** — full v2 surface ported into `theme.ts` (`palette` light+dark, `space`, `radius` v2 keys merged in, `elevation` light/dark, `weight`, `fontSize`, `lineHeight`, `trackingEm`+`tracking()`, `motion`, `layout`, `heroMesh`, `Scheme`, `themeFor()`). **Additive only** — v1 `colors`/`shadow`/`fontSizes` untouched, deleted after Phase 4. Tailwind mirror under **`mw-*` namespace** (static light hex; Phase 3 made dark flip via class). Verified pixel-identical (no component touched). | `theme.ts`, `tailwind.config.js` | M |
| 3 | ✅ **DONE** **Dark-mode mechanism** — `src/contexts/ThemeContext.tsx` (OS-seeded, `system`→`light`→`dark` cycle, AsyncStorage-persisted, drives `nativewind` colorScheme). `darkMode:'class'` set. Toggle in `Header.tsx` (desktop + mobile), styled from live v2 tokens so it's the on-screen proof. Verified: cycle, persistence-across-reload, explicit-dark → `<html class="dark">` (Phase 4 `dark:` dependency), `system`→media-query. No existing screen visually changed. | new `ThemeContext`, `Header.tsx`, `_layout.tsx`, `tailwind.config.js` | M |
| 4 | ✅ **DONE (inline-hex sweep)** **Full inline-hex sweep.** **Decision locked: approach (a)** — Tailwind `mw-*` classes wired to CSS vars (`global.css` `:root`/`.dark` channel triplets, `darkMode:'class'`), inline `style` hex → `useTheme().tokens` (unavoidable since RN style props can't take classes). **DONE & committed** (`f0bea66`, `da0730b`, `9f9f429`, `7cf1a3a`, `13c9b58`, **`5e87105`**): CSS-var backbone + all 8 leaf comps + Header + ProductCard/ListRow + all filters + CompareDrawer/Modal + index/most-sold/about + Stepper + 3 charts + calculator.tsx + **`app/product/[id].tsx`** (final file — ~74 hex + v1 colour classes swept; `useTheme()` per sub-component; allergen notice → semantic `warnBg`/`warnText`; spec-exact specialty/stage/✓-best/macro pairs LEFT; hero tin-photo plate LEFT theme-independent `#FFFFFF`; Card `shadowColor:#000` deferred → Phase 6; `font-serif`/`font-sans*` aliases deferred → Phase 4c). **Verified light+dark on web (Puppeteer, 390px mobile)** incl. product detail. **Conventions** (now applied everywhere): `#1B5E3B`→accent, `#E0D9CC`→border, `#1A1A1A`→text, `#FFFFFF`(surface)→bgCard, `#F9F7F2`→bgPanel, `#EBF5EE`→accentTint, `#6B7280`→textMuted, `#2D7A52`→accentHover, `#B7E4C7`/`#CBD5E1`(bar fill/track)→accentSoft/border; specialty/feature-chip hue pairs (#D1FAE5/#065F46, #EDE9FE/#6D28D9, #FEF9C3/#713F12, #DCFCE7/#166534, #E0F2FE/#0369A1, deep violets) → **LEFT** (spec-exact); shadow `#000` → Phase 6; product-photo backdrops / modal scrim → theme-independent. | every component w/ inline color | H |
| 4c | ✅ **DONE** (`ccdda22`, after `e818ea9` calc-caret a11y fix). Migrated all **231** `font-serif`/`font-sans*` call-sites across **21** components → semantic v2 classes (`font-display-bold`/`font-body`/`font-body-medium`/`font-body-semibold`; `font-sans-bold`+`font-sans-semibold` BOTH → `font-body-semibold`, mirroring the old alias — Inter has no 700, 600 is the body ceiling, so weight is unchanged). Deleted the back-compat font aliases (`serif`/`sans*`) from `theme.ts`+`tailwind.config.js`, and the **entire v1 token layer** from `theme.ts` (flat `colors`, `fontSizes`, `spacing`, `shadow`, v1 t-shirt `radius` keys, `theme` aggregate + `Theme` type). `specialtyColors`/`stageColors` kept (spec-exact). `_layout.tsx` repointed off v1 `colors` (transition bg now plain `tokens.colors.bg`); stale doc-comments refreshed. Net −111 lines dead v1 code. **Verified** typecheck=0 + Puppeteer light+dark all 5 screens @390px: pixel-identical to pre-4c, every migrated class resolves to Inter/Inter Tight (no system fallback), zero `font-serif`/`font-sans` survive in DOM. Safari sweep still pending → fold into Phase 7. | `theme.ts`, `tailwind.config.js`, `_layout.tsx`, 21 comps w/ `font-*` class | H |
| 5 | ✅ **DONE** **Mono-tabular numerals.** Every isolated price / $-per-unit / scoop size+count / weight / rank / % / ratio / calculator output → `font-mono`/`font-mono-medium` class + `style={{ fontVariant: ['tabular-nums'] }}`. SVG chart axis/value labels → `fontFamily="JetBrainsMono_{400,500}"` (mono is inherently tabular in SVG; no fontVariant needed). **Convention (carry forward):** isolated numeric *values* → mono; *labels* and number-bearing *prose/headlines* (e.g. "#1 Best Seller", "5 months, 28 days", "(150ml x 5 feeds)", InfoBox sentences) stay body/display. Weight-tier mirrors Phase 4c: numeric body-semibold → `font-mono-medium` (JetBrains ceiling is 500). Mixed helpers got an explicit `mono`/`numeric` prop (ProductListRow `MetricTile`, CompareModal row defs, product/[id] `TableCell`, calculator `GuidelineCell`) so text cells (Origin, nutrient name/unit, age/notes) stay body. **Touched:** ProductCard, ProductListRow, product/[id] (StatBox/ScoopFact/NutBlock/Cell/TableCell + variant cards/comparison/similar), CompareModal, most-sold (MiniMetric/share/rank), calculator (DobPart/MiniStat/StatCard/RatioControl/SpendSummary/Stepper/GuidelineCell + big intake), BenchmarkChart, SpendChart, CumulativeSpendChart. **Verified:** typecheck 0; Puppeteer light+dark — computed `font-family` asserted as `JetBrainsMono_*` on values, `Inter_*` on labels; visual sweep incl. charts (DOB-filled). | ProductCard, ProductListRow, CompareModal, calculator, detail, most-sold, 3 charts | M |
| 6 | ✅ **DONE** **Token application — radii + shadows.** All inline shadow objects → theme-keyed `tokens.shadow.{s1,s2,s3}`: s1 resting cards (ProductCard, ProductListRow, product/[id] `Card`, calculator `Card`, about `Step`, most-sold `Card`/`RankRow`), s2 the podium lift (most-sold `PodiumCard`), s3 the bottom-sheet `CompareDrawer` (s3 tier + overridden upward `shadowOffset:{0,-4}` to keep the bottom-sheet cast). **This is also a dark-mode correctness fix** — the old `#000 @ 0.07` shadow was invisible on `#1A1916`; s1-dark is `#000 @ 0.40`. Radii: every **off-canonical `borderRadius:14`** (v1's old card default) → `tokens.radius.card` (canonical 12) across all card surfaces incl. `ProductPicture` (added `useTheme`); CompareModal's 36px close button `borderRadius:18` → `tokens.radius.circle` (the `18` there was r=½·36, a coincidence with `cardLg`'s value — **not** a large card). **Deliberately NOT churned:** `borderRadius` literals already equal to their canonical token (`8`=input, `12`=card, `999`=pill) + sub-token decorative radii (`3/4/6/10/11/16/19/20` on bars, tiny chips, partial corners — no canonical token; §7b forbids re-deriving). The `space` scale was **not** blanket-applied: §7b's concrete rules specify only surfaces/radii/shadows — no spacing values — and surfaces were done in the Phase 4 colour sweep, so there is no spec to apply spacing against. **Verified:** typecheck 0; Puppeteer light+dark — computed `box-shadow` asserted as resolved s1 (`rgba(42,40,35,.05) 0 1px 3px` light / `rgba(0,0,0,.4) 0 1px 3px` dark) + s2 podium lift; `border-radius:12px` everywhere. | shared components | M |
| 7 | ✅ **DONE (re-skin complete)** **A11y + dark-mode QA.** Ran a programmatic WCAG contrast audit (computed colour → relative-luminance → ratio, large-text aware) on all 5 screens, BOTH themes. **Found + fixed a systemic light-mode failure:** canonical sage `accent #6B9682` is only ~3:1 on light surfaces → fails AA as *small* text and as a small-text badge/chip/CTA fill (cream-on-sage). Per the user decision, added an **additive a11y role token `accentText`** (light `#3F6B54` — same-hue sage derived to clear ≥4.5:1 on every light surface; dark `#9CC4AB` = dark accent, already AA). Plumbed in `theme.ts` palette (L+D), `tailwind.config.js` (`mw-accent-text`), `global.css` (`--mw-accent-text` :root/.dark). Swept every small-accent-text + accent badge/chip/CTA/header/active-pill/active-state site → `accentText` (18 components incl. the `text-mw-accent`→`text-mw-accent-text` class migration, the conditional `?accent:` branches, the calculator `useV2Colors` shim → added `greenText`). **KEPT `accent`:** large-bold display (Header "SG" 20px InterTight700, about stat 32px — WCAG large-bold, 3:1 ok), non-text (bars/borders/outlines/dots/Switch thumb/focus-ring), spec-exact specialty/stage/medal palettes (§7b-frozen). **Verified:** typecheck 0; Puppeteer audit — product detail **0**, compare **0**, calculator **0** (excl. residual), dark **0** (one hidden-accessible-text false positive). Focus-ring (accent outline + white inset halo) + ≥44px hitSlop carry forward from Phase D by construction (re-skin never touched sizes/hitSlop/focus-visible; the halo makes 1.4.11 hold surface-independent). **⚠️ Residual (design-level, NOT auto-fixable — see §9 #19):** small text on the full-bleed **sage hero/footer bands** (~3:1; mid-tone sage admits no AA foreground without repainting the signature surface or rescaling type) + the **spec-exact gold/silver/bronze medal strips** (§7b-frozen, pre-existing, not v2-introduced). Safari sweep still pending (Chromium/Puppeteer only). | `theme.ts`, `tailwind.config.js`, `global.css`, 18 components | M |

**⚠️ Radii — canonical values resolved (read before Phase 6):** §7b prose
("4px inputs, 8px cards, 24px pills") **conflicts with canonical
`tokens.ts`** (`input:8, card:12, cardLg:18, pill:999`). Same class of trap
as the README green/Fraunces warning in §7b. **`tokens.ts` wins** (§7b itself
declares it canonical and says don't re-derive). Phase 2 merged the
`tokens.ts` values; Phase 6 applies them. Treat the §7b radii prose as stale.

**Hard rules for this roadmap:**
- Do NOT add/modify screens, components' structure, data, or logic. Re-skin = swap visual tokens on the existing tree.
- `testingprod` (v1) must stay untouched and shippable. All v2 work lands on `redesign-v2`.
- After each phase: `npm run typecheck` = 0, then visual-diff the touched screens against `../Milkwise-designrepo/design-reference/screens/*` (both light + dark, mobile width).
- `../Milkwise-designrepo/INTEGRATION.md` §2-3 + `data-mapping.md` are the detailed spec. Reference them; don't re-derive token values.

---

## 9c. ✅ Session 3 (2026-05-20) — dark-mode latency + calculator redesign

All committed on `redesign-v2` (`50e9151 save1`) and inherited by `FinalDesign`. Verified via `npm run typecheck`=0 (when v2 deps installed) + Puppeteer light **and** dark, two-column **and** mobile.

**A. Dark-mode switch latency (`ThemeContext.tsx`, `Header.tsx`, `global.css`)**
- **Diagnosis (measured, not guessed):** two parallel theming paths — instant CSS-var/`.dark` flip vs. a JS `useTheme().tokens` re-render. Perceived lag was a *dead first click* (system→light is a no-op when OS already light). Real freeze (~68–130ms, asymmetric, light→dark only) was isolated by probe to the **§7c 12-pass `.mw-packshot` drop-shadow × 61 images**, not React.
- **Fix 1:** system mode commented out (recoverable block) → binary light↔dark cycle; `Header` glyph map binary. Kills the dead click.
- **Fix 2:** the heavy halo is gated behind `.dark.fx-ready`; `ThemeContext` drops `fx-ready` for the flip frame (cheap 1-pass ambient) and re-arms it on a double-rAF, moving the irreducible 12-pass cost **off the click's critical path**. Steady-state visual byte-identical. ⚠️ Do NOT recombine the two `.mw-packshot` rules in `global.css` — the split IS the fix.

**B. Calculator redesign (`app/calculator.tsx`, `feedingCalculator.ts`, 3 charts)** — net-new product UI the user directed via the frontend-design skill + reference screenshots. **This supersedes the Phase-1–7 calculator; do not treat calculator as "just re-skinned".**
- **Layout:** screenshot-parity. Left = one always-visible input panel (single `<input type="date">` DOB on web + 3-box native fallback; gender **commented out** recoverably; `Pick a formula` defaulting to `— Manual entry —`; always-on Scoop stepper / Tin select / Price `$` field). Right = human-centric results: `BenchmarkStatusCard` (range bar) + 2×2 `ResultCard` grid (Daily / Monthly / **Spent so far** / **Projected**, last two emphatic sage) + SG-vs-MY savings. Bottom (full-width) = enlarged SpendChart + Cumulative + Benchmark-by-month SVG + guidelines table.
- **Engine (`feedingCalculator.ts`):** added optional `scoopGOverride` / `tinWeightGOverride` / `pricePerGramOverride` folded over product-derived values at one point; `formulaShare=1` when no product but a manual price exists → **manual entry produces a full cost**. New `MalaysiaCompare` (SGD_TO_MYR 3.05, MY_DISCOUNT 0.28).
- **Behaviour locked by latest user asks:** results are **NOT** gated on DOB (calculator shows immediately; guidelines table always shows; benchmark-by-month + cumulative stay age-gated by nature); **all inputs default to 0** on fresh load; DOB label has **no** "cannot be in the future" hint; formula picker has **no** "auto-fills…" hint (auto-fill behaviour kept).
- Charts enlarged (SpendChart 580×300, Benchmark/Cumulative to match) with an `FS` font knob.

**C. Header (`Header.tsx`)** — search bar **scoped to Compare (`/`) only** (`onCompare = pathname === '/'`); off-Compare a flex spacer (desktop) / right-aligned lone toggle (mobile) keeps the theme toggle pinned. It was dead UI typing into a hidden list elsewhere.

**Open / next:** Safari sweep still pending (all QA Chromium/Puppeteer). The feeds/ml controls still use the slider-`Stepper` (screenshot shows plain steppers — deferred, not requested). §9 launch backlog otherwise unchanged. The two §9 a11y residuals (13b/13c) still stand.

---

## 9d. ⏳ FINAL DESIGN REBUILD — `final-design-rebuild` (ACTIVE)

The user dropped `../MilkWiseFinalDesign/` (a full new web design — 6 nav pages incl. Home / Nutrition Guide / For New Parents, plus a Head-to-Head overlay) and asked to model the site 1:1, porting it into this RN/Expo app while preserving cross-platform. This is **not** a re-skin — it adds pages, changes routing, restructures Compare/ProductDetail, and introduces a new merged data model.

**Branch model:**
- `final-design-rebuild` ← **ACTIVE**, cut from `FinalDesign`, pushed `origin/final-design-rebuild` at commit `6dd906e` (Phases 0–1 only).
- `FinalDesign` is the previous baseline — left untouched as the rollback target.
- `testingprod` / `main` not touched.

**Locked decisions (Phase-0 AskUserQuestion, 2026-05-20):**
- **Platform:** keep RN/Expo, port design *into* the existing app. Web pixel-1:1 priority; native is "close not exact" (mesh + sticky + blur are web-only).
- **Data:** **merge both** — design's 76-row formulas.json as the canonical *shape*, enriched with our curated `productDetails.json` (ingredients/allergens) and our WebP images. Source of truth stays `products.json`; the new `Formula[]` derives from it at module load.
- **Pages:** follow the design **AND** keep Most Sold. Nav has 6 links (Compare · Calculator · Most Sold · Nutrition Guide · For New Parents · About). BottomNav retired.

### Phase status

| # | Phase | Status |
|---|---|---|
| 0 | Token reconciliation (tokens already matched; added `layout.sidebar`, theme-split `palette.focusRing`, `--mw-mesh*` vars to `global.css`). Additive only; baseline-verified 5 screens. | ✅ shipped (commit `6dd906e`) |
| 1 | Data foundation — copied design `formulas.json` (76) + `nutrition.json`; built `src/data/formulas.ts` merge engine (normalizer + 6-entry alias map → 74/76 matched with curated ingredients, 2 design-only on same-brand WebP fallback); ported classifiers to `src/utils/formulaClassifiers.ts` (typed: `milkSourceOf`, `specialtiesOf`, `bucketize`, `highlightSegments`, `ingredientsParagraph`, `originCountry`, `flagFor`, `shortName`, `featureBlurb`) + `formulaFormat.ts` (`fmtSGD`/`fmtPerGram`/`fmtSGD0`/`fmtCount`). `Product`/`ProductDetail` untouched — Most Sold + Calculator still consume them. | ✅ shipped (commit `6dd906e`) |
| 2 | App shell — rewrote `Header.tsx` → new NavBar (🍼 wordmark + SG pill, 6 links, 🇸🇬/SGD/theme toggle, hamburger flyout); new `DisclaimerBanner.tsx` (persisted dismiss key `mw_banner_dismissed`); new `Footer.tsx` (4-col dark band); refactored `Screen.tsx` (Banner + NavBar + scroll + Footer in scroll); deleted `BottomNav.tsx`; routing: `app/index.tsx → app/compare.tsx` (git rename), new `app/index.tsx` Home placeholder, added `app/nutrition.tsx` + `app/parents.tsx` placeholders; updated 5 `/` route refs that meant Compare → `/compare`. | ✅ shipped (uncommitted) |
| 3 | Home page — `app/index.tsx` rewrite: Hero with 5-radial mesh gradient (web exact via `var(--mw-mesh)`, native solid `creamSoft` fallback in `HeroMesh.tsx`) + leading-dash eyebrow + 3-line title + 2 CTAs + scroll chevron; Stats band (4 mono-numeral stats with border-left separators); Features section (3 interactive cards); How-it-works (3 numbered steps with giant ghost-numeral behind each); Butter disclaimer strip. `Section.tsx` + `Eyebrow.tsx` primitives extracted for reuse in Phase 8 long-form pages. | ✅ shipped (uncommitted) |
| 4 | Compare page — new `FormulaCompareContext` (stage/brand/sort/view/filters/tray; mounted in `_layout.tsx`; survives navigation, resets on reload). New `src/components/compare/v2/` directory: `atoms.tsx` (StageBadge, ChipRow with spec-exact 11-tone palette, TinPills, MetricPill, CheckCircle), `StageTabs.tsx` (accent-underlined, h-scroll), `BrandBar.tsx` (h-scroll pills + web fade-mask), `Toolbar.tsx` (sort-cycle + dir + filters pill + clear-all + count + view toggle), `FilterPanel.tsx` (5 emoji-pill groups), `GridCard.tsx` (image + chips + tin + metric pills + foot), `ListRow.tsx` (responsive 3-breakpoint collapse), `CompareTray.tsx` (≤5 chips, position:fixed on web). `app/compare.tsx` rewritten to consume `getAllFormulas()` + context. Routing: GridCard/ListRow strip `--<size>` suffix from `formula.id` before navigating to `/product/[id]` so v1 PDP route resolves. **Phase-4 deferments:** (a) sticky StageTabs/Toolbar (Phase 9 polish); (b) sort = tap-to-cycle (no cross-platform `<select>` dropdown); (c) Compare-page search input — design has it inside the toolbar, current toolbar doesn't carry it (search regressed until Phase 9 polish or sooner). | ✅ shipped (uncommitted) |
| 5 | Product Detail rebuild — `app/product/[id].tsx` rewritten (1249→~870 lines). Added `getFormulaByBaseId` / `getFormulaVariants` to `formulas.ts` (resolves stripped `/product/[id]` URLs back to the default variant). Page sections: Breadcrumb · Hero card (image + 6 hero-badge tones [stage/budget/mid/premium/halal/organic/warn] + brand + title + desc with inline DHA/ARA highlights + sage best-for callout + 4 price tiles + 4 spec tiles + halal cert) · Price-comparison ranking (same-stage, current row highlighted, top-10 + self if outside) · 9-cell specifications grid · Features & Claims (✓ list from `specialtiesOf`) · Ingredients (curated `productDetails` text → 74/76; synth fallback for 2 design-only via `ingredientsParagraph`; rendered through `HighlightedText` with 6-tone legend) · Nutrition table (per-100g/per-100ml via `bucketize` → Macros/Vitamins/Minerals/Bioactives/Other + alternating-row striping + tabular-num cols) · "You may also consider" (4 same-stage by $/g proximity) · Disclaimer. Reuses Phase-1 classifiers verbatim. | ✅ shipped (uncommitted) |
| 6 | Head-to-Head + Compare flow — `app/head-to-head.tsx` reads `FormulaCompareContext.tray`, renders 0/1/2–3 product modes; sections (Price · Formula details · Ingredient highlights · Nutrition per-100mL) with best-cell sage highlight via `bestIdx(vals, low)`; action row (Back to results · Clear · Open Calculator). `CompareTray` "Compare Now" wired to `router.push('/head-to-head')`. | ✅ shipped (uncommitted) |
| 7 | Calculator reconcile — added `formulaToProductLike` adapter in `app/calculator.tsx`; swapped `getAllProducts()` → `getAllFormulas().map(adapter)`. Picker now shows 78 options (1 manual + 1 breastmilk + 76 formulas, up from ~74 product-variants). Engine + charts + UI untouched (§9c screenshot-parity preserved). Engine still types `primary: Product` — adapter satisfies it through unknown → Product cast on the 3 fields the engine reads (scoopG/weightG/pricePerGram). | ✅ shipped (uncommitted) |
| 8 | Content pages + Most Sold re-skin — ported `NutritionGuide` (intro + butter warn + 7-row feeding table with stage badges + 6 safe-prep step cards + pHF/eHF cards + 8 key-nutrients list + 4 SourceBadges), `ForNewParents` (display h1 + stages pullquote + 4 milk-source cards + cost-driver list + green/yellow flag cards), `About` (mission quote card + 2 paras + methodology 2-col + 6 T&C items). New `src/components/SourceBadge.tsx` atom. **Most Sold deliberately unchanged** — it was already on v2 tokens + inherits Phase-2 chrome cleanly + §13b-frozen medal palette is spec-preserved. | ✅ shipped (uncommitted) |
| 9 | Cross-cutting QA + sweep — full mobile (375px) Puppeteer pass on all 9 routes light + dark; verified responsive collapses (Compare list-row hides secondary columns under 768px; Calculator 2-col → 1-col under 960px; Home stats stack; PDP hero side-by-side → vertical; Hamburger flyout opens full-screen with display 32px links + footer SG/SGD + theme toggle). Dark-mode parity verified end-to-end via token system — every page flips atomically with `.dark` class. Final `typecheck = 0`. CLAUDE.md §9d updated to handoff status. Known residuals listed below. | ✅ shipped (uncommitted) |

### Visual sweep (2026-05-20, post-Phase 5)

Puppeteer @ 1280×900, light + dark:
- ✅ `/` Home (mesh hero exact on web, dark mesh flips to warm rust)
- ✅ `/compare` (37 Stage-1 list rows; chips/tin-pickers/metric pills/details intact; §7c packshot halos visible in dark)
- ✅ `/product/abbott-grow-s1` (hero badges, DHA/ARA amber highlights, halal cert, price-ranking bars all 1:1)
- ✅ `/calculator` (existing v1 body + new chrome inherited cleanly)
- ✅ `/most-sold` (existing v1 podium + new chrome inherited)
- ✅ `/about` (existing v1 hero + new chrome)
- ✅ `/nutrition` placeholder (chrome + Footer visible)
- ✅ `/parents` placeholder (chrome + Footer visible)

Zero crashes; dark-mode token flip atomic; Footer 4-col layout intact.

### Non-obvious things a fresh agent needs to know

- **Two data models coexist by design.** `Product[]` (61 nested with variants) drives Most Sold + Calculator; `Formula[]` (76 flat) drives Compare/PDP/Head-to-Head. The merge logic in `src/data/formulas.ts` is the only place that bridges them. Both `Product` and `Formula` types live in `src/types/`. **Do NOT** delete `Product`/`ProductsContext` until Phase 8 ports Most Sold + Phase 7 ports Calculator.
- **Formula ID stability:** single-variant products keep their bare slug (`abbott-grow-s1`), multi-variant rows get `${id}--${packSize}` (`frisolac-gold-s1--400`). Compare cards strip the `--<size>` before routing; PDP uses `getFormulaByBaseId` to resolve. Phase 5 PDP shows one variant; the multi-variant picker is a Phase-9 polish.
- **The token system was already aligned** to the new design — Phase 0 found that `theme.ts` `palette` + `global.css` `--mw-*` vars already matched `MilkWiseFinalDesign/colors_and_type.css` exactly. Only 3 additions needed (`layout.sidebar`, `palette.focusRing`, `--mw-mesh*`). This is why Phases 3–5 didn't need any color drift work.
- **WebP-only image policy (user-mandated Phase 1).** Every Formula image is a `.webp` from `assets/products/` resolved via `imageMap.getProductImage(formula.img)`. **Do NOT** reference `MilkWiseFinalDesign/assets/products/*.jpg` or `MilkWiseFinalDesign/uploads/*.jpg` from runtime code. 2 design-only SKUs (Aptamil+Mideer / Wyeth-S3) use a same-brand WebP fallback baked into `formulas.ts`.
- **`FormulaCompareContext` is the new context.** It is mounted SIBLING to `ProductsProvider` in `_layout.tsx` so the legacy and new models coexist without ping-pong. Filter + tray state survives nav (same contract as ProductsContext §7); resets on hard reload.
- **`text-muted` debt** — `app/index.tsx` (now Compare = `app/compare.tsx`), `app/calculator.tsx`, `app/product/[id].tsx` (v1) had 74 uses of stale v1 `text-muted` Tailwind class resolving to cool grey `#6B7280` instead of design warm `#6E6A60`. Phase 4 (Compare) and Phase 5 (PDP) rebuilt away from this naturally. Calculator (Phase 7) and Most Sold (Phase 8) still hold residue — will fade as those phases ship.
- **Native fidelity compromises** (accepted at planning, documented in code):
  - Hero mesh → solid `creamSoft` on iOS/Android (no `expo-linear-gradient` dep added)
  - `position: sticky` nav → opaque `bgCard` on native (no `backdrop-filter`)
  - Sort "dropdown" → tap-to-cycle (no cross-platform `<select>`)
  - PDP highlights render as nested `<Text>` (no `<mark>`)
- **Lucide → emoji.** Phase 4 NavBar/Toolbar use unicode glyphs (`☰` `✕` `↑` `↓` `▦` `☷`) and emoji icons (`🍼` `🇸🇬` `🔍` `🧮` `📖`) instead of pulling `lucide-react-native`. Phase 9 polish can swap to a real icon set.

### Phase 9 sweep results (2026-05-20)

**Puppeteer @ 1280×900 light + dark:**
- ✅ All 9 routes render without crash. Atomic dark-mode flip via `.dark` class.
- ✅ §7c packshot halos render correctly on dark Compare/PDP cards.
- ✅ Hero mesh shows correctly on web (5-radial gradient + vignette + noise overlay via `--mw-mesh*` CSS vars).
- ✅ Head-to-Head 3-way comparison correctly highlights best-cell per row (lower wins for prices; higher for scoops/savings).

**Puppeteer @ 375×812 light + dark (mobile):**
- ✅ NavBar collapses to logo + hamburger; hamburger flyout opens full-screen with 7 display-size links + SG/SGD/theme footer.
- ✅ Home: 3-line hero title at 48px (vs 72 on desktop); stats band stacks vertically; CTAs stack.
- ✅ Compare: stage tabs scroll horizontally; brand pills scroll; list rows collapse to thumb + name + $/G + Details (secondary columns hidden under 768px via `useWindowDimensions` branch).
- ✅ PDP: hero image stacks above meta column at narrow widths (`flexWrap: 'wrap'`).
- ✅ Calculator: 2-column layout reflows to single column under 960px.
- ✅ Long-form pages (Nutrition / Parents / About): typography reflows; cards stack from row to column.
- ✅ Most Sold: podium reflows to single-column stack.

### Known residuals (Phase 9+ polish)

These are visible in the sweep but didn't warrant immediate fix; queue for follow-up commits:

1. **Calculator stepper "ml" unit label clips at 375px width.** The ml/feeds-per-day stepper rows have +/- buttons + 0-value field + unit text; at 375px the unit gets pushed off the right edge by ~6px. Fix: `flexShrink: 0` on the unit `<Text>` and `flexShrink: 1` on the numeric input, or trim stepper padding by 4px.
2. **Head-to-Head table at 375px is cramped.** 3 product columns + 1 label column on a 375px viewport means each cell gets ~80px. Render is functional (no overflow / clipping in tests) but tight. Phase-10 polish could either add horizontal scroll on the table or stack product columns vertically as cards at <768px.
3. **`text-muted` debt still present in `app/calculator.tsx` (~30 sites).** Resolves to stale v1 cool grey `#6B7280` instead of design warm `#6E6A60`. Calculator was reconcile-not-rebuild; a class-only sweep would fix in one pass. **Phase-10 cleanup.**
4. **Sticky StageTabs / BrandBar / Toolbar on Compare** — deferred from Phase 4. Scroll away with the page today; Phase 10 can pin them under the NavBar via `position: sticky` per-element on web (native ignores).
5. **Sort tap-to-cycle, not a real dropdown.** Phase 4 chose pragmatic cross-platform; Phase 10 could add an overlay popover or use `@react-native-picker/picker` on native + DOM `<select>` on web.
6. **Compare search input** — removed from NavBar in Phase 2; design puts it in the toolbar. Still not back; user types nothing there today. Phase 10.
7. **Native fidelity caveats (accepted at planning, encoded in code):**
   - Hero mesh → solid `creamSoft` on iOS/Android (no `expo-linear-gradient` dep)
   - `position: sticky` nav → opaque `bgCard` on native (no `backdrop-filter`)
   - PDP highlights render as nested `<Text>` (no `<mark>`)
   - PDF download in H2H is an `alert()` stub
8. **§13b a11y residuals carried from the v2 reskin** still apply to Most Sold's gold/silver/bronze medal strips (spec-frozen palette) and the sage hero/footer-band small text. **Need design input** before public-launch.
9. **Safari sweep pending** — all QA was Chromium/Puppeteer.

### Resume next

The rebuild itself is done. Remaining work is the **commit + polish + launch path**:

1. **Commit Phases 2–9** — currently uncommitted on `final-design-rebuild`. Recommend ONE coherent commit per phase or one rolling commit per cluster (e.g., `Phases 2–5: app shell + Home + Compare + PDP`, `Phases 6–8: H2H + Calculator + content pages`, `Phase 9: QA + handoff`). Or one big rollup — user's call.
2. **Push** to `origin/final-design-rebuild` (already exists).
3. **PR to `FinalDesign`** (or `main` once ready) — open a pull request with a phase-by-phase description; the §9d phase table is the executive summary.
4. **Phase 10 polish backlog** (the 9 residuals listed above) — can ship in follow-up PRs.
5. **§9 launch backlog** (hosting / SEO / legal pages / Lighthouse / iOS+Android device pass) still stands from the v2 reskin work — final-design-rebuild doesn't change that list.

The §9d phase table + this residual list IS the rebuild's handoff. A fresh agent post-merge should read top-to-bottom and pick up cleanly.

---

## 10. Notes for code-reviewing AI agents

If you're a fresh AI agent (Claude in another session, ChatGPT, Gemini, etc.) brought in to vet this codebase before launch, focus your review on these areas. Each lists the files to read first.

### Security
- `app/_layout.tsx` — font loading; verify no remote fetch with user-controllable input
- `src/services/productRepository.ts` — factory; confirm no env-driven path leaks credentials
- `src/components/SearchBar.tsx` + `Header.tsx` — verify user input is never rendered as HTML or passed to `eval`/`Function`
- `.gitignore` + `git log --all -p -- '*.env*'` — confirm no committed secrets
- `package.json` — flag any deps with known CVEs (`npm audit` shows 4 moderate)
- `src/data/imageMap.ts` — confirm only local `require()`, no remote URLs

### Correctness
- `src/hooks/useProducts.ts` — filter composition (OR within / AND across); sort stability
- `src/components/compare/CompareModal.tsx` — `ModalShell` platform branch; web focus trap; native `onRequestClose`
- `src/components/product/ProductCard.tsx` — variant pill / select dot DO NOT navigate (intentional)
- `src/contexts/ProductsContext.tsx` — single source of truth; survives nav, dies on refresh
- `app/calculator.tsx` — composite `productId#variantIdx` keys; benchmark math vs SG HPB/KKH norms
- `src/data/products.json` + `productDetails.json` — verify prices/nutrition match SG retail reality

### Accessibility
- Run Lighthouse + axe DevTools on every route
- Manual VoiceOver/TalkBack pass (script: Compare → select 2 → open modal → Esc → focus restored)
- Color contrast at 10-12 px on specialty palette pairs (AA = 4.5:1)
- Keyboard-only nav: Tab order, Enter activation, Esc dismiss, focus visibility on green-background pills
- Phase D covered DOM-attribute correctness; AT announcement flow is the gap

### Performance
- `assets/products/` — 72 JPEGs, ~60+ MB unoptimized. WebP + responsive sizes needed.
- `src/data/imageMap.ts` — Metro `require()` bundling; confirm no double-loading
- Re-render counts on Compare — `ProductCard` + `ProductListRow` may need `memo` if scale grows
- Bundle size — `expo export --platform web` then inspect `dist/_expo/static/js/web/*.js`

### Style / conventions
- TypeScript strict; no `any` without justification
- Comments explain *why*, never *what*
- No hard-coded colors or spacing — use `theme.ts` tokens
- Tailwind classes via NativeWind; inline `style` only for arbitrary or runtime-computed values
- Every Pressable: `accessibilityLabel` + `accessibilityRole` + `hitSlop` if visible target < 44 px

---

## 11. Common gotchas

- **Filters reset on back-nav** — the bug; fixed by `ProductsContext`. If it returns, the context boundary moved.
- **Variant pill triggers navigation** — don't wrap the card in `<Link>`. Use the click-target pattern.
- **Font weight wrong on native** — use `font-sans-bold`, not `font-bold` (no synthesis).
- **Image filename with `+`** — Metro mangles to space. Use `-`.
- **New product image looks mis-scaled / no dark halo** — it wasn't run through the §7c normalisation (1200² @84%). Normalise it, then `npm run generate:images`. Don't try to fix scale in CSS — `contain` works on the canvas, not the alpha.
- **`products.json` references `.webp` not `.jpg`** — intentional, user-directed (§7c). Not a §7b violation; don't revert.
- **Tailwind arbitrary values missing** — confirm `content` includes `./src/**/*.{js,jsx,ts,tsx}`.
- **Modal renders inline on web** — wrapped in `ModalShell`; on web that's `position: 'fixed'`.
- **Specialty key missing** — `Specialty` union must match `products.json` raw strings (currently 11 keys).

---

## 12. Session boundary protocol

When the user says "save this convo" / "start a new chat" / "i want to start a new chat":
1. Update **§8** (built), **§9** (launch backlog), and **§9b** (v2 re-skin progress — tick off completed phases) to reflect what shipped this session and what's still open.
2. Confirm the active branch is recorded (`redesign-v2` for v2 work) and `testingprod` is still clean.
3. Don't preserve in-session task lists, tutorials, or commentary.
4. Confirm: *"CLAUDE.md updated. Start your new chat with: read CLAUDE.md and continue."*
