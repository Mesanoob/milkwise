/**
 * Section + Eyebrow — page-level primitives ported from the design's
 * `atoms.jsx` and the `.mw-section*` / `.mw-eyebrow` / `.mw-section-title`
 * rules in `styles.css`.
 *
 * Every Home / Nutrition / Parents / About section uses these so the
 * vertical rhythm and small-caps eyebrow style stays consistent across the
 * rebuilt screens. Hero / Stats / Strip on Home are deliberately bespoke
 * (they don't fit the standard section pattern).
 *
 * Design metrics (verbatim from styles.css):
 *   • .mw-section       padding 120 32     (--mw-s-30 32)
 *   • .mw-section-inner max-width 1200; .narrow = 800
 *   • .mw-section-title display 40px / 400 / -0.022em tracking / lh 1.2 /
 *                       bottom margin 32 (--mw-s-8)
 *   • .mw-eyebrow       body 11 / 600 / 0.08em caps / text-muted /
 *                       bottom margin 12 (--mw-s-3)
 *   • .mw-section-bg    background: bg-panel (alternating section bands)
 */

import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface SectionProps {
  /** Small-caps eyebrow above the title. Optional. */
  eyebrow?: string;
  /** Section title (display 40). Optional. */
  title?: string;
  /** Use `bg-panel` as the section background (the design's alternating
   *  bands trick). Default false = page bg. */
  bg?: boolean;
  /** Constrain inner width to 800px instead of 1200px — used for
   *  long-form prose pages (Nutrition Guide / For New Parents). */
  narrow?: boolean;
  children?: ReactNode;
}

export const Section = ({
  eyebrow,
  title,
  bg = false,
  narrow = false,
  children,
}: SectionProps) => {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        paddingVertical: tokens.space[30], // 120
        paddingHorizontal: 32,
        backgroundColor: bg ? tokens.colors.bgPanel : 'transparent',
      }}
    >
      <View
        style={{
          maxWidth: narrow ? 800 : tokens.layout.maxContent,
          width: '100%',
          marginHorizontal: 'auto',
        }}
      >
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && (
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontWeight: '400',
              // CSS uses display-m (40). RN doesn't synthesise weights; the
              // closest available is InterTight_600SemiBold (the design's
              // section-title is weight 400 in CSS but Inter Tight only
              // ships 600/700 in the @expo-google-fonts package — 600 is
              // the closest available cut and matches the visible weight
              // in the prototype rendering).
              fontSize: tokens.fontSize.displayM, // 40
              letterSpacing: tokens.tracking(
                tokens.trackingEm.tight,
                tokens.fontSize.displayM,
              ),
              lineHeight: tokens.fontSize.displayM * tokens.lineHeight.snug,
              color: tokens.colors.text,
              marginBottom: tokens.space[8], // 32
            }}
          >
            {title}
          </Text>
        )}
        {children}
      </View>
    </View>
  );
};

/**
 * `Eyebrow` — the small-caps label above section titles. Exported so
 * pages (e.g. Home's hero) can render the eyebrow without a Section
 * wrapper.
 */
export const Eyebrow = ({ children }: { children: ReactNode }) => {
  const { tokens } = useTheme();
  return (
    <Text
      style={{
        fontFamily: tokens.fonts.bodySemibold,
        fontSize: tokens.fontSize.micro, // 11
        fontWeight: '600',
        letterSpacing: tokens.tracking(
          tokens.trackingEm.caps,
          tokens.fontSize.micro,
        ),
        textTransform: 'uppercase',
        color: tokens.colors.textMuted,
        marginBottom: tokens.space[3], // 12
      }}
    >
      {children}
    </Text>
  );
};
