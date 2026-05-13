/**
 * app/_layout.tsx — the root layout for the entire app.
 *
 * Every screen under `app/` renders inside this layout. Responsibilities:
 *   • Pull in NativeWind's compiled CSS so `className="bg-green"` paints
 *     pixels on web.
 *   • Load the brand font families (DM Serif Display + DM Sans) BEFORE
 *     rendering any screens — otherwise users see a flash of unstyled text
 *     (FOUT) while the fonts download, which looks broken on native.
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
import {
  useFonts as useDMSansFonts,
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { colors } from '../src/config/theme';
import { ProductsProvider } from '../src/contexts/ProductsContext';

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
  // `useFonts` returns [loaded, error]. We register all weights up-front
  // so any screen can use them via the Tailwind `font-sans`/`font-serif`
  // helpers (mapped in tailwind.config.js).
  //
  // Why every weight at once instead of lazy-loading per screen:
  //   - Total payload is ~120 KB across all weights; one-shot keeps
  //     code simple and avoids per-screen font flashes.
  //   - On native the files are bundled in the binary — no network cost.
  //   - On web Expo Font emits @font-face rules so the browser fetches
  //     each weight as needed; we still preload to avoid layout shifts.
  const [fontsLoaded, fontError] = useDMSansFonts({
    // The key on the left is the literal string we reference from styles
    // (e.g. `fontFamily: 'DMSans_400Regular'`). The design handoff calls
    // for the full DM Sans range 300–700; load all five up-front so any
    // screen can pick a weight without triggering a runtime fetch.
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
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
    <SafeAreaProvider>
      {/* Dark text on the warm off-white brand background. */}
      <StatusBar style="dark" />
      {/* `ProductsProvider` lives ABOVE the Stack so filter state persists
          across every navigation (Compare → Product Detail → back). The
          provider instantiates `useProducts()` exactly once for the
          session — see ProductsContext.tsx for the rationale. */}
      <ProductsProvider>
        <Stack
          screenOptions={{
            // We render our own header inside <Screen>, so hide the
            // navigator's default one. Cleaner cross-platform parity.
            headerShown: false,
            // Brand background colour while transitioning between screens.
            // Reads from the theme tokens so a palette tweak only requires
            // editing one file.
            contentStyle: { backgroundColor: colors.bg },
            // Smooth fade between screens looks better than the platform
            // default slide on web; iOS/Android still get their native
            // gestures.
            animation: 'fade',
          }}
        />
      </ProductsProvider>
    </SafeAreaProvider>
  );
}
