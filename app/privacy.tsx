/**
 * app/privacy.tsx — Privacy Policy (`/privacy`).
 *
 * Launch-blocker page added during the security-review pass. MilkWise SG
 * collects nothing server-side today, so the policy is short and honest:
 * the only stored data lives in the browser/device itself (AsyncStorage →
 * localStorage on web). The page enumerates exactly which keys exist and
 * why, because the calculator persists a baby's date of birth — personal
 * data under PDPA even though it never leaves the device.
 *
 * Layout mirrors `about.tsx`: 720px prose column, h2 sections, numbered
 * entries reuse the same type ramp so the two legal pages read as a set.
 */

import { Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { Eyebrow } from '../src/components/Section';
import { useTheme } from '../src/contexts/ThemeContext';
import { PageMeta } from '../src/components/PageMeta';

// What we store, where, and why — kept as data so the table can't drift
// from the prose. If a new AsyncStorage key is ever added, list it here.
const STORED_DATA: { key: string; what: string; why: string }[] = [
  {
    key: 'Theme preference',
    what: 'Light or dark mode choice.',
    why: 'So the site remembers your display preference between visits.',
  },
  {
    key: 'Disclaimer banner',
    what: 'Whether you dismissed the medical-disclaimer banner.',
    why: 'So the banner does not reappear on every page load.',
  },
  {
    key: "Baby's date of birth",
    what: 'The date you optionally enter in the Cost Calculator.',
    why:
      'So the calculator can pre-fill your baby’s age on your next ' +
      'visit. Stored only on this device. Clear the date field (or your ' +
      'browser data) to remove it at any time.',
  },
];

const SECTIONS: [string, string][] = [
  ['1. No accounts, no tracking',
    'MilkWise SG has no user accounts, no sign-in, no analytics trackers, ' +
    'no advertising pixels, and no cookies set by us. We do not collect, ' +
    'transmit, or sell any personal information to anyone.'],
  ['2. Everything stays on your device',
    'The small amount of data the site remembers (listed above) is stored ' +
    'in your own browser or device storage. It is never sent to a server. ' +
    'Deleting your browser data, or uninstalling the app, removes it ' +
    'completely.'],
  ['3. No third-party data sharing',
    'Because we collect nothing, there is nothing to share. Product prices ' +
    'and nutrition data shown on the site are bundled with the site itself ' +
    '— viewing them makes no request that identifies you.'],
  ['4. Children’s data',
    'The optional date of birth entered in the calculator is used solely to ' +
    'compute feeding-guideline ages locally on your device. We never see it.'],
  ['5. Changes to this policy',
    'If MilkWise SG ever adds features that collect data (for example, ' +
    'privacy-respecting analytics), this page will be updated first and the ' +
    'change will be clearly announced on the site.'],
  ['6. Contact',
    'Questions about this policy can be raised via the contact details on ' +
    'the About page.'],
];

export default function PrivacyScreen() {
  const { tokens } = useTheme();

  return (
    <Screen>
      <PageMeta title="Privacy Policy" description="MilkWise SG stores nothing on servers. The little it remembers stays on your device." />
      <View
        style={{
          maxWidth: 720,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: 32,
          paddingVertical: 40,
          paddingBottom: 80,
          gap: 20,
        }}
      >
        <Eyebrow>Privacy</Eyebrow>
        <Text
          style={{
            fontFamily: tokens.fonts.displayBold,
            fontSize: 52,
            fontWeight: '400',
            letterSpacing: -1.3,
            lineHeight: 55,
            color: tokens.colors.text,
          }}
        >
          Your data stays with you.
        </Text>

        <Text style={para(tokens)}>
          MilkWise SG is a static comparison tool. There is no server-side
          collection of personal data: no accounts, no analytics, no ads.
          The only things the site remembers are small preferences saved on
          your own device, listed below.
        </Text>

        {/* What we store — card per item, mirrors about.tsx methodology cards */}
        <Text style={h2(tokens)}>What is stored on your device</Text>
        <View style={{ gap: 16, marginBottom: 16 }}>
          {STORED_DATA.map((row) => (
            <View
              key={row.key}
              style={{
                padding: 18,
                borderRadius: tokens.radius.card,
                borderWidth: 1,
                borderColor: tokens.colors.border,
                backgroundColor: tokens.colors.bgCard,
                ...tokens.shadow.s1,
              }}
            >
              <Text
                style={{
                  fontFamily: tokens.fonts.bodySemibold,
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 1.1,
                  textTransform: 'uppercase',
                  color: tokens.colors.textMuted,
                  marginBottom: 8,
                }}
              >
                {row.key}
              </Text>
              <Text style={{ fontSize: 13, lineHeight: 20, color: tokens.colors.text }}>
                {row.what}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 20,
                  color: tokens.colors.textMuted,
                  marginTop: 4,
                }}
              >
                {row.why}
              </Text>
            </View>
          ))}
        </View>

        {/* Policy sections — same numbered layout as about.tsx T&C */}
        <Text style={h2(tokens)}>Policy</Text>
        <View style={{ gap: 16 }}>
          {SECTIONS.map(([t, d]) => (
            <View key={t}>
              <Text
                style={{
                  fontFamily: tokens.fonts.bodySemibold,
                  fontSize: 14,
                  fontWeight: '600',
                  color: tokens.colors.text,
                  marginBottom: 4,
                }}
              >
                {t}
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 24, color: tokens.colors.textMuted }}>
                {d}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[para(tokens), { fontSize: 13, marginTop: 16 }]}>
          Last updated: 11 June 2026.
        </Text>
      </View>
    </Screen>
  );
}

// ── helpers (same ramp as about.tsx) ──────────────────────────────────
const para = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontSize: 16,
  lineHeight: 27,
  color: tokens.colors.textMuted,
});
const h2 = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  fontFamily: tokens.fonts.displaySemibold,
  fontSize: 30,
  fontWeight: '400' as const,
  letterSpacing: -0.45,
  color: tokens.colors.text,
  marginTop: 24,
  marginBottom: 8,
});
