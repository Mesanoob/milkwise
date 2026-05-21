/**
 * ThemeContext — the v2 dark-mode mechanism.
 *
 * Decision (CLAUDE.md §7b): OS-seeded + manual toggle, persisted.
 *   • `preference` is what the user picked: 'system' | 'light' | 'dark'.
 *   • `scheme` is the *resolved* 'light' | 'dark' actually in effect
 *     (preference 'system' → follow the OS, live).
 *   • The preference is persisted to AsyncStorage so it survives reloads
 *     and app restarts. ProductsContext deliberately does NOT persist
 *     (filter state dies on refresh by contract); theme is the opposite —
 *     a user who picked dark expects it to stick.
 *
 * This is the ONLY net-new code in the whole re-skin (CLAUDE.md §9b
 * Phase 3). It drives NativeWind's color scheme so that, once Phase 4
 * migrates components onto v2 tokens, every surface flips with no
 * per-component hex. Until Phase 4 lands, this provider is in place and
 * verifiable but existing screens are unaffected — exactly the staged
 * boundary the roadmap draws.
 *
 * Same pattern as ProductsContext: lifted state via context, no state
 * library — the surface area is tiny and a dep would be over-engineering.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { Appearance, Platform } from 'react-native';
// NativeWind's imperative scheme control. On web it toggles the `dark`
// class on <html> (needs `darkMode: 'class'` in tailwind.config.js); on
// native it drives NativeWind's own style runtime. Either way, Phase 4's
// `dark:` utilities / themed tokens resolve off this.
import { colorScheme as nativewindColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeFor, type Scheme, type V2Theme } from '../config/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

// Versioned key: if the persisted shape ever changes we bump the suffix
// rather than silently mis-reading an old value.
const STORAGE_KEY = 'milkwise.themePreference.v1';

const isPreference = (v: unknown): v is ThemePreference =>
  v === 'system' || v === 'light' || v === 'dark';

/** Collapse a preference + the live OS scheme into the scheme to render. */
const resolveScheme = (pref: ThemePreference): Scheme => {
  if (pref === 'light' || pref === 'dark') return pref;
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
};

/**
 * Web-only perf gate for the §7c dark product-image halo.
 *
 * The `.dark .mw-packshot` drop-shadow stack is ~12 filter passes × 61
 * images. Recomputing it synchronously in the same style+paint pass that
 * the `.dark` class change triggers froze the main thread ~68–130ms on
 * every flip into dark (measured 2026-05-19 — the colour-var swap itself
 * is 0ms; this halo was the entire freeze).
 *
 * Fix: the full halo is gated behind `.dark.fx-ready` in global.css. We
 * drop `fx-ready` for the flip frame (a cheap 1-pass ambient covers that
 * single frame) and re-arm it on the next animation frame, so the heavy
 * 61-image filter pass runs OFF the click's critical path — the flip is
 * instant; the halo "develops" ~1 frame later. Steady-state visual is
 * byte-identical to the original effect.
 *
 * No-ops on native (no DOM, no `.dark` class, no CSS `filter` cost).
 */
const FX_READY_CLASS = 'fx-ready';
const armThemeEffectsGate = () => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  // Detach the expensive rule BEFORE the imminent flip paint…
  root.classList.remove(FX_READY_CLASS);
  // …then re-arm it after the cheap flip has painted. Double rAF: the
  // first fires before the flip frame's paint, the second after it — so
  // the 12-pass recompute lands in a later, idle frame, never blocking
  // the interaction.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.add(FX_READY_CLASS));
  });
};

interface ThemeContextValue {
  /** What the user chose. The toggle cycles this. */
  preference: ThemePreference;
  /** The scheme actually in effect ('system' resolved against the OS). */
  scheme: Scheme;
  /** `themeFor(scheme)` — v2 tokens for the active scheme, ready to use. */
  tokens: V2Theme;
  setPreference: (p: ThemePreference) => void;
  /**
   * Binary light ↔ dark (system mode disabled 2026-05-19, latency
   * investigation). Original order was system → light → dark → system.
   */
  cyclePreference: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // ─────────────────────────────────────────────────────────────────────
  // SYSTEM MODE TEMPORARILY DISABLED (latency investigation, 2026-05-19).
  //
  // We're isolating the OS-following "system" preference to test whether
  // it's the source of the perceived dark/light switch latency. The
  // suspect: when the OS is light and preference is 'system',
  // resolveScheme('system') === 'light', so the first toggle press
  // (system → light) produces NO visible change — the user reads that
  // dead click as lag. Defaulting straight to 'light' makes every press
  // a real flip, so the diagnostic is clean.
  //
  // To restore OS-seeded behaviour, swap the two lines below back to the
  // original (kept verbatim here):
  //   const [preference, setPreferenceState] = useState<ThemePreference>('system');
  //   const [scheme, setScheme] = useState<Scheme>(() => resolveScheme('system'));
  // ─────────────────────────────────────────────────────────────────────
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [scheme, setScheme] = useState<Scheme>(() => resolveScheme('light'));

  // Hydrate the saved preference once on mount.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!alive) return;
        // SYSTEM MODE DISABLED (see seed block above): a previously
        // persisted 'system' is coerced to 'light' so the old default
        // can't sneak the dead-first-click back in mid-investigation.
        // Original line: const pref = isPreference(saved) ? saved : 'system';
        const restored: ThemePreference = isPreference(saved) ? saved : 'light';
        const pref: ThemePreference = restored === 'system' ? 'light' : restored;
        setPreferenceState(pref);
        setScheme(resolveScheme(pref));
        nativewindColorScheme.set(pref);
        // A returning user restored straight into dark never fires a
        // toggle, so arm the halo gate here too — otherwise the full
        // §7c effect would never appear (only the cheap 1-pass rule).
        // Routed through the same off-critical-path rAF as a toggle so
        // a dark cold-load doesn't pay the 12-pass freeze on first paint.
        armThemeEffectsGate();
      })
      .catch(() => {
        /* storage unreadable (private mode, quota) — fall back to the
           OS-seeded 'system' default. Theme is best-effort, never fatal. */
      });
    return () => {
      alive = false;
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // SYSTEM MODE DISABLED (latency investigation, 2026-05-19).
  // Live OS-appearance tracking only fires while preference === 'system';
  // with system mode off it's unreachable. Commented out (not deleted) so
  // it can be restored verbatim alongside the seed block above.
  //
  // // While on 'system', track live OS appearance changes (Settings flip,
  // // sunset auto-dark). No-op for explicit light/dark — the user overrode.
  // useEffect(() => {
  //   if (preference !== 'system') return;
  //   const sub = Appearance.addChangeListener(({ colorScheme }) => {
  //     setScheme(colorScheme === 'dark' ? 'dark' : 'light');
  //   });
  //   return () => sub.remove();
  // }, [preference]);
  // ─────────────────────────────────────────────────────────────────────

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    setScheme(resolveScheme(next));
    // Detach the heavy dark-halo filter for the flip frame, BEFORE
    // NativeWind toggles `.dark`, so the imminent paint uses the cheap
    // 1-pass rule. Re-armed on the next rAF (see armThemeEffectsGate).
    armThemeEffectsGate();
    nativewindColorScheme.set(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* persistence is best-effort; the in-memory choice still applies
         for this session even if the write fails. */
    });
  }, []);

  const cyclePreference = useCallback(() => {
    // SYSTEM MODE DISABLED (latency investigation, 2026-05-19): binary
    // light ↔ dark so every press is a guaranteed visible flip — no
    // dead system→light click. Original 3-way cycle, restore verbatim:
    //   setPreference(
    //     preference === 'system' ? 'light'
    //       : preference === 'light' ? 'dark'
    //       : 'system',
    //   );
    setPreference(preference === 'dark' ? 'light' : 'dark');
  }, [preference, setPreference]);

  // `themeFor` is cheap but recreating it every provider render would
  // re-render every consumer on unrelated parent updates. Memo on scheme.
  const tokens = useMemo(() => themeFor(scheme), [scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, scheme, tokens, setPreference, cyclePreference }),
    [preference, scheme, tokens, setPreference, cyclePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Read the active theme. Throws outside the Provider — a programming
 * error we want loud, not masked with a default scheme.
 */
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      'useTheme must be used inside <ThemeProvider>. ' +
        'Check that your screen tree is wrapped in app/_layout.tsx.',
    );
  }
  return ctx;
};
