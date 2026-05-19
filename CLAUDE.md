# CLAUDE.md — MilkWise SG

Single source of truth for this project. Read top-to-bottom on first session, then jump back to sections 8, 9, and 9b as work progresses. Last updated 2026-05-19.

> **ACTIVE WORK: v2 design re-skin (Phases 0–5 ✅, Phase 6 next).** New design system (sage/cream, Inter/Inter Tight/JetBrains Mono, OS-seeded dark mode) on branch `redesign-v2`. **Visual re-skin only** — no screen/data/logic changes. The full v1 token layer is deleted; `themeFor`/`palette` + `mw-*`/`font-*` classes are the sole token source. All numerals now render in tabular JetBrains Mono (Phase 5). **Resume point:** Phase 6 — token *application*: apply v2 `radius` (input 8 / card 12 / cardLg 18 / pill 999 — `tokens.ts` canonical, NOT the stale §7b prose; see the radii note under the §9b table), the 2-step `elevation` shadows (`tokens.shadow` s1/s2/s3 — replaces the remaining `shadowColor:'#000'` in product/[id] `Card` etc.), and the `space` scale, per the §7b surface rules. Then Phase 7 (a11y + Safari sweep, both themes). Exact conventions + commit trail in §9b. Product imagery is now transparent-normalised WebP + dark sticker halo — see §7c. `testingprod` remains the shippable v1; all v2 work is committed locally on `redesign-v2` (not pushed).

---

## 1. Project

**MilkWise SG** — side-by-side baby formula comparison tool for Singapore parents.

- **Catalogue:** 61 hand-curated products, 15 brands, prices and nutrition from major SG retailers
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
| `testingprod` | **v1 — shippable.** Current design (forest green, DM fonts). Stays working/launchable. |
| `redesign-v2` | **Active dev.** v2 visual re-skin (sage/cream, Inter/JetBrains, dark mode). Branched off clean `testingprod`. Do work here. |
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
| 6 | **Token application** — radii, 2-step shadows, spacing scale applied per §7b surface rules | shared components | M |
| 7 | **A11y + dark-mode QA** — re-run Phase D checks against new tokens in BOTH themes (contrast AA, focus ring on sage/dark, tap targets), Puppeteer + Safari sweep | — | M |

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
