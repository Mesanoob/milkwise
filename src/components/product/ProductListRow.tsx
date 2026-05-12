/**
 * ProductListRow — dense row layout for the "List" view.
 *
 * Shows the same product but optimised for vertical scanning: small image
 * on the left, multi-column meta on the right. Falls back to a 2-line
 * stack on narrow screens (the `lg:` Tailwind prefix handles that).
 */

import { View, Text, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import type { Product } from '../../types/product';
import { getProductImage } from '../../data/imageMap';
import { formatCurrency, formatUnitPrice, formatWeight } from '../../utils/format';

export interface ProductListRowProps {
  product: Product;
}

export const ProductListRow = ({ product }: ProductListRowProps) => {
  const defaultVariant = product.variants[0];

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable
        accessibilityLabel={`Open details for ${product.name}`}
        className="bg-surface rounded-lg border border-border p-3 flex-row gap-3 items-center"
      >
        {/* Thumbnail — fixed size keeps row heights consistent */}
        <View className="w-16 h-16 bg-surface2 rounded-md items-center justify-center overflow-hidden">
          <Image
            source={getProductImage(defaultVariant?.img ?? product.img)}
            resizeMode="contain"
            style={{ width: '100%', height: '100%' }}
            accessibilityLabel={product.name}
          />
        </View>

        {/* Identity */}
        <View className="flex-1 min-w-0">
          <Text className="text-[10px] uppercase tracking-wider text-muted font-semibold" numberOfLines={1}>
            {product.brand} · {product.stage}
          </Text>
          <Text className="text-sm font-semibold text-text" numberOfLines={2}>
            {product.name}
          </Text>
          <Text className="text-[11px] text-muted mt-0.5" numberOfLines={1}>
            {product.bestFor}
          </Text>
        </View>

        {/* Pricing column — right-aligned for easy scanning */}
        <View className="items-end">
          <Text className="text-base font-bold text-text">
            {formatCurrency(defaultVariant?.price ?? product.price)}
          </Text>
          <Text className="text-[11px] text-muted">
            {formatWeight(defaultVariant?.weightG ?? product.weightG ?? 0)}
          </Text>
          <Text className="text-[11px] text-muted">
            {formatUnitPrice(defaultVariant?.pricePerGram ?? product.pricePerGram)} /g
          </Text>
        </View>
      </Pressable>
    </Link>
  );
};
