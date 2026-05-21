/**
 * Design-exact numeric formatters, ported verbatim from the prototype
 * (`MilkWiseFinalDesign/ui_kits/website/atoms.jsx`).
 *
 * WHY a separate module from `src/utils/format.ts`:
 *   `format.ts` renders currency as `S$42.90` and is used by the *current*
 *   screens (Most Sold, Calculator) — changing it would visually regress
 *   them. The design renders `$42.90` / `$0.048` with en-SG grouping. The
 *   ported screens must match the design pixel-for-pixel, so they get these
 *   exact functions. Both modules coexist until the whole app is ported.
 *
 * Behaviour is intentionally identical to the prototype (incl. the `?? 0`
 * null-coalescing and 3-dp per-gram), so ported components need no tweaks.
 */

/** `$42.90` — SGD, 2dp, en-SG thousands grouping. */
export const fmtSGD = (n: number | null | undefined): string =>
  '$' +
  (n ?? 0).toLocaleString('en-SG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** `$43` — SGD rounded to whole dollars. */
export const fmtSGD0 = (n: number | null | undefined): string =>
  '$' + Math.round(n ?? 0).toLocaleString('en-SG');

/** `$0.048` — per-gram / per-scoop, 3dp so micro-differences stay legible. */
export const fmtPerGram = (n: number | null | undefined): string =>
  '$' + (n ?? 0).toFixed(3);

/** `1,234.5` — count with up to 1dp, en-SG grouping. */
export const fmtCount = (n: number | null | undefined): string =>
  (n ?? 0).toLocaleString('en-SG', { maximumFractionDigits: 1 });
