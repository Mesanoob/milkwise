# MilkWise SG

Side-by-side comparison of baby formula on sale in Singapore. One codebase
ships to **web (PWA), iOS (App Store), and Android (Google Play)** via
Expo Router.

> **Status:** Session 1 production refactor. Compare + Product Detail
> screens fully built. Calculator and Most-Sold screens are placeholders.
> Supabase backend lands in Session 3 — see [Roadmap](#roadmap).

---

## Quick start

```bash
# install once
npm install

# run on web
npm run web

# run on a connected iOS simulator
npm run ios

# run on a connected Android device / emulator
npm run android

# strict TypeScript check (run before committing)
npm run typecheck

# regenerate the product image map after adding/removing images
npm run generate:images
```

The web app boots at `http://localhost:8081` (or `8083` if 8081 is in use).

---

## Architecture

We use the classic three-layer pattern: **data → logic → UI**. Each layer
only knows about the one directly below it.

```
┌──────────────────────────────────────────────────────────┐
│  app/                screens (Expo Router routes)        │
│    index.tsx           Compare                           │
│    product/[id].tsx    Product detail                    │
│    calculator.tsx      [placeholder]                     │
│    most-sold.tsx       [placeholder]                     │
│    about.tsx                                             │
│    +not-found.tsx      404                               │
│    _layout.tsx         root layout (Stack navigator)     │
├──────────────────────────────────────────────────────────┤
│  src/components/     reusable UI                         │
│    Screen, Header, BottomNav, SearchBar, …               │
│    filters/  StageTabs, BrandPills, SpecialtyChips       │
│    product/  ProductCard, ProductListRow, …              │
├──────────────────────────────────────────────────────────┤
│  src/hooks/          stateful logic (no JSX)             │
│    useProducts.ts                                        │
├──────────────────────────────────────────────────────────┤
│  src/services/       data-source abstraction             │
│    productRepository.ts     interface + factory          │
│    staticProductRepository  reads bundled JSON           │
│    supabaseProductRepository  STUB — Session 3           │
├──────────────────────────────────────────────────────────┤
│  src/data/           bundled JSON + image map            │
│  src/types/          TypeScript domain types             │
│  src/config/         theme, constants, env               │
│  src/utils/          format, strings — pure helpers      │
└──────────────────────────────────────────────────────────┘
```

### Why the repository abstraction?

Right now the app reads from `src/data/products.json`. Session 3 will swap
in Supabase. **No screen has to change** when that happens — they all call
`getProductRepository().listProducts()`. That's the entire point of the
abstraction.

### Why a hook for filtering?

`useProducts` is the Compare screen's brain. It owns search/filter/sort
state and returns the visible product array. The screen file is < 100
lines because of this — it's a *composition* of components, not a
container of logic.

---

## Design tokens

Brand colours live in two synchronised places:

- `tailwind.config.js` — drives `className="bg-green"` (NativeWind).
- `src/config/theme.ts` — exports the same values as plain TypeScript for
  any code that touches `StyleSheet` directly.

If you change a token, change it in **both** files.

---

## Adding product images

1. Drop the `.jpg` / `.png` into `assets/products/`.
2. Run `npm run generate:images`.
3. Commit `src/data/imageMap.ts` and the new image together.

Why a generated file? React Native's `require()` is static-only — Metro
needs to see literal paths at bundle time. The script writes one
`require()` per file so Metro can do its job.

---

## Roadmap

| Session | Scope                                                                 |
| ------- | --------------------------------------------------------------------- |
| 1 ✓     | Production refactor. Compare + Product Detail. NativeWind. Types.     |
| 2       | Calculator screen. Most-Sold rankings. Polish + a11y pass.            |
| 3       | Supabase backend. Admin CRUD dashboard. Image upload.                 |
| 4       | Security audit, Lighthouse pass, real-device testing, App Store prep. |

---

## Code standards

- **TypeScript strict** — `tsconfig.json` extends Expo's strict base. No
  `any` outside boundary code that talks to third-party HTML elements.
- **Short functions, one responsibility per file.** If a component or
  hook exceeds ~150 lines, split it.
- **No hard-coded numbers in components.** Centralise in `constants.ts`
  or `theme.ts`.
- **Comments explain *why*, not *what***. The compiler tells you what
  the code does. Only future-you knows why.
- **DRY** — if a className string or a small JSX block appears in three
  places, extract it into a component or a helper.

Run `npm run typecheck` before every commit. CI will run it on every push
once the GitHub Actions workflow lands in Session 4.
