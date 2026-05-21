# AGENT.md - MilkWise SG

Working instructions for agents in this folder.

## Project Role

You are working on **MilkWise SG**, an independent baby-formula comparison and price calculator for Singapore parents. This is a real production-bound app for Web PWA, iOS App Store, and Google Play.

The user is an absolute beginner. Explain errors and decisions clearly, but do not turn every task into a lecture unless the user is asking to learn.

## Beginner Mentor Protocol

When the user asks how to solve something or what to build:

1. Ask for or wait for the user's attempt first.
2. Correct the attempt directly and truthfully.
3. Give hints, search terms, docs, and concepts before giving code.
4. Only give the complete solution when the user types the exact phrase `i give up`.
5. If the user asks you to implement a concrete approved plan, implement it.

Avoid reassurance filler. Be direct, factual, and useful.

## Workspace Boundaries

- `milkwise/` is the working Expo app. Make code and documentation changes here when asked.
- `MilkWiseFinalDesign/` is read-only design reference. Inspect it for visual, content, and interaction guidance, but do not edit it unless the user explicitly says to.
- Do not overwrite or rewrite `CLAUDE.md` unless the user explicitly asks.
- Do not push or commit unless the user explicitly asks.
- The worktree may already contain user changes. Do not revert or overwrite unrelated dirty files.

## Tech Stack

- Expo SDK 54
- Expo Router
- React Native 0.81
- React 19
- TypeScript strict mode
- NativeWind / Tailwind
- AsyncStorage for persisted local preferences
- `react-native-svg` for charts and visualizations
- Inter, Inter Tight, and JetBrains Mono fonts loaded in `app/_layout.tsx`

Common commands from `milkwise/`:

```bash
npm run web
npm run ios
npm run android
npm run typecheck
npm run generate:images
```

Run `npm run typecheck` before claiming any code change is done. Documentation-only changes do not require an app build.

## Architecture

The app uses Expo Router routes under `app/`:

- `/` home
- `/compare`
- `/product/[id]`
- `/head-to-head`
- `/calculator`
- `/most-sold`
- `/nutrition`
- `/parents`
- `/about`

Core folders:

- `src/components/` contains reusable UI.
- `src/components/compare/v2/` contains the rebuilt compare UI.
- `src/components/product/` contains legacy product-card/list UI.
- `src/contexts/` contains app-wide React state.
- `src/data/` contains bundled JSON, image maps, and data adapters.
- `src/services/` contains the repository abstraction for product data.
- `src/types/` contains domain types.
- `src/utils/` contains pure formatting, classification, and string helpers.
- `src/config/theme.ts` contains TypeScript design tokens.
- `global.css` contains web CSS variables and NativeWind global rules.
- `assets/products/` contains runtime WebP product packshots.

## Data Model Rules

Two data models intentionally coexist:

- `Product[]` is the older nested catalogue model from `src/types/product.ts`.
- `Formula[]` is the newer flat, design-shaped model from `src/types/formula.ts`.

Do not collapse these models casually. Screens still depend on both:

- `Formula[]` powers rebuilt Compare, Product Detail, Head-to-Head, and Calculator behavior.
- `Product[]` still supports legacy flows and repository-backed product access.

`src/data/formulas.ts` joins the design's 76-row dataset to the curated product data and enriches rows with stable ids, WebP image keys, ingredients, and allergens. Treat this adapter as important app logic, not throwaway glue.

The repository layer in `src/services/productRepository.ts` exists so static JSON can later be swapped for Supabase. Keep UI code behind repository or adapter boundaries where practical.

## Design Rules

Use the MilkWise design system already ported into the app:

- Prefer `useTheme().tokens`, `src/config/theme.ts`, `global.css`, and Tailwind `mw-*` utilities.
- Do not introduce random hard-coded hex values. Use tokens unless a file already has a documented spec-frozen palette.
- Keep `theme.ts`, `global.css`, and `tailwind.config.js` in sync when editing shared tokens.
- Every isolated price, ratio, scoop count, month, and per-unit number should use JetBrains Mono with `fontVariant: ['tabular-nums']`.
- Product images must come from `assets/products/*.webp` through `src/data/imageMap.ts`.
- Do not reference `MilkWiseFinalDesign/assets/products/*.jpg` from runtime code.
- Health-adjacent and pricing claims need visible disclaimers or source context. MilkWise is not medical advice and is not brand-sponsored.
- The tone is calm, factual, specific, and second-person where appropriate. Avoid marketing adjectives.

## Current Product Behavior

- `ThemeContext` controls light/dark mode and persists the preference in AsyncStorage.
- `Screen` renders the shared disclaimer banner, header/nav, scroll content, and footer.
- `FormulaCompareContext` stores Compare stage, brand, filters, sort, view, and tray state in memory across route navigation.
- Calculator persists DOB in AsyncStorage and calculates feeding/cost projections from `Formula` rows.

## Recent Work: `Optimse` Branch

The `Optimse` branch was created and pushed for web performance cleanup.

Completed changes:

- Imported only the used Inter, Inter Tight, and JetBrains Mono font weights in `app/_layout.tsx`.
- Removed unused `ProductsProvider` startup work from the root layout.
- Deleted unreferenced legacy compare, product, filter, product context, hook, and filter type files after import checks and typecheck confirmed they were unused.
- Stabilized repeated `getAllFormulas()` use in Product Detail and Compare filter helpers.
- Added progressive rendering to `/compare` with a "Show more" control.
- Removed tracked stray `assets/products/image.png`.
- Made `scripts/generate-image-map.mjs` WebP-only.

Verification performed:

- `npm run typecheck` passed.
- `npx expo export --platform web` passed.
- Browser smoke tests passed for `/`, `/compare`, `/product/dumex-s1`, `/head-to-head`, `/calculator`, and `/most-sold`.
- Export evidence improved from 52 font files / 13M fonts / 23M `dist` to 7 font files / 1.8M fonts / 12M `dist`.

Preserved constraints:

- `CLAUDE.md` was not overwritten.
- `MilkWiseFinalDesign/` was not edited.
- Existing calculator work was preserved.

## Workflow Rules

- Read existing code before changing it. Follow local patterns.
- Keep edits scoped to the requested task.
- Prefer small, focused files and functions.
- Comments should explain why, not restate what the code says.
- Use `apply_patch` for manual edits.
- Do not run destructive git commands.
- If a command fails because of sandboxing or network restrictions, request approval instead of working around it.
- After code changes, report what changed and what verification ran.

## Known Backlog

These are known follow-up areas, not bugs to fix unless the user asks:

- Sticky Compare StageTabs and Toolbar.
- Real Compare sort dropdown.
- Compare toolbar search field.
- Tighter mobile Head-to-Head layout.
- Real PDF download instead of the current stub behavior.
- Safari and real-device QA.
- Android emulator QA.
- PWA add-to-home-screen prompt.
- Lighthouse audit.
- Production hosting, domain, legal pages, SEO metadata, analytics, and Sentry.
- Supabase backend and admin CRUD.
- Route-level bundle splitting and deferred loading for heavy native/web-only modules where Expo Router supports it cleanly.
- Image review for oversized WebP assets and responsive image sizing on web.
- Persisted compare state only if there is a clear UX need; current state is intentionally in-memory.
