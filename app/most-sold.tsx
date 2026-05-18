/**
 * app/most-sold.tsx — Most Sold rankings.
 *
 * Layout (matches design `most-sold.html`):
 *   1. Green hero — "Most Sold Formula in Singapore"
 *   2. Top 3 podium — reordered cards `[2nd, 1st, 3rd]` so the winner is
 *      centred and tallest. Each card has a medal header (gradient bg +
 *      emoji), image, metrics row, "Why parents choose it" callout, and
 *      a View details CTA.
 *   3. Ranks #4–12 — dense rows with rank circle, image, identity block,
 *      market-share progress bar, editorial blurb, and price tiles.
 *   4. Market share chart — horizontal bar chart of all 12.
 *   5. Disclaimer.
 *
 * The ranking is curated (not algorithmic). Editorial copy + estimated
 * Singapore market-share percentages live in `RANKING` below; each entry
 * is keyed by Product.id and merged with the actual product record at
 * render time. Missing IDs are silently skipped so a future dataset
 * rename never crashes this screen.
 */

import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import type { Product } from '../src/types/product';
import { getAllProducts } from '../src/data/products';
import { getProductImage } from '../src/data/imageMap';
import { useTheme } from '../src/contexts/ThemeContext';

/* -------------------------------------------------------------------------- */
/* Curated ranking data                                                       */
/* -------------------------------------------------------------------------- */

interface RankingEntry {
  id:    string;  // matches Product.id
  rank:  number;  // 1-indexed position
  share: number;  // estimated SG market share (%)
  why:   string;  // editorial blurb shown on card / row
}

// Verbatim from the design handoff `most-sold.html` (April 2026 estimates).
const RANKING: ReadonlyArray<RankingEntry> = [
  { id: 'nan-optipro-s1',    rank: 1,  share: 18,  why: "Paediatrician's #1 recommendation. 5-HMO Complex + OPTIPRO protein blend. Available in every pharmacy and hospital canteen." },
  { id: 'enfamil-proa-s1',   rank: 2,  share: 15,  why: 'MFGM + DHA combination is clinically unique. Strong hospital seeding and trusted by first-time parents across all income groups.' },
  { id: 'similac-5mo-s1',    rank: 3,  share: 12,  why: '5-HMO oligosaccharide blend closest to breast milk. B. lactis BB-12 probiotic reassures immunity-focused mothers.' },
  { id: 'frisolac-gold-s1',  rank: 4,  share: 10,  why: 'Dutch OPO fat for softer stools is a top selling point. Multi-size range suits both trial buyers and bulk shoppers.' },
  { id: 'similac-infant-s1', rank: 5,  share: 9,   why: 'Palm-oil free Eye-Q Plus system (lutein + DHA + choline). Widely available with frequent promotion bundles.' },
  { id: 'wyeth-s26-s1',      rank: 6,  share: 7,   why: 'Decades of brand heritage. NZ provenance + IMMUNOFORTIS prebiotics appeal to premium segment.' },
  { id: 'aptamil-gold-s1',   rank: 7,  share: 6,   why: '50 years of breast milk research positioning. scGOS/lcFOS prebiotics are well-known among educated mothers.' },
  { id: 'nan-supremepro-s1', rank: 8,  share: 5,   why: 'Go-to HA formula for at-risk families. Paediatrician referral drives high repeat-purchase rate.' },
  { id: 'bellamys-s1',       rank: 9,  share: 4,   why: 'Certified organic + palm-oil free resonates with eco-conscious parents. Australian provenance is a strong trust signal.' },
  { id: 'karihome-s1',       rank: 10, share: 3.5, why: "Goat milk's gentle reputation is growing fast. Rising paediatrician referrals for cow milk sensitivity." },
  { id: 'fairprice-s1',      rank: 11, share: 3,   why: 'Lowest price-per-gram in Stage 1. Accessible at every NTUC FairPrice outlet — captures value-conscious households.' },
  { id: 'dumex-s1',          rank: 12, share: 2.5, why: 'Longest-standing affordable brand. High penetration in heartland supermarkets and neighbourhood provision shops.' },
];

// Medal gradient pairs by rank — used for the podium header strip. We use
// a single colour instead of a CSS gradient because React Native doesn't
// support linear-gradient on `View` without a third-party lib; the solid
// brand-tone is close enough at the size we render.
const MEDAL_BG: Readonly<Record<number, string>> = {
  1: '#F59E0B', // gold
  2: '#94A3B8', // silver
  3: '#C87941', // bronze
};

const MEDAL_BORDER: Readonly<Record<number, string>> = {
  1: '#F59E0B',
  2: '#94A3B8',
  3: '#C87941',
};

const MEDAL_ICON: Readonly<Record<number, string>> = {
  1: '🥇', 2: '🥈', 3: '🥉',
};

/* -------------------------------------------------------------------------- */
/* Screen                                                                      */
/* -------------------------------------------------------------------------- */

type RankedProduct = Product & RankingEntry;

export default function MostSoldScreen() {
  const { tokens } = useTheme();
  // Merge curated ranking with the live product dataset. Drop missing IDs
  // so a future rename in `products.json` doesn't break this screen.
  const ranked: RankedProduct[] = RANKING
    .map((entry) => {
      const product = getAllProducts().find((p) => p.id === entry.id);
      if (!product) return null;
      return { ...product, ...entry };
    })
    .filter((p): p is RankedProduct => p !== null);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  // Highest market share across the list — used to scale the chart bars
  // so the leader fills the full track and everyone else is proportional.
  const maxShare = ranked.length > 0
    ? Math.max(...ranked.map((p) => p.share))
    : 1;

  // Share threshold for the rest-of-list bar — `9` matches the design's
  // hard-coded `maxShare` (the 4th-ranked product). Anything between 4-12
  // gets a proportionally scaled bar.
  const restMaxShare = rest.length > 0 ? rest[0].share : 9;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: tokens.colors.accent,
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 36,
            alignItems: 'center',
          }}
        >
          <Text
            className="font-display-bold text-mw-text-inverse"
            style={{ fontSize: 32, lineHeight: 36, textAlign: 'center' }}
          >
            Most Sold Formula in Singapore
          </Text>
          <Text
            className="font-body"
            style={{
              fontSize: 14,
              // textInverse (not translucent white): white would vanish on
              // the dark-scheme light-sage accent band.
              color: tokens.colors.textInverse,
              marginTop: 12,
              maxWidth: 520,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Estimated Stage 1 market share rankings based on retail sales
            data, paediatrician surveys and parent community insights · April 2026
          </Text>
        </View>

        <View
          className="w-full"
          style={{ maxWidth: 1200, marginHorizontal: 'auto', paddingHorizontal: 24, paddingTop: 40, gap: 40 }}
        >
          {/* ── Top 3 podium ─────────────────────────────────────────── */}
          {top3.length === 3 && (
            <View>
              <Text
                className="font-display-bold text-mw-text"
                style={{ fontSize: 26, marginBottom: 24 }}
              >
                🏆 Top 3 Best Sellers
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  gap: 16,
                }}
              >
                {/* Reorder so the winner sits centred + tallest. */}
                {[top3[1], top3[0], top3[2]].map((p) => (
                  <PodiumCard key={p.id} product={p} big={p.rank === 1} />
                ))}
              </View>
            </View>
          )}

          {/* ── Ranks 4-12 ───────────────────────────────────────────── */}
          {rest.length > 0 && (
            <View>
              <Text
                className="font-display-bold text-mw-text"
                style={{ fontSize: 22, marginBottom: 16 }}
              >
                📊 Rankings #4–{ranked.length}
              </Text>
              <View style={{ gap: 10 }}>
                {rest.map((p) => (
                  <RankRow key={p.id} product={p} maxShare={restMaxShare} />
                ))}
              </View>
            </View>
          )}

          {/* ── Market share chart ───────────────────────────────────── */}
          <View
            style={{
              backgroundColor: tokens.colors.bgCard,
              borderRadius: 14,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 12,
              elevation: 1,
            }}
          >
            <Text
              className="font-display-bold text-mw-text"
              style={{ fontSize: 22, marginBottom: 6 }}
            >
              📈 Estimated Market Share
            </Text>
            <Text
              className="font-body"
              style={{ fontSize: 12.5, color: tokens.colors.textMuted, marginBottom: 20, lineHeight: 18 }}
            >
              Stage 1 formula · Singapore retail · April 2026 · Indicative
              estimates only
            </Text>
            <View style={{ gap: 8 }}>
              {ranked.map((p) => (
                <ShareBar
                  key={p.id}
                  rank={p.rank}
                  name={p.name}
                  share={p.share}
                  maxShare={maxShare}
                  highlight={p.rank <= 3}
                />
              ))}
            </View>
          </View>

          {/* ── Disclaimer ───────────────────────────────────────────── */}
          <View
            style={{
              backgroundColor: tokens.colors.bgCard,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text className="text-[11.5px] text-mw-text-muted font-body" style={{ lineHeight: 18 }}>
              <Text className="font-body-semibold text-mw-text">Disclaimer: </Text>
              Market share estimates are indicative and based on publicly
              available retail data, paediatrician survey reports, and parent
              community forums as of April 2026. Actual market share figures
              may vary. This is not investment advice.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Podium card — top 3                                                         */
/* -------------------------------------------------------------------------- */

const PodiumCard = ({
  product,
  big,
}: {
  product: RankedProduct;
  big: boolean;
}) => {
  const router = useRouter();
  const { tokens } = useTheme();
  const goToDetail = () => router.push(`/product/${product.id}`);

  return (
    <Pressable
      onPress={goToDetail}
      accessibilityRole="link"
      accessibilityLabel={`Rank ${product.rank}: ${product.name}. Open details.`}
      style={{
        flex: 1,
        flexBasis: big ? 320 : 260,
        maxWidth: big ? 320 : 260,
        minWidth: 240,
        backgroundColor: tokens.colors.bgCard,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 2,
        // Medal border is a fixed gold/silver/bronze ranking palette
        // (spec-exact, theme-independent); border token is the fallback.
        borderColor: MEDAL_BORDER[product.rank] ?? tokens.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.13,
        shadowRadius: 32,
        elevation: 4,
      }}
    >
      {/* Medal header */}
      <View
        // Medal strip: fixed gold/silver/bronze palette, theme-independent
        // (so the white text/subtitle below it stay literal white — they
        // sit on a non-flipping surface).
        style={{
          backgroundColor: MEDAL_BG[product.rank] ?? '#94A3B8',
          paddingHorizontal: big ? 16 : 12,
          paddingVertical: big ? 20 : 14,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: big ? 40 : 32, lineHeight: big ? 44 : 36 }}>
          {MEDAL_ICON[product.rank] ?? '🏅'}
        </Text>
        <Text
          className="font-body-semibold text-white"
          style={{ fontSize: big ? 15 : 13, marginTop: 6 }}
        >
          #{product.rank} Best Seller
        </Text>
        <Text
          className="font-body"
          style={{ fontSize: big ? 11 : 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}
        >
          {product.share}% est. market share
        </Text>
      </View>

      {/* Image */}
      <View
        style={{
          backgroundColor: tokens.colors.bgCard,
          padding: big ? 20 : 12,
          height: big ? 160 : 120,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={getProductImage(product.variants[0]?.img ?? product.img)}
          resizeMode="contain"
          style={{ width: '100%', height: '100%' }}
          accessibilityLabel=""
          accessibilityElementsHidden
        />
      </View>

      {/* Info */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
        <View>
          <Text
            className="font-body-semibold text-mw-text-muted"
            style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            {product.brand}
          </Text>
          <Text
            className="font-body-semibold text-mw-text"
            style={{ fontSize: big ? 15 : 13.5, marginTop: 2, lineHeight: big ? 18 : 16 }}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          {product.desc ? (
            <Text
              className="font-body"
              style={{ fontSize: 11.5, color: tokens.colors.textMuted, marginTop: 4, lineHeight: 17 }}
              numberOfLines={2}
            >
              {product.desc}
            </Text>
          ) : null}
        </View>

        {/* Metric tiles */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <MiniMetric label="$/gram" value={`$${(product.pricePerGram ?? 0).toFixed(4)}`} />
          <MiniMetric label="$/scoop" value={`$${(product.pricePerScoop ?? 0).toFixed(3)}`} />
          <MiniMetric label="Tin" value={`$${(product.price ?? 0).toFixed(2)}`} />
        </View>

        {/* Why parents choose it */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: tokens.colors.accentTint,
            borderRadius: 8,
          }}
        >
          <Text
            className="font-body-semibold"
            style={{
              fontSize: 10,
              color: tokens.colors.accent,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              marginBottom: 4,
            }}
          >
            Why parents choose it
          </Text>
          <Text
            className="font-body"
            style={{ fontSize: 11.5, color: tokens.colors.accentHover, lineHeight: 17 }}
          >
            {product.why}
          </Text>
        </View>

        {/* View details CTA */}
        <View
          style={{
            paddingVertical: 8,
            backgroundColor: tokens.colors.accent,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text
            className="font-body-semibold text-mw-text-inverse"
            style={{ fontSize: 13 }}
          >
            View details →
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

/* -------------------------------------------------------------------------- */
/* Rank row — #4 onwards                                                       */
/* -------------------------------------------------------------------------- */

const RankRow = ({
  product,
  maxShare,
}: {
  product: RankedProduct;
  maxShare: number;
}) => {
  const router = useRouter();
  const { tokens } = useTheme();
  const goToDetail = () => router.push(`/product/${product.id}`);
  const sharePct = Math.min(100, Math.round((product.share / maxShare) * 100));

  return (
    <Pressable
      onPress={goToDetail}
      accessibilityRole="link"
      accessibilityLabel={`Rank ${product.rank}: ${product.name}. Open details.`}
      style={{
        backgroundColor: tokens.colors.bgCard,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 1,
      }}
    >
      {/* Rank circle */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: tokens.colors.bgPanel,
          borderWidth: 2,
          borderColor: tokens.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Text
          className="font-body-semibold text-mw-text-muted"
          style={{ fontSize: 15 }}
        >
          {product.rank}
        </Text>
      </View>

      {/* Image */}
      <View
        style={{
          width: 56,
          height: 56,
          backgroundColor: tokens.colors.bgCard,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: tokens.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          flexShrink: 0,
        }}
      >
        <Image
          source={getProductImage(product.variants[0]?.img ?? product.img)}
          resizeMode="contain"
          style={{ width: '100%', height: '100%' }}
          accessibilityLabel=""
          accessibilityElementsHidden
        />
      </View>

      {/* Identity column */}
      <View style={{ flexBasis: 220, flexGrow: 0, flexShrink: 1, minWidth: 160 }}>
        <Text
          className="font-body-semibold text-mw-text-muted"
          style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4 }}
        >
          {product.brand}
        </Text>
        <Text
          className="font-body-semibold text-mw-text"
          style={{ fontSize: 14, marginTop: 2, lineHeight: 17 }}
          numberOfLines={2}
        >
          {product.name}
        </Text>
        {product.bestFor ? (
          <Text
            className="font-body-semibold text-mw-accent"
            style={{ fontSize: 11.5, marginTop: 3 }}
            numberOfLines={1}
          >
            ✓ {product.bestFor}
          </Text>
        ) : null}
      </View>

      {/* Market share bar */}
      <View style={{ flex: 1, minWidth: 80 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
        >
          <Text className="font-body" style={{ fontSize: 11, color: tokens.colors.textMuted }}>
            Est. market share
          </Text>
          <Text className="font-body-semibold text-mw-text" style={{ fontSize: 11 }}>
            {product.share}%
          </Text>
        </View>
        <View
          style={{
            height: 8,
            backgroundColor: tokens.colors.border,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${sharePct}%`,
              backgroundColor: tokens.colors.accent,
              borderRadius: 4,
            }}
          />
        </View>
      </View>

      {/* Why note */}
      <View style={{ flexBasis: 240, flexShrink: 1, minWidth: 0 }}>
        <Text
          className="font-body"
          style={{ fontSize: 11.5, color: tokens.colors.textMuted, lineHeight: 17 }}
          numberOfLines={2}
        >
          {product.why}
        </Text>
      </View>

      {/* Price tiles */}
      <View style={{ flexDirection: 'row', gap: 8, flexShrink: 0 }}>
        <MiniMetric label="$/g" value={`$${(product.pricePerGram ?? 0).toFixed(4)}`} accent />
        <MiniMetric label="Tin" value={`$${(product.price ?? 0).toFixed(2)}`} />
      </View>
    </Pressable>
  );
};

/* -------------------------------------------------------------------------- */
/* Market share chart bar                                                     */
/* -------------------------------------------------------------------------- */

const ShareBar = ({
  rank,
  name,
  share,
  maxShare,
  highlight,
}: {
  rank: number;
  name: string;
  share: number;
  maxShare: number;
  highlight: boolean;
}) => {
  const { tokens } = useTheme();
  const pct = Math.min(100, Math.round((share / maxShare) * 100));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text
        className="font-body-semibold text-mw-text-muted"
        style={{ width: 26, fontSize: 12, textAlign: 'right' }}
      >
        #{rank}
      </Text>
      <Text
        className="font-body-semibold text-mw-text"
        style={{ width: 160, fontSize: 12 }}
        numberOfLines={1}
      >
        {name}
      </Text>
      <View
        style={{
          flex: 1,
          height: 22,
          backgroundColor: tokens.colors.bgPanel,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            // Leader bars use solid accent; the rest a soft accent tint.
            backgroundColor: highlight ? tokens.colors.accent : tokens.colors.accentSoft,
            borderRadius: 4,
          }}
        />
      </View>
      <Text
        className="font-body-semibold text-mw-accent"
        style={{ width: 40, fontSize: 12, textAlign: 'right' }}
      >
        {share}%
      </Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Small metric tile (shared between podium + rank row)                       */
/* -------------------------------------------------------------------------- */

const MiniMetric = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 58,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: accent ? tokens.colors.accentTint : tokens.colors.bgPanel,
        borderRadius: 8,
        alignItems: 'center',
      }}
    >
      <Text
        className="font-body-semibold uppercase"
        style={{
          fontSize: 9.5,
          color: accent ? tokens.colors.accent : tokens.colors.textMuted,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
      <Text
        className="font-body-semibold"
        style={{
          fontSize: 12.5,
          color: accent ? tokens.colors.accent : tokens.colors.text,
          marginTop: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
};
