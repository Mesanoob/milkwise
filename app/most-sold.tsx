/**
 * app/most-sold.tsx — "Top sellers" leaderboard (PLACEHOLDER).
 *
 * Will display products ranked by an analytics signal once the analytics
 * pipeline is wired up. Until then we show the static catalogue ordered by
 * price-per-gram as a sensible stand-in — "best value" is a reasonable
 * proxy for "what people probably buy".
 */

import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { Screen } from '../src/components/Screen';
import { getAllProducts } from '../src/data/products';
import { ProductListRow } from '../src/components/product/ProductListRow';

// How many entries the leaderboard shows. Pulled out as a constant so the
// "Top N" label and the slice both refer to the same number.
const TOP_N = 10;

export default function MostSoldScreen() {
  // Compute once on first render. The dataset is static so we don't need
  // to recompute even if the user navigates back and forth.
  const ranked = useMemo(() => {
    return [...getAllProducts()]
      .filter((product) => typeof product.pricePerGram === 'number')
      .sort((a, b) => (a.pricePerGram! - b.pricePerGram!))
      .slice(0, TOP_N);
  }, []);

  return (
    <Screen>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-serif text-green">Best value</Text>
        <Text className="text-sm text-muted mt-0.5">
          Top {TOP_N} formulas ranked by price per 100 g. Real sales data will
          replace this list once the backend is live.
        </Text>
      </View>

      <View className="px-4 py-3 gap-2">
        {ranked.map((product, idx) => (
          <View key={product.id} className="flex-row items-center gap-2">
            <Text className="w-6 text-xs text-muted font-bold">{idx + 1}.</Text>
            <View className="flex-1">
              <ProductListRow product={product} />
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}
