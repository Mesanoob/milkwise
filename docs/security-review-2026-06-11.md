# MilkWise SG — Security, Responsiveness & Production-Readiness Review

**Date:** 2026-06-11 · **Reviewer:** Claude Code · **Baseline:** `main` @ `7c8e5df`
**Branch:** `security-review`

This review follows up the Codex security scan of 2026-06-02 (report itself was
in `/tmp` and has been cleaned up; its fix-priority list is preserved in
`CONTINUITY.md`) and adds a fresh code review, responsiveness/CSS verification,
UI/UX assessment, and production-readiness work.

---

## 1. Security findings & fixes

### Fixed in this branch

| # | Finding | Fix |
|---|---------|-----|
| S1 | **Critical npm advisory** — `shell-quote` 1.1.0–1.8.3 (newline escaping), plus `ws` (memory disclosure) and `brace-expansion` (ReDoS) | `npm audit fix` applied — all three resolved without breaking changes. **0 critical / 0 high remain.** |
| S2 | **Banner dismiss key unversioned** — comment claimed versioning but key was `mw_banner_dismissed`; a future message change could be silently suppressed | Key is now `mw_banner_dismissed_v1` ([DisclaimerBanner.tsx](../src/components/DisclaimerBanner.tsx)) |
| S3 | **No env fail-fast** — a production build with `FEATURES.useRemoteData: true` and missing Supabase env vars would silently render an empty catalogue | `env.ts` now validates `EXPO_PUBLIC_CHANNEL` against an allowlist and exports `assertEnv()`; `SupabaseProductRepository`'s constructor fail-fasts; `getProductRepository()` now actually honours the feature flag |
| S4 | **No privacy disclosure for stored DOB** — the calculator persists a baby's date of birth (personal data under PDPA) with no policy page anywhere | New `/privacy` page enumerating every stored key (theme, banner, DOB), all local-only; linked from the Footer |
| S5 | **Most Sold disclaimer copy** — said "not investment advice" (wrong domain); didn't state the ranking is editorial | Rewritten: curated editorial content, not audited sales data, not medical/purchasing advice |
| S6 | **No security headers** | `vercel.json` + `public/_headers` (Cloudflare Pages/Netlify) with CSP, HSTS, nosniff, frame-ancestors none, Referrer-Policy, Permissions-Policy. CSP derived from the actual export: `script-src 'self'` (no inline scripts in bundle), `style-src 'unsafe-inline'` (required by react-native-web), `img-src data:` (HeroMesh grain SVG) |
| S7 | **Dev sitemap exposed** — Expo Router's `/_sitemap` debug route was exported to production | Disabled via `expo-router` plugin option `sitemap: false` |

### Verified clean (no action needed)

- No dynamic code evaluation or raw-HTML injection APIs used anywhere in the codebase.
- No hardcoded secrets; `.env.example` correctly documents the EXPO_PUBLIC_ boundary; `.env.local` git-ignored.
- No external URL handling, no `Linking.openURL`, no third-party network requests at runtime — the app is fully static.
- All AsyncStorage reads/writes are best-effort with catch handlers; storage failure degrades safely (banner shows, defaults apply).
- Mutation methods on the static repository throw rather than fake-persisting.

### Remaining (documented, not fixed here)

- **14 moderate npm advisories** — all chain to the Expo SDK 54 build toolchain
  (`@expo/config`, `postcss`, `uuid`, `xcode`). These are build-time only; they
  do not ship in the client bundle. Resolution = Expo SDK 56 upgrade
  (`npm audit fix --force` → `expo@56.0.9`, semver-major). Recommend doing this
  as its own branch with a full regression sweep — not bundled into this review.
- **CSP `connect-src 'self'`** must gain `https://*.supabase.co` if/when
  `FEATURES.useRemoteData` ships.

---

## 2. SEO / production readiness (added in this branch)

- **Static rendering enabled** (`web.output: "static"`) — all 11 routes now
  pre-render to real HTML files with full content, instead of one empty SPA shell.
- **`app/+html.tsx`** — document shell: viewport, theme-color, canonical,
  OG site tags, Twitter card.
- **Per-route titles + descriptions** — new `PageMeta` component mounted in
  every screen (fixes the empty `document.title` — Expo Router's head manager
  owned the title and nothing set it). Product pages get dynamic titles.
- **`public/robots.txt`** — allow-all, with sitemap line stubbed pending domain.
- **Routing config for the dynamic route** — `vercel.json` rewrite +
  `public/_redirects` so `/product/:id` serves the exported `[id].html` shell.
- **`userInterfaceStyle: "automatic"`** — was `"light"`, which forced
  `Appearance.getColorScheme()` to always report light on iOS/Android,
  breaking system dark detection on native.
- **Deploy config** — `vercel.json` carries `buildCommand` + `outputDirectory`
  + immutable caching for hashed `/_expo/static/*` and `/assets/*`.

### Still open before launch (from the original blocker list)

1. Production hosting + domain + DNS (configs are ready for Vercel or CF Pages).
2. OG image + favicon set (only `favicon.png`/`favicon.ico` exist; no `og:image`).
3. `sitemap.xml` once the domain is fixed (then un-stub robots.txt).
4. Error tracking (Sentry) + privacy-respecting analytics (Plausible) — note:
   adding analytics requires updating the new privacy page **first** (§5 of the
   policy promises this).
5. Expo SDK 56 upgrade for the remaining moderate advisories.

---

## 3. Responsiveness & CSS verification

Verified against the **production static export** (not the dev server),
served locally, Chromium:

| Route | 375×812 light | 375×812 dark | 1280 light | 1280 dark |
|---|---|---|---|---|
| `/` (Home) | ✅ | ✅ | ✅ | — |
| `/compare` | ✅ list rows collapse to image+name+$/g | — | — | ✅ full metric pills |
| `/calculator` | ✅ inputs stack, steppers usable | — | — | — |
| `/product/dumex-s1` | ✅ (via client nav) | — | — | — |
| `/most-sold` | ✅ podium stacks | — | — | — |
| `/about`, `/privacy` | ✅ 720px prose clamps | — | ✅ | — |
| `/head-to-head`, `/nutrition`, `/parents` | ✅ loaded, console clean | — | — | — |

- **Zero console errors or warnings** across every route (including hydration —
  static HTML + client hydration produce no React mismatches).
- Breakpoint system is consistent: single 768px tablet threshold via
  `useWindowDimensions`, applied per-screen; CSS variables flip atomically for
  dark mode; dark packshot halo renders correctly.
- Dynamic-route caveat: `/product/:id` deep links 404 on a plain static file
  server — the shipped `vercel.json` / `_redirects` rules handle this in
  production. Don't host without one of them.

---

## 4. UI/UX assessment

**Good:** consistent token usage, mono-on-numerals discipline holds, list rows
adapt sensibly at each width, empty states exist (H2H, not-found route),
accessibility roles/labels present on interactive elements, disclaimer banner
defaults to visible on storage failure (correct for a health-adjacent app).

**Recommendations (not blocking launch):**

1. **System theme detection is disabled** — ThemeContext hard-seeds `'light'`
   (latency investigation, 2026-05-19). The dead-click cause was diagnosed and
   the toggle is now binary, so the investigation looks finished; consider
   re-seeding from `Appearance.getColorScheme()` so night-feed parents get dark
   mode without hunting for the toggle. The restore-verbatim blocks are still
   in the file.
2. Existing Phase-10 backlog stands: sticky Compare toolbar, real sort
   dropdown, H2H table at 375px, PDF stub, Safari + real-device pass.
3. Product page title now uses the product name alone (was "Dumex Dumex
   Dulac…" — brand duplicated because product names embed the brand).

## 5. Performance notes

- JS bundle: 1.78 MB raw (~450 KB gzip) — normal for RN-web; hashed filenames
  + immutable caching configured. A meaningful cut would need Expo SDK 56's
  improved tree-shaking; fold into the SDK upgrade.
- Compare page already paginates (`INITIAL_RENDER_COUNT` 12 / `PAGE_SIZE` 24).
- 72 WebP packshots (~10 MB total) load lazily per-card; fine.
- Static pre-render means first paint no longer waits for JS on every route.

---

## Verification

- `npm run typecheck` — 0 errors.
- `npx expo export -p web` — clean; 11 static routes; per-route titles
  confirmed in exported HTML; `_sitemap` gone.
- `npm audit` — 0 critical, 0 high, 14 moderate (all SDK-56-gated, build-time).
- Visual sweep as per §3.
