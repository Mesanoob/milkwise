/**
 * AdvancedFilterChips — the "Filters" chip + its expand-down drawer.
 *
 * Exposed as TWO components so the toolbar can host the trigger inline
 * (next to the sort dropdown) while the drawer renders on its own row
 * below the toolbar. The parent owns the boolean `expanded` state and
 * threads it into both — single source of truth, no internal state.
 *
 * The drawer holds the "less common" filters the design groups under the
 * Filters affordance: specialty, origin, milk type, halal, pHF, eHF.
 */

import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Specialty } from '../../types/product';
import type { MilkType } from '../../types/product';
import type { FilterState } from '../../types/filters';
import { ALL_MILK_TYPES, ALL_ORIGINS, ALL_SPECIALTIES } from '../../data/products';
import { getMilkTypeIcon, getOriginFlag } from '../../utils/icons';
import { labelForSpecialty } from '../../utils/strings';
import { useTheme } from '../../contexts/ThemeContext';

type SpecialtyKey = Exclude<Specialty, null>;

/* -------------------------------------------------------------------------- */
/* Active-filter count helper                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Sum the number of advanced filters currently engaged. The trigger uses
 * this to render its amber badge ("3" = three active filters). The
 * specialty array counts because specialty filters now live exclusively
 * inside this drawer — the standalone SpecialtyChips row has been retired.
 */
export const advancedFilterCount = (filters: FilterState): number =>
  filters.origins.length +
  filters.milkTypes.length +
  filters.specialties.length +
  (filters.halalOnly ? 1 : 0) +
  (filters.partialHydroOnly ? 1 : 0) +
  (filters.extHydroOnly ? 1 : 0);

/* -------------------------------------------------------------------------- */
/* Trigger — the "Filters" chip                                                */
/* -------------------------------------------------------------------------- */

export interface AdvancedFilterChipsTriggerProps {
  filters:     FilterState;
  expanded:    boolean;
  onToggle:    () => void;
  onClear?:    () => void;
}

export const AdvancedFilterChipsTrigger = ({
  filters,
  expanded,
  onToggle,
  onClear,
}: AdvancedFilterChipsTriggerProps) => {
  const activeCount = advancedFilterCount(filters);
  const { tokens } = useTheme();
  return (
    <View className="flex-row items-center" style={{ gap: 8 }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? 'Hide advanced filters' : 'Show advanced filters'}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 13,
          paddingVertical: 7,
          borderRadius: 999,
          borderWidth: 1.5,
          backgroundColor: expanded ? tokens.colors.accentText : tokens.colors.bgCard,
          borderColor: expanded ? tokens.colors.accentText : tokens.colors.border,
        }}
      >
        {/* Three-line "filters" glyph — `#` rotated. Cheap, no SVG. */}
        <Text
          className="font-body-semibold"
          style={{ fontSize: 12, color: expanded ? tokens.colors.textInverse : tokens.colors.text }}
        >
          ☰
        </Text>
        <Text
          className="font-body-semibold"
          style={{ fontSize: 12.5, color: expanded ? tokens.colors.textInverse : tokens.colors.text }}
        >
          Filters
        </Text>
        {activeCount > 0 && (
          <View
            style={{
              width: 17,
              height: 17,
              borderRadius: 8.5,
              alignItems: 'center',
              justifyContent: 'center',
              // Count badge carries 9px text → accentText (AA-safe sage;
              // cream-on-accent is only 3:1, fails at this size).
              backgroundColor: tokens.colors.accentText,
              marginLeft: 2,
            }}
          >
            <Text className="text-[9px] font-body-semibold text-mw-text-inverse">{activeCount}</Text>
          </View>
        )}
      </Pressable>

      {/* "Clear advanced" only rendered when at least one filter is active.
          Wraps inline so it sits to the right of the Filters chip. */}
      {activeCount > 0 && onClear ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear advanced filters"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: tokens.colors.border,
            backgroundColor: tokens.colors.bgCard,
          }}
        >
          <Text className="text-[12px] font-body-semibold" style={{ color: tokens.colors.accentText }}>
            ✕ Clear
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Drawer — the expanded chip set                                              */
/* -------------------------------------------------------------------------- */

export interface AdvancedFilterChipsDrawerProps {
  filters:              FilterState;
  onToggleSpecialty:    (key: SpecialtyKey) => void;
  onToggleOrigin:       (origin: string) => void;
  onToggleMilkType:     (milkType: MilkType) => void;
  onToggleHalal:        () => void;
  onTogglePartialHydro: () => void;
  onToggleExtHydro:     () => void;
}

export const AdvancedFilterChipsDrawer = ({
  filters,
  onToggleSpecialty,
  onToggleOrigin,
  onToggleMilkType,
  onToggleHalal,
  onTogglePartialHydro,
  onToggleExtHydro,
}: AdvancedFilterChipsDrawerProps) => (
  <View
    className="bg-mw-bg-card border-b border-mw-border"
    style={{ paddingHorizontal: 16, paddingVertical: 8 }}
  >
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 16, alignItems: 'center' }}
    >
      {/* Booleans first — they're the most-used. */}
      <Chip label="☪️ Halal" active={filters.halalOnly} onPress={onToggleHalal} />
      <Chip label="pHF Partially hydrolyzed" active={filters.partialHydroOnly} onPress={onTogglePartialHydro} />
      <Chip label="eHF Extensively hydrolyzed" active={filters.extHydroOnly} onPress={onToggleExtHydro} />

      {/* Section divider so the chips below read as a separate group. */}
      <SectionLabel>Specialty</SectionLabel>
      {ALL_SPECIALTIES.map((key) => (
        <Chip
          key={`spec-${key}`}
          label={labelForSpecialty(key)}
          active={filters.specialties.includes(key as SpecialtyKey)}
          onPress={() => onToggleSpecialty(key as SpecialtyKey)}
        />
      ))}

      <SectionLabel>Origin</SectionLabel>
      {ALL_ORIGINS.map((origin) => (
        <Chip
          key={`origin-${origin}`}
          label={`${getOriginFlag(origin)} ${origin}`}
          active={filters.origins.includes(origin)}
          onPress={() => onToggleOrigin(origin)}
        />
      ))}

      <SectionLabel>Milk</SectionLabel>
      {ALL_MILK_TYPES.filter((m) => m !== 'soy').map((milkType) => (
        <Chip
          key={`milk-${milkType}`}
          label={`${getMilkTypeIcon(milkType)} ${milkType} milk`}
          active={filters.milkTypes.includes(milkType)}
          onPress={() => onToggleMilkType(milkType)}
          capitalize
        />
      ))}
    </ScrollView>
  </View>
);

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                            */
/* -------------------------------------------------------------------------- */

const SectionLabel = ({ children }: { children: string }) => {
  const { tokens } = useTheme();
  return (
    <View style={{ paddingHorizontal: 6 }}>
      <Text
        className="font-body-semibold uppercase"
        style={{ fontSize: 10.5, color: tokens.colors.textMuted, letterSpacing: 0.6 }}
      >
        {children}
      </Text>
    </View>
  );
};

const Chip = ({
  label,
  active,
  onPress,
  capitalize,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  capitalize?: boolean;
}) => {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Toggle filter ${label}`}
      hitSlop={{ top: 9, bottom: 9, left: 4, right: 4 }}
      style={{
        paddingHorizontal: 13,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1.5,
        backgroundColor: active ? tokens.colors.accentText : tokens.colors.bgCard,
        borderColor: active ? tokens.colors.accentText : tokens.colors.border,
      }}
    >
      <Text
        className="text-[12.5px] font-body-medium"
        style={{
          color: active ? tokens.colors.textInverse : tokens.colors.text,
          textTransform: capitalize ? 'capitalize' : 'none',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

/* -------------------------------------------------------------------------- */
/* Backwards-compat wrapper                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Original combined component, kept so any caller that hasn't migrated
 * to the trigger/drawer pair still compiles. New code should use the
 * Trigger + Drawer exports directly so the layout can place them
 * separately.
 *
 * @deprecated Use `AdvancedFilterChipsTrigger` + `AdvancedFilterChipsDrawer`.
 */
export interface AdvancedFilterChipsProps extends AdvancedFilterChipsDrawerProps {
  onClear: () => void;
}

export const AdvancedFilterChips = (props: AdvancedFilterChipsProps) => {
  // Local fallback state for legacy callers. Anyone migrating should
  // hoist this into the parent and use the two new components instead.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [expanded, setExpanded] = useLegacyExpandedState();
  return (
    <View>
      <View
        className="bg-mw-bg-card border-b border-mw-border"
        style={{ paddingHorizontal: 16, paddingVertical: 8 }}
      >
        <AdvancedFilterChipsTrigger
          filters={props.filters}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          onClear={props.onClear}
        />
      </View>
      {expanded ? <AdvancedFilterChipsDrawer {...props} /> : null}
    </View>
  );
};

// `useState` re-exported with a stable name so the deprecated wrapper
// doesn't pull React into the public surface. Internal only.
import { useState as useLegacyState } from 'react';
const useLegacyExpandedState = () => useLegacyState(false);
