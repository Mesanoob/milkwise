/**
 * app/_layout.tsx — the root layout for the entire app.
 *
 * Every screen under `app/` renders inside this layout. We use it to:
 *   • Pull in NativeWind's compiled CSS (the `import "../global.css"` line
 *     is what makes `className="bg-green"` actually paint anything on web).
 *   • Wrap the tree in `SafeAreaProvider` so child components can read
 *     notch / status-bar insets.
 *   • Mount Expo Router's `<Stack>` navigator with `headerShown: false`
 *     because we render our own top bar (`<Header>`) inside each screen.
 *
 * Anything you add here runs on every page — keep it minimal.
 */

import '../global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Light status bar — dark text on the light brand background. */}
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          // We render our own header inside <Screen>, so hide the navigator's
          // default one. Cleaner cross-platform parity.
          headerShown: false,
          // Brand background colour while transitioning between screens.
          contentStyle: { backgroundColor: '#F5F2EB' },
          // Smooth fade between screens looks better than the platform default
          // slide on web; iOS/Android still get their native gestures.
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
