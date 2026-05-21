/**
 * HeroMesh — the design's signature 5-radial gradient mesh that backs the
 * Home hero. Three stacked layers (matches `.mw-hero-mesh` + its `::before`
 * vignette + `::after` noise pseudo-elements in styles.css):
 *
 *   1. Mesh        — `var(--mw-mesh)` with `var(--mw-mesh-blend)`
 *                    (5 radial gradients + 1 linear, mostly `screen` blend
 *                    with a final `multiply` for warmth).
 *   2. Vignette    — `var(--mw-mesh-vignette)` (radial transparent → rgba
 *                    burnt-umber at the page corners).
 *   3. Noise       — a 180×180 fractal-noise SVG at opacity 0.10 with
 *                    `mix-blend-mode: overlay` (keeps the gradient from
 *                    looking artificially smooth on big monitors).
 *
 * Cross-platform strategy:
 *   • WEB — render all three layers using RN-Web's pass-through of
 *           unknown style properties (`backgroundImage`,
 *           `backgroundBlendMode`, `mixBlendMode`). The mesh + vignette
 *           values come from the CSS vars set in `global.css` (added in
 *           Phase 0); they auto-flip with light/dark.
 *   • NATIVE — RN has no radial gradients and no blend modes. We render a
 *              single solid `cream-soft` surface (which flips to warm
 *              dark in dark mode via the same token). Per the Phase-plan
 *              "close not exact" acceptance on native, this is the
 *              documented compromise — adding `expo-linear-gradient`
 *              would only approximate the mesh anyway.
 */

import { Platform, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// The exact noise SVG from styles.css (`.mw-hero-mesh::after`). Inlined
// verbatim — feeding it through a build step would only normalise
// whitespace and break the data-URL.
const NOISE_SVG_URL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 1.2 0'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>\")";

const ABSOLUTE_FILL = {
  position: 'absolute' as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

export const HeroMesh = () => {
  const { tokens } = useTheme();
  const isWeb = Platform.OS === 'web';

  if (!isWeb) {
    // Native: single warm-cream wash. The token flips with dark mode so
    // dark-mode native users see the warm dark equivalent.
    return (
      <View
        pointerEvents="none"
        style={[ABSOLUTE_FILL, { backgroundColor: tokens.colors.creamSoft }]}
      />
    );
  }

  // Web: three stacked layers. We use untyped `as never` here because
  // `backgroundImage` / `backgroundBlendMode` / `mixBlendMode` aren't in
  // RN's `ViewStyle`, but RN-Web passes them straight through to CSS.
  const meshStyle = {
    ...ABSOLUTE_FILL,
    backgroundImage: 'var(--mw-mesh)',
    backgroundBlendMode: 'var(--mw-mesh-blend)',
  } as never;
  const vignetteStyle = {
    ...ABSOLUTE_FILL,
    backgroundImage: 'var(--mw-mesh-vignette)',
  } as never;
  const noiseStyle = {
    ...ABSOLUTE_FILL,
    backgroundImage: NOISE_SVG_URL,
    opacity: 0.1,
    mixBlendMode: 'overlay',
  } as never;

  return (
    <View pointerEvents="none" style={ABSOLUTE_FILL}>
      <View style={meshStyle} />
      <View style={vignetteStyle} />
      <View style={noiseStyle} />
    </View>
  );
};
