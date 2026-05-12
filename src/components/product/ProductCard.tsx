/**
 * ProductCard — the tile shown in the "Cards" view of the Compare screen.
 *
 * Renders product image, name, brand, price, and a small badge row of
 * attribute tags. Tapping anywhere on the card navigates to the detail
 * screen.
 *
 * The component is intentionally *dumb*: it receives a `Product` and a
 * press handler, owns no state of its own. Pulling everything out as props
 * makes the card trivially reusable (e.g. on the future "favourites" screen).
 */

import { View, Text, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import type { Product } from '../../types/product';
import { getProductImage } from '../../data/imageMap';
import { formatCurrency, formatWeight } from '../../utils/format';
import { labelForSpecialty } from '../../utils/strings';
import { Tag } from '../Tag';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  // `variants[0]` is the canonical default variant. The data loader also
  // mirrors its fields onto the product itself for convenience, but reading
  // them off the variant is clearer in intent and survives an empty mirror.
  const defaultVariant = product.variants[0];

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable
        accessibilityLabel={`Open details for ${product.name}`}
        className="bg-surface rounded-lg border border-border overflow-hidden flex-1 min-w-[160px] max-w-[280px]"
        style={{
          // RN's shadow object — see `theme.shadow.sm`. Inlined here because
          // NativeWind doesn't compile RN-specific shadow keys.
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
          elevation: 1,
        }}
      >
        {/* Image — fixed aspect ratio prevents layout shift while loading */}
        <View className="w-full aspect-square bg-surface2 items-center justify-center">
          <Image
            source={getProductImage(defaultVariant?.img ?? product.img)}
            resizeMode="contain"
            // RN images need explicit dimensions or a `flex: 1` style — the
            // aspect-square parent gives us a square viewport.
            style={{ width: '100%', height: '100%' }}
            // `accessibilityLabel` doubles as the screen-reader alt text.
            accessibilityLabel={product.name}
          />
        </View>

        <View className="p-3 gap-1.5">
          {/* Brand line is muted because the product name carries the weight. */}
          <Text className="text-[11px] uppercase tracking-wider text-muted font-semibold" numberOfLines={1}>
            {product.brand}
          </Text>
          <Text className="text-sm font-semibold text-text" numberOfLines={2}>
            {product.name}
          </Text>

          <View className="flex-row items-baseline gap-1 mt-1">
            <Text className="text-base font-bold text-text">
              {formatCurrency(defaultVariant?.price ?? product.price)}
            </Text>
            <Text className="text-[11px] text-muted">
              · {formatWeight(defaultVariant?.weightG ?? product.weightG ?? 0)}
            </Text>
          </View>

          {/* Attribute tag row — only render tags that are actually true. */}
          <View className="flex-row flex-wrap gap-1 mt-1">
            {product.organic     && <Tag label="Organic"    variant="green" />}
            {product.halal       && <Tag label="Halal"      variant="muted" />}
            {product.lactoseFree && <Tag label="Lactose-Free" variant="muted" />}
            {product.soyBased    && <Tag label="Soy"        variant="muted" />}
            {product.specialty   && (
              <Tag label={labelForSpecialty(product.specialty)} variant="amber" />
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
};
