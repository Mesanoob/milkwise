/**
 * FilterPanel — collapsible panel with 5 emoji-pill groups
 * (source / specialty / certs / origin / size). Ported from `Compare.jsx`
 * FilterPanel + styles-v2.css `.mw-filterpanel*` / `.mw-emojipill`.
 *
 * Phase-4 compromise: groups stack vertically. The design uses a 2-col
 * grid on desktop with the Origin group spanning both columns; that's a
 * pure layout concession (functionality identical). A responsive grid can
 * be added in Phase 9 polish if needed.
 */

import { useMemo } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useFormulaCompare,
  type FilterKey,
} from '../../../contexts/FormulaCompareContext';
import { getAllFormulas } from '../../../data/formulas';
import {
  flagFor,
  originCountry,
} from '../../../utils/formulaClassifiers';

const SOURCE_OPTS: { k: string; em: string; l: string }[] = [
  { k: 'Cow',  em: '🐄', l: 'Cow' },
  { k: 'Goat', em: '🐐', l: 'Goat' },
  { k: 'Soy',  em: '🌱', l: 'Soy' },
  { k: 'pHF',  em: '💧', l: 'pHF · partially hydrolyzed' },
  { k: 'eHF',  em: '💧', l: 'eHF · extensively hydrolyzed' },
];
const SPECIALTY_OPTS: { k: string; em: string; l: string }[] = [
  { k: 'anti-reflux',    em: '🔄', l: 'Anti-Reflux' },
  { k: 'hypoallergenic', em: '🛡️', l: 'Hypoallergenic' },
  { k: 'lactose-free',   em: '🚫', l: 'Lactose-Free' },
  { k: 'organic',        em: '🌿', l: 'Organic' },
  { k: 'premature',      em: '👶', l: 'Premature' },
  { k: 'hmo',            em: '✨', l: 'HMO' },
  { k: 'probiotic',      em: '🧫', l: 'Probiotic' },
  { k: 'palm-free',      em: '🌴', l: 'Palm-free' },
];
const CERT_OPTS: { k: string; em: string; l: string }[] = [
  { k: 'halal', em: '☪️', l: 'Halal' },
];
const SIZE_OPTS: { k: number; l: string }[] = [
  { k: 400,  l: '400g'  },
  { k: 800,  l: '800g'  },
  { k: 850,  l: '850g'  },
  { k: 900,  l: '900g'  },
  { k: 1600, l: '1.6kg' },
  { k: 1800, l: '1.8kg' },
];

// ── Emoji pill (one filter option) ─────────────────────────────────────
const EmojiPill = ({
  on,
  emoji,
  label,
  onPress,
}: {
  on: boolean;
  emoji?: string;
  label: string;
  onPress: () => void;
}) => {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: on ? tokens.colors.accent : tokens.colors.border,
        backgroundColor: on ? tokens.colors.accentTint : tokens.colors.bgCard,
      }}
    >
      {emoji && <Text style={{ fontSize: 13 }}>{emoji}</Text>}
      <Text
        style={{
          fontFamily: on ? tokens.fonts.bodySemibold : tokens.fonts.body,
          fontSize: 13,
          fontWeight: on ? '600' : '500',
          color: on ? tokens.colors.accentText : tokens.colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

// ── Filter group ───────────────────────────────────────────────────────
const Group = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: tokens.fonts.bodySemibold,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.96, // 0.08em × 12
          textTransform: 'uppercase',
          color: tokens.colors.textMuted,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {children}
      </View>
    </View>
  );
};

export const FilterPanel = ({ onClose }: { onClose: () => void }) => {
  const { tokens } = useTheme();
  const {
    filters,
    toggleFilter,
    resetFilters,
    activeFilterCount,
  } = useFormulaCompare();

  // Origin options derived from the formulas dataset.
  const origins = useMemo(() => {
    const set = new Set<string>();
    for (const f of getAllFormulas()) {
      const c = originCountry(f.manufacturedIn || f.origin);
      if (c) set.add(c);
    }
    return [...set].sort();
  }, []);

  return (
    <View
      style={{
        maxWidth: tokens.layout.maxContent,
        width: '100%',
        marginHorizontal: 'auto',
        marginTop: 12,
        padding: 24,
        paddingHorizontal: 32,
        backgroundColor: tokens.colors.bgCard,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        borderRadius: tokens.radius.card,
        ...tokens.shadow.s1,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: tokens.fonts.displaySemibold,
              fontSize: 20,
              fontWeight: '600',
              color: tokens.colors.text,
              letterSpacing: -0.4,
            }}
          >
            Refine results
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: tokens.colors.textMuted,
              marginTop: 2,
            }}
          >
            {activeFilterCount > 0
              ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active`
              : 'Tap to add a filter'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {activeFilterCount > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
              onPress={resetFilters}
              style={{ paddingVertical: 6, paddingHorizontal: 10 }}
            >
              <Text
                style={{
                  color: tokens.colors.clay,
                  fontSize: 13,
                  fontFamily: tokens.fonts.bodyMedium,
                  fontWeight: '500',
                }}
              >
                Reset
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            onPress={onClose}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ color: tokens.colors.textMuted, fontSize: 13 }}>
              ✕ Close
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Groups (vertical stack — see file header). */}
      <View style={{ gap: 18 }}>
        <Group title="🥛 Milk source">
          {SOURCE_OPTS.map((o) => (
            <EmojiPill
              key={o.k}
              on={filters.source.includes(o.k)}
              emoji={o.em}
              label={o.l}
              onPress={() => toggleFilter('source' as FilterKey, o.k)}
            />
          ))}
        </Group>
        <Group title="⭐ Specialty & claims">
          {SPECIALTY_OPTS.map((o) => (
            <EmojiPill
              key={o.k}
              on={filters.specialty.includes(o.k)}
              emoji={o.em}
              label={o.l}
              onPress={() => toggleFilter('specialty' as FilterKey, o.k)}
            />
          ))}
        </Group>
        <Group title="📜 Certifications">
          {CERT_OPTS.map((o) => (
            <EmojiPill
              key={o.k}
              on={filters.certs.includes(o.k)}
              emoji={o.em}
              label={o.l}
              onPress={() => toggleFilter('certs' as FilterKey, o.k)}
            />
          ))}
        </Group>
        <Group title="🌏 Country of origin">
          {origins.map((c) => (
            <EmojiPill
              key={c}
              on={filters.origin.includes(c)}
              emoji={flagFor(c)}
              label={c}
              onPress={() => toggleFilter('origin' as FilterKey, c)}
            />
          ))}
        </Group>
        <Group title="🥫 Tin size">
          {SIZE_OPTS.map((o) => (
            <EmojiPill
              key={o.k}
              on={filters.size.includes(o.k)}
              label={o.l}
              onPress={() => toggleFilter('size' as FilterKey, o.k)}
            />
          ))}
        </Group>
      </View>
    </View>
  );
};
