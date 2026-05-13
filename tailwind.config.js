/** @type {import('tailwindcss').Config} */
// Tailwind / NativeWind theme. This file MUST stay in sync with
// `src/config/theme.ts` — the TypeScript file is the source of truth for
// values consumed by `StyleSheet` code; this file feeds the className-based
// styling pipeline. Both read the same brand palette; if you change a colour
// here, change it there too (and vice versa).
module.exports = {
  // Tell Tailwind to scan these files for class names. Missing a path means
  // arbitrary values like `min-w-[160px]` silently fail to compile.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // ── Brand palette (mirror of theme.ts `colors`) ───────────────────
      colors: {
        bg:           "#F5F2EB",
        surface:      "#FFFFFF",
        surface2:     "#F9F7F2",
        green:        "#1B5E3B",
        "green-mid":  "#2D7A52",
        "green-light":"#EBF5EE",
        amber:        "#E07B39",
        "amber-light":"#FDF0E6",
        text:         "#1A1A1A",
        muted:        "#6B7280",
        border:       "#E0D9CC",
        danger:       "#DC2626",
        warning:      "#F59E0B",

        // ── Specialty palette (mirror of theme.ts `specialtyColors`) ────
        // Verbatim from the design handoff. See theme.ts for the rationale.
        specialty: {
          "ar-bg":             "#FEF3C7", "ar-fg":             "#92400E",
          "budget-bg":         "#DBEAFE", "budget-fg":         "#1E40AF",
          "csection-bg":       "#F3E8FF", "csection-fg":       "#6B21A8",
          "gentle-bg":         "#FCE7F3", "gentle-fg":         "#9D174D",
          "goat-bg":           "#FEF9C3", "goat-fg":           "#713F12",
          "ha-bg":             "#EDE9FE", "ha-fg":             "#6D28D9",
          "hypoallergenic-bg": "#FFE4E6", "hypoallergenic-fg": "#9F1239",
          "lactosefree-bg":    "#E0F2FE", "lactosefree-fg":    "#0369A1",
          "organic-bg":        "#DCFCE7", "organic-fg":        "#166534",
          "premature-bg":      "#FFF7ED", "premature-fg":      "#9A3412",
          "soy-bg":            "#D1FAE5", "soy-fg":            "#065F46",
        },

        // ── Stage palette (mirror of theme.ts `stageColors`) ────────────
        stage: {
          "1-bg": "#DBEAFE", "1-fg": "#1E40AF",
          "2-bg": "#FCE7F3", "2-fg": "#9D174D",
          "3-bg": "#D1FAE5", "3-fg": "#065F46",
          "n-bg": "#FFE4E6", "n-fg": "#9F1239",
        },
      },

      // ── Font families (mirror of theme.ts `fonts`) ────────────────────
      // React Native does not synthesize weights — to render a bold sans,
      // you must reference the exact loaded family name (e.g. `font-sans-bold`).
      // Tailwind's default `font-bold` only sets `fontWeight: 700`, which is
      // ignored by RN for custom fonts. Use these utilities instead.
      fontFamily: {
        serif:           ["DMSerifDisplay_400Regular"],
        "sans-light":    ["DMSans_300Light"],
        sans:            ["DMSans_400Regular"],
        "sans-medium":   ["DMSans_500Medium"],
        "sans-semibold": ["DMSans_600SemiBold"],
        "sans-bold":     ["DMSans_700Bold"],
      },
    },
  },
  plugins: [],
};
