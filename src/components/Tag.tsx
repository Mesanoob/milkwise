/**
 * Tag — small coloured label used to flag product attributes.
 *
 * Examples: "HALAL", "ORGANIC", "ANTI-REFLUX". Renders as a pill with a
 * tinted background and contrast-checked text.
 *
 * Two ways to pick the palette:
 *   1. `variant="green" | "amber" | "muted" | "danger"` — the four brand
 *      slots used for generic attribute flags (Halal, Lactose-Free, etc.).
 *   2. `specialty="organic" | "ha" | …`             — the 11 specialty
 *      keys defined in `theme.specialtyColors`. Each one has its own
 *      hand-tuned background + text colour pair (WCAG AA contrast).
 *
 * `specialty` wins if both are passed — specialty colours are more specific
 * than the generic palette, so callers can pass `<Tag specialty={s} variant="muted">`
 * confidently knowing the variant is a fallback.
 */

import { Text, View } from 'react-native';
import { specialtyColors, type SpecialtyKey } from '../config/theme';

export type TagVariant = 'green' | 'amber' | 'muted' | 'danger';
export type TagSize    = 'sm' | 'md';

export interface TagProps {
  label:      string;
  variant?:   TagVariant;
  specialty?: SpecialtyKey | null;
  size?:      TagSize;
}

// Centralised colour table for the generic variants. Adding a new variant
// is a one-place change. The class string is "<bg-class> <text-class>"
// because NativeWind expects them on separate elements (View vs Text).
// v2 token classes (CSS-var backed → flip with the theme). The legacy
// `amber` slot maps to the warm warn pair (its closest v2 analogue with
// AA contrast); `green` → accent. specialty colours are NOT v2 — they
// stay spec-exact via the inline-style path below (CLAUDE.md §7b).
const VARIANT_STYLES: Record<TagVariant, string> = {
  green:  'bg-mw-accent-tint text-mw-accent-text',
  amber:  'bg-mw-warn-bg text-mw-warn-text',
  muted:  'bg-mw-bg-panel text-mw-text-muted',
  danger: 'bg-mw-danger-soft text-mw-danger',
};

// Size tokens. Card view uses `sm` to keep tag rows compact under the
// product name; the detail screen uses `md` for legibility.
const SIZE_STYLES: Record<TagSize, { wrap: string; text: string }> = {
  sm: { wrap: 'px-1.5 py-0.5',          text: 'text-[10px]' },
  md: { wrap: 'px-2 py-1',              text: 'text-[11px]' },
};

export const Tag = ({
  label,
  variant   = 'muted',
  specialty,
  size      = 'sm',
}: TagProps) => {
  const sizeClasses = SIZE_STYLES[size];

  // When `specialty` is provided, use inline style with the matched hex pair
  // from the theme. We use `style` rather than className because Tailwind
  // generates classes statically — we cannot synthesise `bg-specialty-ar-bg`
  // from a runtime variable without listing every permutation in safelist.
  // Direct hex via style is simpler, equally performant, and keeps the
  // colour pair atomic.
  if (specialty && specialtyColors[specialty]) {
    const { bg, fg } = specialtyColors[specialty];
    return (
      <View
        className={`rounded ${sizeClasses.wrap}`}
        style={{ backgroundColor: bg }}
      >
        <Text
          className={`font-body-semibold tracking-wider uppercase ${sizeClasses.text}`}
          style={{ color: fg }}
        >
          {label}
        </Text>
      </View>
    );
  }

  // Generic-variant path — uses Tailwind classes only, no inline style.
  const [bgClass, textClass] = VARIANT_STYLES[variant].split(' ');

  return (
    <View className={`${bgClass} rounded ${sizeClasses.wrap}`}>
      <Text
        className={`${textClass} font-body-semibold tracking-wider uppercase ${sizeClasses.text}`}
      >
        {label}
      </Text>
    </View>
  );
};
