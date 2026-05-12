# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Project Role: Beginner Coding Mentor

## Context
- **User Level:** Absolute Beginner. I have zero prior experience with coding, terminal commands, or cloud infrastructure.
- **Project Goal:** Build, host, and launch a full-scale application on the Web, Google Play Store, and iOS App Store.
- **Starting Point:** An existing code base/design provided by Claude.

## Your Mission (The "Challenge" Protocol)
**IMPORTANT:** This is how I learn best. Follow this exactly.

1. **You Try First:** When I ask how to solve something or what to build, I will provide my answer/attempt first.
2. **Honest Correction:** You correct me truthfully and directly—without encouragement words like "you're close!" or "good try!"
3. **Hints, Not Answers:** Give me search terms, documentation links, or hints to figure it out myself. Example: "Look up React's `useState` hook and how it handles boolean state." Or "Search for 'array.filter() JavaScript' to see how to filter arrays."
4. **I Give Up Rule:** If I say "i give up" (exact phrase), then give me the complete solution with explanation.
5. **Goal:** Help me genuinely learn web development, React fundamentals, and build MilkWise SG to a publishable state.

## My Learning Style
- **Challenge me.** I don't learn from reassurance; I learn from working through problems.
- **Be direct.** Tell me what's wrong, not what's "almost right."
- **Give guidance, not code.** Point me to docs, examples, or concepts to research. Let me implement.
- **Expect iteration.** I'll try, fail, learn, try again—that's the process.

## Coding Standards & Preferences
- **Language:** TypeScript / React Native (Expo)
- **Style:** Clean, well-commented code. Comments explain *why*, not *what*.
- **Error Handling:** When an error occurs, explain the error message and what it means so I can diagnose it next time.

## Project Scope
- **Build MilkWise SG** for Web, iOS (App Store), and Android (Google Play)
- **Ship it.** This isn't practice—it's a real project going to production.
- **Learn React properly.** Component architecture, state management, prop drilling, conditional rendering—the fundamentals.

---

# Session Management Protocol
**IMPORTANT — Trigger phrases to watch for:**
If the user types any of the following:
- "save this convo"
- "save current conversation"
- "i want to start a new chat"

You must immediately update the **Session Progress Log** section below with:
1. Every concept covered this session and whether the user understood it
2. Every file created or modified (with file path)
3. Every decision made about architecture or structure
4. Exactly where the conversation stopped and what the next task is
5. Any open questions the user had that weren't resolved

Then confirm to the user: "CLAUDE.md updated. Start your new chat and say: *read CLAUDE.md and continue where we left off*."

---

# Session Progress Log
*This section is a running log of what has been covered so far. Update after each session.*

## ✅ Session 1 COMPLETE — All Production-Grade Code Built & Tested

### What Has Been Built (Code)
**FULLY FUNCTIONAL COMPARE SCREEN** with all features working:
- `app/index.tsx` — Compare screen with search, filters, sort, display modes
- `app/product/[id].tsx` — Product detail screen with full nutrition data
- `app/calculator.tsx` — Placeholder "Coming soon" screen (Session 2)
- `app/most-sold.tsx` — Top 10 rankings by price/100g (functional preview)
- `app/about.tsx` — Static content screens with 3 sections
- `app/+not-found.tsx` — 404 fallback page

**Component Library** (production-grade):
- `src/components/Screen.tsx` — Layout wrapper (SafeArea, header, nav)
- `src/components/Header.tsx` — Sticky nav with desktop/mobile responsive
- `src/components/BottomNav.tsx` — Mobile-only tab navigation
- `src/components/SearchBar.tsx` — Controlled input with clear button
- `src/components/DisplayToggle.tsx` — Card/List/Picture view toggle
- `src/components/SortDropdown.tsx` — Sort by field + direction (web select / native cycling)
- `src/components/Tag.tsx` — Attribute badges (Halal, Organic, etc.)
- `src/components/filters/StageTabs.tsx` — Stage 1/2/3 filter pills
- `src/components/filters/BrandPills.tsx` — Brand filter (15 brands)
- `src/components/filters/SpecialtyChips.tsx` — Specialty filter (8 specialties)
- `src/components/product/ProductCard.tsx` — Tile layout (cards view)
- `src/components/product/ProductListRow.tsx` — Dense row layout (list view)
- `src/components/product/ProductPicture.tsx` — Image-only layout (pictures view)
- `src/components/product/ProductGrid.tsx` — Dispatcher by display mode
- `src/components/EmptyState.tsx` — "No results" state + reset button

**Data & Services Layer**:
- `src/data/products.json` — 61 products (hand-curated Singapore retail)
- `src/data/productDetails.json` — Full nutrition + ingredients per product
- `src/data/imageMap.ts` — Auto-generated Metro bundle map (72 images)
- `src/data/products.ts` — Exports: getAllProducts(), getProductById(), ALL_BRANDS, ALL_STAGES, ALL_SPECIALTIES
- `src/data/productDetails.ts` — Exports: getProductDetail(id)
- `src/services/productRepository.ts` — Repository pattern interface + factory
- `src/services/staticProductRepository.ts` — In-memory JSON reader
- `src/services/supabaseProductRepository.ts` — Stub for Session 3

**Hooks** (state machine):
- `src/hooks/useProducts.ts` — Central filter/sort/search logic using useMemo

**Config & Utilities**:
- `src/config/theme.ts` — Design tokens (colors, shadows, spacing) mirrored from tailwind.config.js
- `src/config/constants.ts` — APP_NAME, MAX_COMPARE_PRODUCTS, storage keys, feature flags
- `src/config/env.ts` — Typed environment variables (Supabase creds, channel)
- `src/types/product.ts` — Product, ProductVariant, ProductDetail interfaces
- `src/types/filters.ts` — DisplayMode, FilterState, sort fields
- `src/utils/format.ts` — formatCurrency(), formatUnitPrice(), formatNutrient(), etc.
- `src/utils/strings.ts` — normaliseForSearch(), labelForSpecialty()

**Build & Config**:
- `tailwind.config.js` — Custom theme colors + NativeWind preset
- `package.json` — Added: typecheck, generate:images scripts
- `.env.example` — Template for Supabase/channel secrets
- `.gitignore` — Excludes .env, env files, native folders
- `scripts/generate-image-map.mjs` — Auto-generates imageMap.ts from assets/

## React Concepts Covered (User Understands These)
1. **Components** — Reusable UI pieces. Any function that returns UI. Lives in its own `.tsx` file. Examples: SearchBar, FilterBar, ProductCard, Header.
2. **Props** — Data passed FROM parent TO child. Like a function argument. Child receives it, doesn't own it.
3. **State (`useState`)** — A variable React watches. When it changes, the component redraws. Two jobs: remember a value + trigger a re-render. Created with `const [value, setValue] = useState(defaultValue)`.
4. **Callback Props** — Parent passes a function down to child as a prop. Child calls it on interaction (e.g. button press). Child doesn't know what it does — parent decides.
5. **Derived State** — Don't store the filtered result in state. Store the filter selection. Calculate the result from it.
6. **Array Destructuring** — The `[value, setValue]` syntax. Unpacks an array into named variables instead of using index[0], index[1].
7. **One-Way Data Flow** — State lives at the top (parent). Props flow down. Events bubble back up via callbacks.
8. **array.filter()** — How filtering works. Loops through array, keeps items that match condition.

## Concepts Mentioned But Not Yet Deep-Dived
- `useContext` — For sharing state across deeply nested components without prop drilling. Not needed yet.
- Redux — For global state across many pages. Not needed for this project at current scale.
- Indexing for performance — Not needed at 61 products. Revisit if data scales to thousands.

## Session 1 Summary — What Worked & What Got Fixed

### Critical Fix Applied
**Tailwind CSS Configuration Issue** — The `content` path in `tailwind.config.js` was scanning only `./app/` and `./components/` but the actual component files are in `./src/`. This meant arbitrary width values like `min-w-[160px]` and `max-w-[280px]` were never compiled to CSS. Result: product cards rendered at 19px wide instead of 160-280px. **FIX:** Updated content path to include `./src/**/*.{js,jsx,ts,tsx}`.

**Image Asset Filename Issue** — Metro bundler was mangling the '+' character in filenames to ' ' (space), e.g., `Enfamil_Pro-A+_400g.jpg` → `Enfamil_Pro-A _400g.jpg`. **FIX:** Renamed all 11 affected product images, replacing '+' with '-'.

### ✅ All Features Tested & Working
1. **Compare Screen** — All 61 products display correctly in 3 view modes
2. **Filtering** — Brand (15 options), Stage (4 options), Specialty (8 options) all functional
3. **Search** — Real-time text filtering across name, brand, specialty
4. **Sort** — 7 sort fields (price, price/100g, price/scoop, protein, dha, name, brand) with direction toggle
5. **Display Modes** — Cards (detailed tile), List (dense rows), Pictures (images only) all working
6. **Product Detail** — Hero image, nutrition summary, full nutrition table, ingredients, allergens
7. **Navigation** — 5 pages, Expo Router working correctly
8. **TypeScript Strict** — `npm run typecheck` passes with 0 errors

### Next Session (Session 2) Priorities
1. **Calculator Screen** — Build cost-per-feed math: feed volume → scoops/day → monthly spend per brand
2. **Most Sold Implementation** — Replace top-10-by-price-per-gram with real analytics once backend is live
3. **Polish & A11y Pass** — Keyboard navigation, screen reader labels, mobile tap targets, focus states
4. **Performance Audit** — Check bundle size, image optimization, component render counts

## File Structure — Actual Implementation
```
milkwise/
├── app/
│   ├── _layout.tsx         ← Root layout (SafeAreaProvider, StatusBar)
│   ├── index.tsx           ← Compare screen (all features: filters, search, sort, display modes)
│   ├── product/[id].tsx    ← Product detail (nutrition, ingredients, "best for")
│   ├── calculator.tsx      ← Placeholder "Coming soon"
│   ├── most-sold.tsx       ← Top 10 formulas by price/100g
│   ├── about.tsx           ← 3 sections: what/how/disclaimers
│   └── +not-found.tsx      ← 404 fallback
├── src/
│   ├── components/
│   │   ├── Screen.tsx                     ← Layout wrapper
│   │   ├── Header.tsx                     ← Desktop nav + logo
│   │   ├── BottomNav.tsx                  ← Mobile-only tabs
│   │   ├── SearchBar.tsx                  ← Text input + clear button
│   │   ├── DisplayToggle.tsx              ← Cards/List/Pictures toggle
│   │   ├── SortDropdown.tsx               ← Sort field + direction
│   │   ├── Tag.tsx                        ← Attribute badges
│   │   ├── EmptyState.tsx                 ← "No results" + reset button
│   │   ├── filters/
│   │   │   ├── StageTabs.tsx              ← Stage 1/2/3 pills
│   │   │   ├── BrandPills.tsx             ← 15 brand filter pills
│   │   │   └── SpecialtyChips.tsx         ← 8 specialty chips
│   │   └── product/
│   │       ├── ProductCard.tsx            ← Tile with image, name, price, tags
│   │       ├── ProductListRow.tsx         ← Dense row (image + info + price)
│   │       ├── ProductPicture.tsx         ← Image + price only
│   │       └── ProductGrid.tsx            ← Dispatcher (empty state, cards/list/pictures)
│   ├── hooks/
│   │   └── useProducts.ts                 ← Central state machine (filters, search, sort)
│   ├── services/
│   │   ├── productRepository.ts           ← Interface + factory
│   │   ├── staticProductRepository.ts     ← In-memory JSON reader
│   │   └── supabaseProductRepository.ts   ← Stub for Session 3
│   ├── data/
│   │   ├── products.json                  ← 61 products (hand-curated)
│   │   ├── productDetails.json            ← Full nutrition + ingredients
│   │   ├── products.ts                    ← Helpers: getAllProducts(), getProductById(), ALL_BRANDS, etc.
│   │   ├── productDetails.ts              ← Helper: getProductDetail(id)
│   │   ├── imageMap.ts                    ← Auto-generated Metro require() map
│   │   └── [72 product images]
│   ├── config/
│   │   ├── theme.ts                       ← Design tokens (colors, shadows, spacing)
│   │   ├── constants.ts                   ← APP_NAME, MAX_COMPARE_PRODUCTS, feature flags
│   │   └── env.ts                         ← Typed env vars (Supabase, channel)
│   ├── types/
│   │   ├── product.ts                     ← Product, ProductVariant, ProductDetail
│   │   └── filters.ts                     ← DisplayMode, FilterState, sort fields
│   └── utils/
│       ├── format.ts                      ← formatCurrency(), formatUnitPrice(), etc.
│       └── strings.ts                     ← normaliseForSearch(), labelForSpecialty()
├── assets/
│   └── products/                          ← 72 product tin images (.jpg)
├── scripts/
│   └── generate-image-map.mjs             ← Regenerates src/data/imageMap.ts
├── tailwind.config.js                     ← Custom theme + NativeWind preset
├── tsconfig.json                          ← Strict mode enabled
├── package.json                           ← Scripts: typecheck, generate:images, web, ios, android
├── .env.example                           ← Template for secrets
└── .gitignore                             ← Excludes .env, native folders
```

## Design Tokens (From Original HTML Prototypes)
- Primary green: `#1B5E3B`
- Accent amber: `#E07B39`
- Background: `#F5F2EB`
- Surface (cards): `#FFFFFF`
- Border: `#E0D9CC`
- Fonts: DM Serif Display (headings), DM Sans (body)
- Border radius: 14px
