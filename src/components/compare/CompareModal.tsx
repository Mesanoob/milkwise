/**
 * CompareModal — full-screen side-by-side comparison table.
 *
 * Opened from the CompareDrawer when the user has 2+ products selected.
 * Mirrors the design handoff's `CompareModal`:
 *   • Fixed overlay, dark backdrop
 *   • Bottom-anchored sheet on mobile, centred panel on desktop
 *   • Sticky first column ("Metric"), sticky header row (product names)
 *   • Highlights the best (lowest) cell per pricing row in brand green
 *
 * Implementation notes:
 *   - On web we render `position: fixed`. On native we'd use RN's `Modal`
 *     component for proper safe-area handling; this is web-first for now
 *     and we'll add a `Platform.OS === 'web'` branch when native ships.
 *   - The first-column sticky behaviour relies on CSS `position: sticky`
 *     which works on `react-native-web` View elements but not on native.
 *     A future native path would replace this with a fixed left rail.
 */

import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import type { Product } from '../../types/product';
import { getProductImage } from '../../data/imageMap';
import { getMilkTypeIcon } from '../../utils/icons';

export interface CompareModalProps {
  products: Product[];
  onClose:  () => void;
}

/* -------------------------------------------------------------------------- */
/* Row definitions — pure data so the JSX stays declarative                    */
/* -------------------------------------------------------------------------- */

interface RowDef {
  key:   keyof Product | 'pricePerGram' | 'pricePerScoop' | 'pricePerMl' | 'weightG';
  label: string;
  // `best:'min'` means the lowest cell value gets highlighted green. Used
  // only for price comparisons — for booleans/strings, omit.
  best?: 'min';
  // Optional formatter; defaults to coercing the raw value to a string.
  format?: (v: unknown) => string;
  // Bumps text size on the highlighted-numeric rows (price/per-unit) so
  // they read as the headline metric for each column.
  bold?: boolean;
}

const fmtMoney = (digits: number) => (v: unknown) =>
  typeof v === 'number' ? `$${v.toFixed(digits)}` : '—';

const ROWS: RowDef[] = [
  { key: 'stage',         label: 'Stage' },
  { key: 'brand',         label: 'Brand' },
  { key: 'origin',        label: 'Origin' },
  { key: 'weightG',       label: 'Tin Size',         format: (v) => typeof v === 'number' ? `${v}g` : '—' },
  { key: 'price',         label: 'Price (SGD)',      format: fmtMoney(2), best: 'min', bold: true },
  { key: 'pricePerGram',  label: '$ per gram',       format: fmtMoney(4), best: 'min', bold: true },
  { key: 'pricePerScoop', label: '$ per scoop',     format: fmtMoney(3), best: 'min', bold: true },
  { key: 'pricePerMl',    label: '$ per mL prepared', format: fmtMoney(4), best: 'min' },
  { key: 'scoopG',        label: 'Scoop size',       format: (v) => typeof v === 'number' ? `${v}g` : '—' },
  { key: 'waterMl',       label: 'Water per scoop',  format: (v) => typeof v === 'number' ? `${v}mL` : '—' },
  { key: 'milkType',      label: 'Milk type',        format: (v) => typeof v === 'string' ? `${getMilkTypeIcon(v)} ${v}` : '—' },
  { key: 'halal',         label: 'Halal',            format: (v) => v ? '✓' : '—' },
  { key: 'organic',       label: 'Organic',          format: (v) => v ? '✓' : '—' },
  { key: 'palmFree',      label: 'Palm oil-free',    format: (v) => v ? '✓' : '—' },
  { key: 'ar',            label: 'Anti-Reflux',      format: (v) => v ? '✓' : '—' },
  { key: 'ha',            label: 'Hypoallergenic',   format: (v) => v ? '✓' : '—' },
  { key: 'lactoseFree',   label: 'Lactose-Free',     format: (v) => v ? '✓' : '—' },
  { key: 'probiotic',     label: 'Probiotic' },
  { key: 'hmo',           label: 'HMO' },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Pull a row value off a product, falling back through known variant
 *  fields when the property isn't a direct key on Product (e.g. `pricePerMl`
 *  is on the variant but we mirror it for convenience). */
const readValue = (product: Product, key: RowDef['key']): unknown => {
  // Cast through unknown because RowDef.key isn't strictly `keyof Product`
  // — the union includes mirror fields populated by the data loader.
  return (product as unknown as Record<string, unknown>)[key];
};

/** For a price row marked best:'min', find the minimum cell value across
 *  the selected products. Returns null if no numeric values exist. */
const minNumericValue = (products: Product[], key: RowDef['key']): number | null => {
  const numbers = products
    .map((p) => readValue(p, key))
    .filter((v): v is number => typeof v === 'number');
  if (numbers.length === 0) return null;
  return Math.min(...numbers);
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export const CompareModal = ({ products, onClose }: CompareModalProps) => {
  if (products.length < 2) return null;

  return (
    <View
      // Fixed overlay covering the viewport. The outer Pressable handles
      // backdrop-to-dismiss; the inner sheet stops propagation so taps
      // inside it don't close the modal.
      style={{
        position: 'fixed' as never,
        top: 0, bottom: 0, left: 0, right: 0,
        zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      {/* Backdrop click area */}
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close comparison"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />

      {/* Sheet */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          width: '100%',
          maxWidth: 1100,
          maxHeight: '92%',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View
          className="flex-row items-center justify-between border-b border-border"
          style={{ paddingHorizontal: 24, paddingVertical: 18 }}
        >
          <View>
            <Text className="text-[22px] font-serif text-text">
              Side-by-Side Comparison
            </Text>
            <Text className="text-[12px] text-muted font-sans mt-0.5">
              Singapore Prices · ✓ best value highlighted
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close comparison"
            style={{
              width: 36, height: 36,
              borderRadius: 18,
              backgroundColor: '#F9F7F2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text className="text-muted" style={{ fontSize: 18, lineHeight: 18 }}>✕</Text>
          </Pressable>
        </View>

        {/* ── Scrollable table ────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={{ flexGrow: 0 }}
        >
          <ScrollView style={{ maxHeight: 600 }} showsVerticalScrollIndicator>
            <View>
              {/* Header row — sticky on web via CSS. */}
              <View
                className="flex-row"
                style={{
                  backgroundColor: '#F9F7F2',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0D9CC',
                  position: 'sticky' as never,
                  top: 0,
                  zIndex: 2,
                }}
              >
                <HeaderCell label="Metric" sticky width={140} />
                {products.map((p) => (
                  <View
                    key={p.id}
                    style={{
                      width: 180,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      gap: 6,
                    }}
                  >
                    <Image
                      source={getProductImage(p.variants[0]?.img ?? p.img)}
                      resizeMode="contain"
                      style={{
                        width: 56, height: 56,
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#E0D9CC',
                      }}
                      accessibilityLabel=""
                      accessibilityElementsHidden
                    />
                    <Text
                      className="text-[12.5px] font-sans-bold text-text"
                      numberOfLines={2}
                    >
                      {p.name}
                    </Text>
                    <Text className="text-[10.5px] text-muted font-sans">
                      {p.brand}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Data rows */}
              {ROWS.map((row, rowIdx) => {
                const minVal = row.best === 'min' ? minNumericValue(products, row.key) : null;
                return (
                  <View
                    key={row.key}
                    className="flex-row"
                    style={{
                      borderBottomWidth: rowIdx < ROWS.length - 1 ? 1 : 0,
                      borderBottomColor: '#E0D9CC',
                    }}
                  >
                    <HeaderCell label={row.label} sticky width={140} secondary />
                    {products.map((p) => {
                      const raw = readValue(p, row.key);
                      const formatted = row.format ? row.format(raw) : (raw ? String(raw) : '—');
                      const isBest =
                        minVal !== null &&
                        typeof raw === 'number' &&
                        raw === minVal;
                      return (
                        <View
                          key={p.id}
                          style={{
                            width: 180,
                            paddingHorizontal: 14,
                            paddingVertical: 11,
                          }}
                        >
                          <Text
                            className="font-sans"
                            style={{
                              color: isBest ? '#1B5E3B' : '#1A1A1A',
                              fontWeight: isBest ? '700' : row.bold ? '600' : '400',
                              fontSize: row.bold ? 15 : 13.5,
                            }}
                          >
                            {formatted}
                            {isBest && (
                              <Text className="text-green" style={{ fontSize: 10, opacity: 0.8 }}>
                                {'  ✓'}
                              </Text>
                            )}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <View
          className="border-t border-border"
          style={{
            paddingHorizontal: 24,
            paddingVertical: 10,
            backgroundColor: '#F9F7F2',
          }}
        >
          <Text className="text-[11px] text-muted font-sans">
            💡 Prices are Singapore retail. Always verify before purchasing.
          </Text>
        </View>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* HeaderCell — first-column sticky on web                                     */
/* -------------------------------------------------------------------------- */

const HeaderCell = ({
  label,
  width,
  sticky,
  secondary,
}: {
  label: string;
  width: number;
  sticky?: boolean;
  secondary?: boolean;
}) => (
  <View
    style={{
      width,
      paddingHorizontal: 14,
      paddingVertical: 11,
      backgroundColor: '#F9F7F2',
      borderRightWidth: 1,
      borderRightColor: '#E0D9CC',
      ...(sticky ? { position: 'sticky' as never, left: 0, zIndex: 1 } : {}),
    }}
  >
    <Text
      className="font-sans-bold uppercase tracking-wider"
      style={{
        fontSize: 10.5,
        color: '#6B7280',
        letterSpacing: 0.7,
        fontWeight: secondary ? '500' : '700',
        textTransform: secondary ? 'none' : 'uppercase',
      }}
    >
      {label}
    </Text>
  </View>
);
