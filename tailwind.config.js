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
        // (`bg`, `text`, `border`, `danger`…). Backed by CSS variables
        // declared in global.css: `:root` = light, `.dark` = dark. The
        // ThemeContext toggles the `.dark` class (web) / NativeWind scheme
        // (native), so one swap re-points every token — no per-component
        // hex, full flip (CLAUDE.md §7b). Channels are space-separated RGB
        // triplets so Tailwind's `<alpha-value>` (e.g. `bg-mw-bg/60`) works.
        // `nav-bg` is intentionally a whole translucent value (not a
        // channel triplet) — it already carries its own alpha.
        mw: {
          bg: "rgb(var(--mw-bg) / <alpha-value>)",
          "bg-panel": "rgb(var(--mw-bg-panel) / <alpha-value>)",
          "bg-card": "rgb(var(--mw-bg-card) / <alpha-value>)",
          "bg-inverse": "rgb(var(--mw-bg-inverse) / <alpha-value>)",
          text: "rgb(var(--mw-text) / <alpha-value>)",
          "text-muted": "rgb(var(--mw-text-muted) / <alpha-value>)",
          "text-faint": "rgb(var(--mw-text-faint) / <alpha-value>)",
          "text-inverse": "rgb(var(--mw-text-inverse) / <alpha-value>)",
          accent: "rgb(var(--mw-accent) / <alpha-value>)",
          "accent-hover": "rgb(var(--mw-accent-hover) / <alpha-value>)",
          "accent-soft": "rgb(var(--mw-accent-soft) / <alpha-value>)",
          "accent-tint": "rgb(var(--mw-accent-tint) / <alpha-value>)",
          cream: "rgb(var(--mw-cream) / <alpha-value>)",
          "cream-soft": "rgb(var(--mw-cream-soft) / <alpha-value>)",
          "cream-tint": "rgb(var(--mw-cream-tint) / <alpha-value>)",
          butter: "rgb(var(--mw-butter) / <alpha-value>)",
          "butter-soft": "rgb(var(--mw-butter-soft) / <alpha-value>)",
          clay: "rgb(var(--mw-clay) / <alpha-value>)",
          "clay-soft": "rgb(var(--mw-clay-soft) / <alpha-value>)",
          info: "rgb(var(--mw-info) / <alpha-value>)",
          "info-soft": "rgb(var(--mw-info-soft) / <alpha-value>)",
          danger: "rgb(var(--mw-danger) / <alpha-value>)",
          "danger-soft": "rgb(var(--mw-danger-soft) / <alpha-value>)",
          "warn-bg": "rgb(var(--mw-warn-bg) / <alpha-value>)",
          "warn-text": "rgb(var(--mw-warn-text) / <alpha-value>)",
          success: "rgb(var(--mw-success) / <alpha-value>)",
          border: "rgb(var(--mw-border) / <alpha-value>)",
          "border-strong": "rgb(var(--mw-border-strong) / <alpha-value>)",
          divider: "rgb(var(--mw-divider) / <alpha-value>)",
          "nav-bg": "var(--mw-nav-bg)",
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
