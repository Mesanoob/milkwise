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
import { Appearance } from 'react-native';
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

interface ThemeContextValue {
  /** What the user chose. The toggle cycles this. */
  preference: ThemePreference;
  /** The scheme actually in effect ('system' resolved against the OS). */
  scheme: Scheme;
  /** `themeFor(scheme)` — v2 tokens for the active scheme, ready to use. */
  tokens: V2Theme;
  setPreference: (p: ThemePreference) => void;
  /** Toggle order: system → light → dark → system. */
  cyclePreference: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Seed from the OS immediately so first paint matches the system theme
  // — no flash while the persisted preference hydrates (a saved 'system'
  // resolves to the same thing; a saved 'light'/'dark' corrects on the
  // next tick, before meaningful content thanks to the splash gate).
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [scheme, setScheme] = useState<Scheme>(() => resolveScheme('system'));

  // Hydrate the saved preference once on mount.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!alive) return;
        const pref: ThemePreference = isPreference(saved) ? saved : 'system';
        setPreferenceState(pref);
        setScheme(resolveScheme(pref));
        nativewindColorScheme.set(pref);
      })
      .catch(() => {
        /* storage unreadable (private mode, quota) — fall back to the
           OS-seeded 'system' default. Theme is best-effort, never fatal. */
      });
    return () => {
      alive = false;
    };
  }, []);

  // While on 'system', track live OS appearance changes (Settings flip,
  // sunset auto-dark). No-op for explicit light/dark — the user overrode.
  useEffect(() => {
    if (preference !== 'system') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    setScheme(resolveScheme(next));
    nativewindColorScheme.set(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* persistence is best-effort; the in-memory choice still applies
         for this session even if the write fails. */
    });
  }, []);

  const cyclePreference = useCallback(() => {
    setPreference(
      preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system',
    );
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
