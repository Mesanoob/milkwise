/**
 * ProductPicture — image-only tile for the "Photos" view.
 *
 * Designed to be used in-store: nothing but the tin photo + price.
 * Useful when the parent is comparing a shelf to the app on their phone.
 */

import { View, Text, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import type { Product } from '../../types/product';
import { getProductImage } from '../../data/imageMap';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../contexts/ThemeContext';

export interface ProductPictureProps {
  product: Product;
}

export const ProductPicture = ({ product }: ProductPictureProps) => {
  const defaultVariant = product.variants[0];
  const { tokens } = useTheme();

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable
        accessibilityLabel={`Open details for ${product.name}`}
        className="bg-mw-bg-card border border-mw-border overflow-hidden flex-1 min-w-[120px] max-w-[200px]"
        // Card surface radius from the canonical v2 token (card = 12).
        style={{ borderRadius: tokens.radius.card }}
      >
        <View className="w-full aspect-square bg-mw-bg-panel items-center justify-center">
          {/* `mw-packshot` (global.css): dark-theme sticker halo + float.
              Padding keeps the halo inside the well's overflow-hidden clip. */}
          <Image
            className="mw-packshot"
            source={getProductImage(defaultVariant?.img ?? product.img)}
            resizeMode="contain"
            style={{ width: '100%', height: '100%', padding: 14 }}
            accessibilityLabel={product.name}
          />
        </View>
        <View className="px-2 py-1.5 items-center">
          <Text className="text-xs font-body-semibold text-mw-text">
            {formatCurrency(defaultVariant?.price ?? product.price)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
};
