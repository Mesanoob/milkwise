/**
 * app/_layout.tsx — the root layout for the entire app.
 *
 * Every screen under `app/` renders inside this layout. Responsibilities:
 *   • Pull in NativeWind's compiled CSS so `className="bg-green"` paints
 *     pixels on web.
 *   • Load the brand font families (Inter Tight + Inter + JetBrains Mono)
 *     BEFORE rendering any screens — otherwise users see a flash of
 *     unstyled text (FOUT) while the fonts download, which looks broken
 *     on native.
 *   • Wrap the tree in `SafeAreaProvider` so child components can read
 *     notch / status-bar insets.
 *   • Mount Expo Router's `<Stack>` navigator with `headerShown: false`
 *     because we render our own top bar (`<Header>`) inside each screen.
 *
 * Anything you add here runs on every page — keep it minimal.
 */

import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
// v2 design system fonts. RN does NOT synthesize weights for custom fonts,
// so every weight we use is loaded as its own family (see theme.ts `fonts`).
//   • Inter Tight  600/700 — display / headings
//   • Inter        400/500/600 — body / UI
//   • JetBrains Mono 400/500 — all numerals (tabular)
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  InterTight_600SemiBold,
  InterTight_700Bold,
} from '@expo-google-fonts/inter-tight';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { colors } from '../src/config/theme';
import { ProductsProvider } from '../src/contexts/ProductsContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';

// Tell Expo to keep the native splash screen on screen until we hide it
// manually below. Without this, the splash hides as soon as JS loads and
// the user sees a blank (or unstyled) frame while fonts are still fetching.
//
// Wrapped in a try/catch because calling this on web (where there's no
// native splash) historically warned. Newer SDKs no-op gracefully but the
// guard costs nothing and protects against version drift.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no native splash on this platform; ignore */
});

export default function RootLayout() {
  // `useFonts` returns [loaded, error]. We register every weight up-front
  // so any screen can pick one via the Tailwind `font-*` helpers
  // (mapped in tailwind.config.js) or `theme.fonts.*`.
  //
  // Why every weight at once instead of lazy-loading per screen:
  //   - Total payload is modest; one-shot keeps code simple and avoids
  //     per-screen font flashes.
  //   - On native the files are bundled in the binary — no network cost.
  //   - On web Expo Font emits @font-face rules so the browser fetches
  //     each weight as needed; we still preload to avoid layout shifts.
  //
  // The key === the literal family string referenced from styles
  // (e.g. `fontFamily: 'Inter_400Regular'`).
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    InterTight_600SemiBold,
    InterTight_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  // Hide the splash screen *after* fonts resolve (success OR failure).
  // We intentionally hide on error too — if font loading fails we'd rather
  // ship the app with system fonts than leave users staring at a splash.
  // The error is surfaced to the console for debugging; in production we'd
  // pipe it to Sentry or similar.
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* already hidden or no native splash — safe to ignore */
      });
      if (fontError) {
        // eslint-disable-next-line no-console
        console.warn('[fonts] failed to load brand fonts:', fontError);
      }
    }
  }, [fontsLoaded, fontError]);

  // Returning null while fonts load keeps the native splash visible.
  // On web the screen will be blank for a few hundred ms — acceptable
  // tradeoff vs. shipping a flash of system-font text that re-flows.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    // `ThemeProvider` is the OUTERMOST app context: the status bar, screen
    // transition background, and (post-Phase-4) every token read off the
    // active scheme. It must wrap everything that can render a colour.
    <ThemeProvider>
      <SafeAreaProvider>
        {/* `ProductsProvider` lives ABOVE the Stack so filter state
            persists across every navigation (Compare → Product Detail →
            back). See ProductsContext.tsx for the rationale. */}
        <ProductsProvider>
          <ThemedShell />
        </ProductsProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

/**
 * Inner shell that consumes the theme. Split out so it sits *below*
 * `ThemeProvider` and can call `useTheme()` — the status-bar icon colour
 * and the inter-screen background flip with the active scheme.
 *
 * Until Phase 4 migrates screens onto v2 tokens, the per-screen UI still
 * paints in the v1 palette; this only themes the chrome the navigator
 * itself draws, so the change is invisible on the default (light) scheme.
 */
function ThemedShell() {
  const { scheme, tokens } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          // We render our own header inside <Screen>, so hide the
          // navigator's default one. Cleaner cross-platform parity.
          headerShown: false,
          // Background shown mid-transition between screens. v1 screens
          // are still light, so keep v1 `colors.bg` on the light scheme
          // and switch to the v2 dark page colour only when dark is on —
          // no visible change in light mode, correct framing in dark.
          contentStyle: {
            backgroundColor: scheme === 'dark' ? tokens.colors.bg : colors.bg,
          },
          // Smooth fade between screens looks better than the platform
          // default slide on web; iOS/Android still get native gestures.
          animation: 'fade',
        }}
      />
    </>
  );
}
