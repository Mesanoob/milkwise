/**
 * Typed environment variables.
 *
 * Expo exposes any variable prefixed with `EXPO_PUBLIC_` to the JavaScript
 * bundle at build time. Anything *not* prefixed stays server-side only,
 * which is what we want for service-role keys.
 *
 * Reading `process.env` directly elsewhere is forbidden — always go through
 * this module so we get a single, type-safe gate.
 */

// Helper: fetch a public env var, fall back to a default, and warn loudly
// in development if a required value is missing. Never throws at module
// load — that would crash the whole app during local dev.
const readPublic = (key: string, fallback: string = ''): string => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (__DEV__ && fallback === '') {
      // eslint-disable-next-line no-console
      console.warn(`[env] missing public env var: ${key}`);
    }
    return fallback;
  }
  return value;
};

// Allowed build channels. Anything else is a typo in the build config —
// fail fast rather than let feature-flag logic silently treat "produciton"
// as a development build.
const CHANNELS = ['development', 'preview', 'production'] as const;
export type Channel = (typeof CHANNELS)[number];

const readChannel = (): Channel => {
  const raw = readPublic('EXPO_PUBLIC_CHANNEL', 'development');
  if ((CHANNELS as readonly string[]).includes(raw)) return raw as Channel;
  throw new Error(
    `[env] EXPO_PUBLIC_CHANNEL="${raw}" is not a valid channel. ` +
    `Expected one of: ${CHANNELS.join(' | ')}.`,
  );
};

export const env = {
  // Supabase project URL (e.g. https://abc.supabase.co). Populated in Session 3.
  supabaseUrl:     readPublic('EXPO_PUBLIC_SUPABASE_URL'),
  // Public "anon" key. Safe to ship in client bundle — RLS protects rows.
  supabaseAnonKey: readPublic('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  // Build channel — "development" | "preview" | "production".
  channel:         readChannel(),
} as const;

export type Env = typeof env;

/**
 * Fail-fast guard for features that depend on env vars. Call it from the
 * code path that *enables* the feature (e.g. the Supabase repository
 * constructor) — not at module load, so a static-data build never pays
 * for config it doesn't use.
 */
export const assertEnv = (keys: ReadonlyArray<keyof Env>, feature: string): void => {
  const missing = keys.filter((k) => env[k] === '');
  if (missing.length > 0) {
    throw new Error(
      `[env] ${feature} is enabled but required env var(s) are missing: ` +
      `${missing.join(', ')}. Set them in .env.local (see .env.example) ` +
      `or disable the feature flag.`,
    );
  }
};
