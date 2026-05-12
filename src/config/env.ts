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

export const env = {
  // Supabase project URL (e.g. https://abc.supabase.co). Populated in Session 3.
  supabaseUrl:     readPublic('EXPO_PUBLIC_SUPABASE_URL'),
  // Public "anon" key. Safe to ship in client bundle — RLS protects rows.
  supabaseAnonKey: readPublic('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  // Build channel — "development" | "preview" | "production".
  channel:         readPublic('EXPO_PUBLIC_CHANNEL', 'development'),
} as const;

export type Env = typeof env;
