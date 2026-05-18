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
  // Manual class strategy: NativeWind toggles a `dark` class on the web
  // root (driven by ThemeContext → nativewind colorScheme). Required for
  // the OS-seeded + manual-override model — the default 'media' strategy
  // can't be overridden by a user toggle. Phase 4's `dark:` utilities
  // resolve off this.
  darkMode: "class",
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

        // ── v2 palette (mirror of theme.ts `palette`) ───────────────────
        // Namespaced `mw-*` so it never collides with the live v1 keys
        // (`bg`, `text`, `border`, `danger`…). Phase 2 ships the LIGHT
        // values statically; Phase 3 rewrites these to CSS-var refs that
        // flip with the OS/manual theme. Phase 4 migrates components onto
        // `bg-mw-*` / `text-mw-*` and deletes the v1 keys above.
        mw: {
          bg: "#F7F3EA", "bg-panel": "#EFE9DA", "bg-card": "#FCF8EE", "bg-inverse": "#25241F",
          text: "#2A2823", "text-muted": "#6E6A60", "text-faint": "#9B9789", "text-inverse": "#F7F3EA",
          accent: "#6B9682", "accent-hover": "#547A68", "accent-soft": "#D6E3DA", "accent-tint": "#E8EFE9",
          cream: "#E8D4BC", "cream-soft": "#F2E4CE", "cream-tint": "#FAF1DF",
          butter: "#F0DC9A", "butter-soft": "#F8ECC4",
          clay: "#D4A893", "clay-soft": "#EBD4C5",
          info: "#7DA1B2", "info-soft": "#D8E3E8",
          danger: "#B07A78", "danger-soft": "#EAD4D2",
          "warn-bg": "#F8ECC4", "warn-text": "#7A5A1F",
          success: "#6B9682",
          border: "#DCD3BD", "border-strong": "#C0B79F", divider: "#E5DDC8",
        },
      },

      // ── v2 radii (mirror of theme.ts `radius` v2 keys) ────────────────
      // v1 components still use arbitrary `rounded-[14px]`; these add the
      // semantic scale Phase 6 migrates onto. No collision: Tailwind's
      // default radius keys are untouched, these are additive aliases.
      borderRadius: {
        input: "8px",
        card: "12px",
        "card-lg": "18px",
        pill: "999px",
      },

      // ── v2 spacing (mirror of theme.ts `space`, 4px scale) ────────────
      // Additive — extends Tailwind's default numeric spacing with the
      // design's exact steps used by Phase 6 surface rules.
      spacing: {
        18: "72px",
        30: "120px",
      },

      // ── Font families (mirror of theme.ts `fonts`) ────────────────────
      // React Native does not synthesize weights — to render a heavier
      // cut you must reference the exact loaded family name. Tailwind's
      // default `font-bold` only sets `fontWeight: 700`, ignored by RN
      // for custom fonts. Use these utilities instead.
      //
      // v2 design system: Inter Tight (display) · Inter (body) ·
      // JetBrains Mono (numerals). The `sans*`/`serif` keys are Phase-1
      // back-compat aliases — removed after the Phase 4 sweep.
      fontFamily: {
        // Semantic v2
        "display-semibold": ["InterTight_600SemiBold"],
        "display-bold":     ["InterTight_700Bold"],
        body:               ["Inter_400Regular"],
        "body-medium":      ["Inter_500Medium"],
        "body-semibold":    ["Inter_600SemiBold"],
        mono:               ["JetBrainsMono_400Regular"],
        "mono-medium":      ["JetBrainsMono_500Medium"],
        // Back-compat aliases (remap DM-era classes onto v2 families)
        serif:           ["InterTight_700Bold"],
        "sans-light":    ["Inter_400Regular"],
        sans:            ["Inter_400Regular"],
        "sans-medium":   ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold":     ["Inter_600SemiBold"],
      },
    },
  },
  plugins: [],
};
