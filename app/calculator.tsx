/**
 * app/calculator.tsx — cost calculator (PLACEHOLDER, full build in Session 2).
 *
 * The shipped version will let parents enter:
 *   • child age / stage
 *   • feeds per day, ml per feed
 *   • optional brand picker for "what would I save by switching"
 *
 * For now this screen exists so:
 *   1. the nav link in `Header` / `BottomNav` doesn't 404, and
 *   2. the routing structure matches what Sessions 2+ will build out.
 *
 * Anything in `coming-soon` style here is fine to delete when the real
 * implementation lands.
 */

import { View, Text } from 'react-native';
import { Screen } from '../src/components/Screen';

export default function CalculatorScreen() {
  return (
    <Screen>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-serif text-green">Cost calculator</Text>
        <Text className="text-sm text-muted mt-0.5">
          Work out the true monthly cost of your formula.
        </Text>
      </View>

      <View className="m-4 bg-surface rounded-lg border border-border p-6 items-center">
        <Text className="text-3xl mb-2">⌬</Text>
        <Text className="text-base font-semibold text-text">Coming soon</Text>
        <Text className="text-xs text-muted text-center mt-1 max-w-[320px]">
          The calculator is being built in the next session. It will take feed
          volume, scoops-per-feed, and pack price and tell you the exact monthly
          spend per brand.
        </Text>
      </View>
    </Screen>
  );
}
