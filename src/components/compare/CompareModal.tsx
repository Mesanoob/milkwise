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
 *   - The platform branch lives in `ModalShell` below. Web renders a
 *     `position: 'fixed'` overlay; native uses RN's built-in `<Modal>`
 *     so the sheet floats above the navigation stack, handles the
 *     Android hardware back button via `onRequestClose`, and bleeds
 *     under the status bar for full-screen dimming.
 *   - The first-column / header-row sticky behaviour relies on CSS
 *     `position: sticky` which works on `react-native-web` View
 *     elements but NOT on native. Native users see the same table
 *     scroll non-sticky, which we accept for v1 — the dataset (≤5
 *     selected products) fits in a single viewport on phone widths.
 *     A future native path could swap in a fixed left rail.
 */

import { useEffect, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Platform,
  Modal as RNModal,
} from 'react-native';
import type { Product } from '../../types/product';
import { getProductImage } from '../../data/imageMap';
import { getMilkTypeIcon } from '../../utils/icons';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useTheme } from '../../contexts/ThemeContext';

/* -------------------------------------------------------------------------- */
/* Platform shell                                                              */
/* -------------------------------------------------------------------------- */

/**
 * `ModalShell` — the platform-specific outer chrome.
 *
 *   • Web → a `position: 'fixed'` overlay so the sheet floats above the
 *     page. The focus-trap hook + body-scroll-lock useEffect handle the
 *     accessibility plumbing that an HTML `<dialog>` would give us.
 *   • Native → React Native's built-in `<Modal>`. It hosts the sheet in
 *     a separate window so it sits above the navigation stack, handles
 *     the hardware back button on Android (`onRequestClose`), and bleeds
 *     under the status bar (`statusBarTranslucent`) so the dim layer
 *     covers the full screen.
 *
 * Both branches render the SAME `children` so the dialog markup lives in
 * one place. The decision is structural, not stylistic.
 */
const ModalShell = ({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) => {
  if (Platform.OS === 'web') {
    return (
      <View
        // Fixed overlay covering the viewport. The outer Pressable inside
        // `children` handles backdrop-to-dismiss.
        style={{
          position: 'fixed' as never,
          top: 0, bottom: 0, left: 0, right: 0,
          zIndex: 200,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {children}
      </View>
    );
  }

  // Native path. `transparent` lets us paint our own dim layer instead of
  // RN's default opaque background. `animationType="slide"` matches iOS /
  // Android conventions for bottom-sheet modals.
  return (
    <RNModal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // Android-only: makes the modal draw under the translucent status
      // bar so the dim layer covers the whole screen. iOS already does
      // this by default.
      statusBarTranslucent
      // RN ≥0.71 supports this — gives a sensible default supported
      // orientation set. Safe to pass; older versions ignore it.
      supportedOrientations={['portrait', 'landscape']}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {children}
      </View>
    </RNModal>
  );
};

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
  // Numeric rows render the cell value in tabular mono so figures align
  // down each product column (the whole point of a comparison table).
  // Text rows (brand, origin, ✓ flags) stay body.
  numeric?: boolean;
}

const fmtMoney = (digits: number) => (v: unknown) =>
  typeof v === 'number' ? `$${v.toFixed(digits)}` : '—';

const ROWS: RowDef[] = [
  { key: 'stage',         label: 'Stage' },
  { key: 'brand',         label: 'Brand' },
  { key: 'origin',        label: 'Origin' },
  { key: 'weightG',       label: 'Tin Size',         format: (v) => typeof v === 'number' ? `${v}g` : '—', numeric: true },
  { key: 'price',         label: 'Price (SGD)',      format: fmtMoney(2), best: 'min', bold: true, numeric: true },
  { key: 'pricePerGram',  label: '$ per gram',       format: fmtMoney(4), best: 'min', bold: true, numeric: true },
  { key: 'pricePerScoop', label: '$ per scoop',     format: fmtMoney(3), best: 'min', bold: true, numeric: true },
  { key: 'pricePerMl',    label: '$ per mL prepared', format: fmtMoney(4), best: 'min', numeric: true },
  { key: 'scoopG',        label: 'Scoop size',       format: (v) => typeof v === 'number' ? `${v}g` : '—', numeric: true },
  { key: 'waterMl',       label: 'Water per scoop',  format: (v) => typeof v === 'number' ? `${v}mL` : '—', numeric: true },
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
  // Focus trap + Esc handler. Returns a ref we spread onto the sheet container
  // so keyboard users can't tab back into the page behind the modal.
  const sheetRef = useFocusTrap<HTMLDivElement>({ active: true, onEscape: onClose });
  const { tokens } = useTheme();

  // Lock background scroll while the modal is open so the page underneath
  // doesn't jiggle when the user scrolls inside the modal. Web-only; native
  // gets this for free from the RN `<Modal>` component (future native path).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (products.length < 2) return null;

  return (
    <ModalShell onClose={onClose}>
      {/* Backdrop click area. `aria-hidden` keeps screen readers from
          announcing it; the inner sheet owns the dialog semantics.
          On native this Pressable also handles tap-outside-to-dismiss
          because RN `<Modal>`'s `onRequestClose` only fires for the
          hardware back button — we still need a manual tap target. */}
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close comparison"
        accessibilityElementsHidden
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />

      {/* Sheet — the actual dialog. `role="dialog"` + `aria-modal` + an
          `aria-labelledby` that points at the visible H1 give screen
          readers everything they need to announce the modal correctly. */}
      <View
        ref={sheetRef as never}
        accessibilityViewIsModal
        accessibilityLabel="Side-by-Side Comparison"
        // Web-only ARIA attributes. RN forwards unknown props through
        // `react-native-web` so these land on the rendered <div>.
        {...(Platform.OS === 'web'
          ? ({
              role: 'dialog',
              'aria-modal': 'true',
              'aria-labelledby': 'compare-modal-title',
            } as never)
          : {})}
        style={{
          backgroundColor: tokens.colors.bgCard,
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
          className="flex-row items-center justify-between border-b border-mw-border"
          style={{ paddingHorizontal: 24, paddingVertical: 18 }}
        >
          <View>
            <Text
              className="text-[22px] font-display-bold text-mw-text"
              // Stable id so `aria-labelledby` on the dialog container
              // can point at this heading for screen-reader announcement.
              nativeID="compare-modal-title"
            >
              Side-by-Side Comparison
            </Text>
            <Text className="text-[12px] text-mw-text-muted font-body mt-0.5">
              Singapore Prices · ✓ best value highlighted
            </Text>
          </View>
          {/* Close button — sized to WCAG 2.5.5 minimum (44×44 px touch
              target). The visible circle stays 36 px for design parity;
              `hitSlop` extends the tappable area to 44 px without
              changing the layout. */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close comparison"
            hitSlop={8}
            style={{
              width: 36, height: 36,
              // Round icon button — circle token, NOT cardLg (the 18 here
              // is r = ½·36, a coincidence with cardLg's value).
              borderRadius: tokens.radius.circle,
              backgroundColor: tokens.colors.bgPanel,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text className="text-mw-text-muted" style={{ fontSize: 18, lineHeight: 18 }}>✕</Text>
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
                  backgroundColor: tokens.colors.bgPanel,
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.colors.border,
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
                        // Product-image backdrop: stays white in both
                        // themes (the tin photos are light artwork).
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: tokens.colors.border,
                      }}
                      accessibilityLabel=""
                      accessibilityElementsHidden
                    />
                    <Text
                      className="text-[12.5px] font-body-semibold text-mw-text"
                      numberOfLines={2}
                    >
                      {p.name}
                    </Text>
                    <Text className="text-[10.5px] text-mw-text-muted font-body">
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
                      borderBottomColor: tokens.colors.border,
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
                            className={row.numeric ? 'font-mono-medium' : 'font-body'}
                            style={{
                              color: isBest ? tokens.colors.accentText : tokens.colors.text,
                              // Numeric → mono carries weight via the family
                              // + tabular figures align down the column;
                              // text rows keep the synthesized weight.
                              ...(row.numeric
                                ? { fontVariant: ['tabular-nums'] as const }
                                : { fontWeight: isBest ? '700' : row.bold ? '600' : '400' }),
                              fontSize: row.bold ? 15 : 13.5,
                            }}
                          >
                            {formatted}
                            {isBest && (
                              <Text className="text-mw-accent-text" style={{ fontSize: 10, opacity: 0.8 }}>
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
          className="border-t border-mw-border"
          style={{
            paddingHorizontal: 24,
            paddingVertical: 10,
            backgroundColor: tokens.colors.bgPanel,
          }}
        >
          <Text className="text-[11px] text-mw-text-muted font-body">
            💡 Prices are Singapore retail. Always verify before purchasing.
          </Text>
        </View>
      </View>
    </ModalShell>
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
}) => {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        width,
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: tokens.colors.bgPanel,
        borderRightWidth: 1,
        borderRightColor: tokens.colors.border,
        ...(sticky ? { position: 'sticky' as never, left: 0, zIndex: 1 } : {}),
      }}
    >
      <Text
        className="font-body-semibold uppercase tracking-wider"
        style={{
          fontSize: 10.5,
          color: tokens.colors.textMuted,
          letterSpacing: 0.7,
          fontWeight: secondary ? '500' : '700',
          textTransform: secondary ? 'none' : 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
};
