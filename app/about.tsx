/**
 * app/about.tsx — static information about the project.
 *
 * Content is intentionally short. The longer "FAQ" / "methodology" pages
 * will be split out under `app/about/` if the copy grows.
 */

import { View, Text } from 'react-native';
import { Screen } from '../src/components/Screen';
import { APP_NAME, APP_VERSION } from '../src/config/constants';

export default function AboutScreen() {
  return (
    <Screen>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-serif text-green">About {APP_NAME}</Text>
        <Text className="text-sm text-muted mt-0.5">Version {APP_VERSION}</Text>
      </View>

      <View className="px-4 py-3 gap-4">
        <Section title="What is MilkWise SG?">
          A side-by-side comparison of every baby formula widely available in
          Singapore. We compare nutrition, ingredients, and (most importantly)
          the real cost-per-feed once you account for scoop size and pack
          weight — the numbers brands rarely show on the label.
        </Section>

        <Section title="How we source data">
          Prices and ingredients come from the manufacturer's printed packaging
          and major retailers (FairPrice, Shopee, Lazada, Watsons). We refresh
          the dataset monthly. Spotted a stale price? Let us know.
        </Section>

        <Section title="Disclaimers">
          MilkWise SG is an independent comparison tool. We are not affiliated
          with any of the brands listed. Always speak to your paediatrician
          before switching formula, especially for premature babies or babies
          with allergies.
        </Section>
      </View>
    </Screen>
  );
}

// Local helper — every "About" section has the same heading-then-body layout.
// Pulling it out avoids three near-identical JSX blocks.
const Section = ({ title, children }: { title: string; children: string }) => (
  <View className="bg-surface rounded-lg border border-border p-4">
    <Text className="text-sm font-semibold text-text mb-1.5">{title}</Text>
    <Text className="text-sm text-muted leading-relaxed">{children}</Text>
  </View>
);
