/**
 * Feeding calculator.
 *
 * This screen ports the Claude Design `calculator.html` prototype into the
 * Expo app. The math lives in `feedingCalculator.ts` so the route stays focused
 * on form state and rendering, and so we can test the formulas separately later.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { Product } from '../src/types/product';
import { Screen } from '../src/components/Screen';
import { getAllProducts } from '../src/data/products';
import { getProductImage } from '../src/data/imageMap';
import { SG_GUIDELINES } from '../src/data/feedingGuidelines';
import { BenchmarkChart } from '../src/components/calculator/BenchmarkChart';
import { CumulativeSpendChart } from '../src/components/calculator/CumulativeSpendChart';
import { SpendChart } from '../src/components/calculator/SpendChart';
import { Stepper } from '../src/components/calculator/Stepper';
import { useTheme } from '../src/contexts/ThemeContext';
import { formatCurrency, formatNumber, formatWeight } from '../src/utils/format';
import {
  calcAge,
  calculateFeedingEstimate,
  parseDobParts,
} from '../src/utils/feedingCalculator';

type Gender = 'boy' | 'girl' | '';
type SolidsLevel = 'starting' | 'established' | 'full';

/**
 * v1→v2 colour shim. This screen consistently uses a `colors.<v1key>`
 * namespace across ~15 sub-components; rather than rewrite every call
 * site, each component grabs `const colors = useV2Colors()` and the
 * existing references keep working — now theme-reactive v2 values.
 * `amber*` maps to the warn pair (its v2 semantic successor) since the
 * only amber use here is the optional-solids notice. Removed when the
 * v1 token block is deleted is N/A — this shim *is* the v2 binding.
 */
const useV2Colors = () => {
  const { tokens } = useTheme();
  const c = tokens.colors;
  return {
    green: c.accent,
    greenMid: c.accentHover,
    greenLight: c.accentTint,
    // a11y: AA-safe darker sage for SMALL green text on light surfaces
    // (`green`/`greenMid` are only ~3:1 — see §7b/§9b Phase 7).
    greenText: c.accentText,
    surface: c.bgCard,
    surface2: c.bgPanel,
    amber: c.warnText,
    amberLight: c.warnBg,
    text: c.text,
    muted: c.textMuted,
    border: c.border,
    danger: c.danger,
    info: c.info,
    infoSoft: c.infoSoft,
    textInverse: c.textInverse,
  };
};

const makeProductSelectStyle = (c: ReturnType<typeof useV2Colors>) => ({
  width: '100%',
  padding: 11,
  borderRadius: 10,
  borderWidth: 1.5,
  borderColor: c.border,
  background: c.surface2,
  color: c.text,
  fontSize: 14,
  fontFamily: 'inherit',
});

export default function CalculatorScreen() {
  const colors = useV2Colors();
  // 960px is the design's `.mw-calc` breakpoint (single-col below).
  const { width } = useWindowDimensions();
  const twoCol = width >= 960;
  const products = useMemo(
    () => getAllProducts().sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  // ─────────────────────────────────────────────────────────────────────
  // GENDER SELECTION COMMENTED OUT (2026-05-19, design pass).
  // It didn't feed the math (benchmarks here are gender-neutral) and only
  // added vertical noise to the input panel. Kept (not deleted) so it can
  // be restored verbatim if a gender-specific benchmark is added later:
  //   const [gender, setGender] = useState<Gender>('');
  // …and re-add the <Gender> SegmentedControl block in the input panel.
  // ─────────────────────────────────────────────────────────────────────


  // `primaryId` and `supplementId` use a composite key: `productId#variantIdx`.
  // Example: `abbott-grow-s1#1` selects the 800g variant of Abbott Grow.
  // Storing both pieces in one string keeps the `<select>` value primitive
  // (web's <option value=...> must be a string) and avoids a second
  // useState for the variant index.
  //
  // Edge cases:
  //   - `''`           — nothing selected yet
  //   - `'breastmilk'` — special sentinel for the breastmilk option
  const [primaryId, setPrimaryId] = useState('');
  const [useSupplement, setUseSupplement] = useState(false);
  const [supplementId, setSupplementId] = useState('');
  const [primarySharePct, setPrimarySharePct] = useState(70);
  // Start from a clean slate (0). The age effect fills feeds/ml from the
  // benchmark only once a DOB is entered; until then nothing is assumed.
  const [mlPerFeed, setMlPerFeed] = useState(0);
  const [feedsPerDay, setFeedsPerDay] = useState(0);
  const [hasSolids, setHasSolids] = useState(false);
  const [solidsLevel, setSolidsLevel] = useState<SolidsLevel>('starting');

  // Manual formula-spec entry. Stored as strings so the inputs can hold a
  // transient empty / partial value while typing; parsed to numbers only
  // at the calculation boundary. Auto-filled from the selected product
  // (see effect below) and freely overridable thereafter — picking a
  // different product/variant re-seeds them, matching the design's
  // "auto-fill, then tweak" model.
  // Clean slate: every spec field starts at 0. Picking a formula
  // auto-fills them (effect below); otherwise the parent types real
  // values — nothing is pre-assumed on a fresh page load.
  const [scoopStr, setScoopStr] = useState('0');
  const [tinStr, setTinStr] = useState('0');
  const [priceStr, setPriceStr] = useState('0');

  const dob = useMemo(() => parseDobParts(day, month, year), [day, month, year]);
  const age = useMemo(() => (dob ? calcAge(dob) : null), [dob]);
  const ageMonths = age ? Math.min(age.months, 11) : null;
  const guideline = ageMonths !== null ? SG_GUIDELINES[ageMonths] : null;
  const dobError = year.length === 4 && !dob
    ? 'Pick a date on or after 1 Jan 2023 that is not in the future.'
    : '';

  const primaryIsBreastmilk = primaryId === 'breastmilk';
  // Resolve the composite key into a Product with the chosen variant's
  // mirror fields (weightG, price, pricePerGram, scoopG, …) overriding
  // the default. The feeding cost math reads these mirror fields directly
  // so this is the only adapter step needed.
  const primaryProduct = useMemo(
    () => primaryIsBreastmilk ? null : resolveProductWithVariant(products, primaryId),
    [primaryId, primaryIsBreastmilk, products],
  );
  const supplementalProduct = useMemo(
    () => resolveProductWithVariant(products, supplementId),
    [supplementId, products],
  );

  useEffect(() => {
    if (ageMonths === null) return;
    const nextGuideline = SG_GUIDELINES[ageMonths];
    setFeedsPerDay(Math.round((nextGuideline.fMin + nextGuideline.fMax) / 2));
    setMlPerFeed(Math.round((nextGuideline.mlMin + nextGuideline.mlMax) / 2));
    if (ageMonths >= 6) setHasSolids(true);
  }, [ageMonths]);

  // Auto-populate scoop / tin / price from the chosen formula+variant.
  // Re-runs whenever the resolved product changes (incl. variant switch
  // via the composite key), so the spec always starts from real product
  // data; the parent can then override any field by hand.
  useEffect(() => {
    if (!primaryProduct) return;
    setScoopStr(primaryProduct.scoopG != null ? String(primaryProduct.scoopG) : '');
    setTinStr(primaryProduct.weightG != null ? String(primaryProduct.weightG) : '');
    setPriceStr(primaryProduct.price != null ? String(primaryProduct.price) : '');
  }, [primaryProduct]);

  // Parse a spec field to a positive number, or null (blank / invalid /
  // non-positive → fall back to product-derived in the engine).
  const specNum = (s: string): number | null => {
    const n = Number(s);
    return s.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null;
  };
  const scoopGOverride = specNum(scoopStr);
  const tinWeightGOverride = specNum(tinStr);
  const pricePerTinNum = specNum(priceStr);
  // Engine costs in $/g; convert the per-tin price once here (we know the
  // tin weight at this point) so the calculator keeps a single unit.
  const pricePerGramOverride =
    pricePerTinNum !== null && tinWeightGOverride !== null
      ? pricePerTinNum / tinWeightGOverride
      : null;

  const estimate = useMemo(
    () =>
      calculateFeedingEstimate({
        primary: primaryProduct,
        supplemental: supplementalProduct,
        primaryIsBreastmilk,
        useSupplement,
        primarySharePct,
        mlPerFeed,
        feedsPerDay,
        ageMonths,
        scoopGOverride,
        tinWeightGOverride,
        pricePerGramOverride,
      }),
    [
      primaryProduct,
      supplementalProduct,
      primaryIsBreastmilk,
      useSupplement,
      primarySharePct,
      mlPerFeed,
      feedsPerDay,
      ageMonths,
      scoopGOverride,
      tinWeightGOverride,
      pricePerGramOverride,
    ],
  );

  // costPerMonth is non-null only when there's a price source — a picked
  // product, a supplement, OR a manual price entry. Gating on it alone
  // (instead of requiring a product) is what lets manual entry show cost.
  const showCost = estimate.costPerMonth !== null;
  // Yearly tin volume for the SG-vs-MY estimate. `tinsPerMonth` is
  // null until a priced formula is chosen; keep the null so the section
  // gate below stays type-safe (no `null * 12`).
  const tinsPerYear =
    estimate.tinsPerMonth != null ? estimate.tinsPerMonth * 12 : null;
  // Representative SG tin price for the cross-border estimate: the chosen
  // primary formula's variant price. `price` is optional on Product, so
  // collapse to a non-null local the section gate can test cleanly.
  const primaryTinPrice = primaryProduct?.price ?? null;
  const intakeStatus = guideline
    ? estimate.dailyMl < guideline.dMin
      ? 'low'
      : estimate.dailyMl > guideline.dMax
        ? 'high'
        : 'ok'
    : null;

  return (
    <Screen>
      <View style={{ backgroundColor: colors.green, paddingHorizontal: 24, paddingVertical: 36, alignItems: 'center' }}>
        <Text className="font-display-bold text-mw-text-inverse text-center" style={{ fontSize: 38, lineHeight: 42 }} selectable>
          Baby Feeding Calculator
        </Text>
        <Text className="text-mw-text-inverse text-center font-body mt-3 max-w-[560px]" style={{ lineHeight: 22 }} selectable>
          Based on Singapore HPB and KKH-style feeding benchmarks. Estimate intake, formula use, and cost from birth to 12 months.
        </Text>
      </View>

      {/* Two-column calculator (design-reference `.mw-calc`): a fixed
          420px feeding-inputs column on the left, fluid results on the
          right. Collapses to a single stacked column below 960px. The
          outer container is wider than the old 960 so the right column
          (and its charts) get real room — the design's chart is large. */}
      <View style={{ maxWidth: 1180, width: '100%', marginHorizontal: 'auto', paddingHorizontal: 20, paddingVertical: 28 }}>
        <View
          style={{
            flexDirection: twoCol ? 'row' : 'column',
            // align-start mirrors `.mw-calc-inputs { align-self: start }`
            // so the left panel keeps its content height instead of
            // stretching to the (taller) results column.
            alignItems: twoCol ? 'flex-start' : 'stretch',
            gap: twoCol ? 32 : 24,
          }}
        >
          {/* ── LEFT: feeding inputs ───────────────────────────── */}
          <View style={{ width: twoCol ? 420 : '100%', gap: 24 }}>
        <Card>
          <SectionTitle title="Your baby & feeding" icon="1" />
          <Text className="text-sm text-mw-text-muted font-body mb-5" selectable>
            Birth date and feeding details — everything updates live as you type.
          </Text>

          <View>
            <Label>Baby&apos;s date of birth</Label>
            <DobDateField
              day={day}
              month={month}
              year={year}
              setDay={setDay}
              setMonth={setMonth}
              setYear={setYear}
            />
            {dobError ? (
              <Text className="text-xs mt-2 font-body" style={{ color: colors.danger }} selectable>
                {dobError}
              </Text>
            ) : null}

            {/* GENDER SELECTION COMMENTED OUT (see state note above):
            <View style={{ flex: 1, minWidth: 260 }}>
              <Label>Gender</Label>
              <SegmentedControl
                value={gender}
                options={[
                  { value: 'boy', label: 'Boy' },
                  { value: 'girl', label: 'Girl' },
                  { value: '', label: 'Prefer not to say' },
                ]}
                onChange={(next) => setGender(next as Gender)}
              />
            </View>
            */}
          </View>

          {age && guideline ? (
            <View className="mt-5 rounded-xl flex-row flex-wrap items-center gap-4" style={{ backgroundColor: colors.greenLight, padding: 18 }}>
              <View style={{ flex: 1, minWidth: 240 }}>
                <Text className="text-[11px] font-body-semibold uppercase tracking-wider" style={{ color: colors.greenText }}>
                  Your baby is
                </Text>
                <Text className="font-display-bold mt-1" style={{ fontSize: 30, color: colors.greenText }} selectable>
                  {age.months} month{age.months === 1 ? '' : 's'}, {age.days} day{age.days === 1 ? '' : 's'}
                </Text>
                <Text className="text-xs font-body mt-1" style={{ color: colors.greenText }} selectable>
                  Born {dob!.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })} · Stage 1 formula {age.months < 12 ? 'still applicable' : 'transitioning to Stage 2+'}
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                <MiniStat value={`${guideline.mlMin}-${guideline.mlMax}`} label="ml / feed" />
                <MiniStat value={`${guideline.fMin}-${guideline.fMax}`} label="feeds / day" />
                <MiniStat value={`${guideline.dMin}-${guideline.dMax}`} label="ml / day" />
              </View>
            </View>
          ) : null}

          {age && guideline ? (
            <View className="mt-3 rounded-lg" style={{ backgroundColor: colors.surface2, padding: 12 }}>
              <Text className="text-xs text-mw-text-muted font-body" style={{ lineHeight: 18 }} selectable>
                At {age.months} months: {guideline.note}
              </Text>
            </View>
          ) : null}
            <View
              style={{
                gap: 20,
                marginTop: 22,
                paddingTop: 22,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <ProductSelect
                label="Pick a formula"
                value={primaryId}
                products={products}
                includeBreastmilk
                placeholder="— Manual entry —"
                onChange={(next) => {
                  setPrimaryId(next);
                  setUseSupplement(false);
                  setSupplementId('');
                }}
              />

              {primaryProduct ? <ProductInfoCard product={primaryProduct} /> : null}
              {primaryIsBreastmilk ? (
                <InfoBox tone="blue">
                  Breastmilk selected. No formula cost is calculated unless you enable formula supplementation.
                </InfoBox>
              ) : null}

              {primaryId ? (
                <View className="flex-row items-center gap-3">
                  <Switch
                    value={useSupplement}
                    onValueChange={setUseSupplement}
                    trackColor={{ false: colors.border, true: colors.greenLight }}
                    thumbColor={useSupplement ? colors.green : colors.surface}
                  />
                  <Text className="text-sm font-body-semibold text-mw-text" selectable>
                    {primaryIsBreastmilk ? 'Supplementing with formula' : 'Supplementing with a second formula'}
                  </Text>
                </View>
              ) : null}

              {useSupplement ? (
                <View className="rounded-xl border border-mw-border" style={{ backgroundColor: colors.surface2, padding: 16, gap: 14 }}>
                  <ProductSelect
                    label="Supplemental formula"
                    value={supplementId}
                    products={products}
                    placeholder="Select supplemental formula"
                    onChange={setSupplementId}
                  />
                  {supplementalProduct ? <ProductInfoCard product={supplementalProduct} compact /> : null}
                  {supplementId ? (
                    <View>
                      <Label>
                        {primaryIsBreastmilk ? 'Breastmilk' : 'Primary formula'} share: {primarySharePct}% / {100 - primarySharePct}% {primaryIsBreastmilk ? 'formula' : 'secondary'}
                      </Label>
                      <RatioControl value={primarySharePct} onChange={setPrimarySharePct} />
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View className="flex-row flex-wrap gap-5">
                <View style={{ flex: 1, minWidth: 240 }}>
                  <Stepper label="ml per feed" value={mlPerFeed} onChange={setMlPerFeed} min={5} max={360} step={5} unit="ml" />
                </View>
                <View style={{ flex: 1, minWidth: 240 }}>
                  <Stepper label="Feeds per day" value={feedsPerDay} onChange={setFeedsPerDay} min={1} max={16} step={1} unit=" feeds" />
                </View>
              </View>

              {/* Always-visible spec — manual entry first; picking a
                  formula above auto-fills these (effect in the screen). */}
              <View className="flex-row flex-wrap" style={{ gap: 20 }}>
                <View style={{ flex: 1, minWidth: 150 }}>
                  <Label hint="grams">Scoop size</Label>
                  <SpecStepper value={scoopStr} onChange={setScoopStr} step={0.1} min={1} max={15} decimals />
                </View>
                <View style={{ flex: 1, minWidth: 150 }}>
                  <Label hint="grams">Tin size</Label>
                  <SpecSelect value={tinStr} onChange={setTinStr} />
                </View>
              </View>
              <View>
                <Label hint="SGD">Price per tin</Label>
                <SpecField aria="Price per tin in SGD" value={priceStr} onChange={setPriceStr} prefix="$" decimals />
              </View>

              <View className="rounded-lg flex-row flex-wrap items-center gap-2" style={{ backgroundColor: colors.surface2, padding: 12 }}>
                <Text className="text-sm text-mw-text-muted font-body">Total milk today:</Text>
                <Text className="text-lg font-mono-medium" style={{ color: colors.greenText, fontVariant: ['tabular-nums'] }} selectable>
                  {estimate.dailyMl}ml
                </Text>
                <Text className="text-sm text-mw-text-muted font-body" selectable>
                  ({mlPerFeed}ml x {feedsPerDay} feeds)
                </Text>
                {estimate.formulaShare > 0 && estimate.formulaShare < 1 ? (
                  <Text className="text-xs text-mw-text-muted font-body" selectable>
                    Formula portion: {Math.round(estimate.formulaDailyMl)}ml
                  </Text>
                ) : null}
              </View>

              {ageMonths !== null && ageMonths >= 6 ? (
                <View className="rounded-xl border" style={{ backgroundColor: colors.amberLight, borderColor: colors.amber, padding: 16 }}>
                  <View className="flex-row items-center gap-3">
                    <Switch
                      value={hasSolids}
                      onValueChange={setHasSolids}
                      trackColor={{ false: colors.border, true: colors.amber }}
                      thumbColor={hasSolids ? colors.amber : colors.surface}
                    />
                    <Text className="text-sm font-body-semibold" style={{ color: colors.amber }} selectable>
                      My baby has started solids
                    </Text>
                  </View>
                  {hasSolids ? (
                    <View className="mt-3" style={{ paddingLeft: 8 }}>
                      <Label>Solids stage</Label>
                      <SegmentedControl
                        value={solidsLevel}
                        options={[
                          { value: 'starting', label: 'Just starting' },
                          { value: 'established', label: 'Established' },
                          { value: 'full', label: '3 full meals' },
                        ]}
                        onChange={(next) => setSolidsLevel(next as SolidsLevel)}
                      />
                      <Text className="text-xs font-body mt-3" style={{ color: colors.amber, lineHeight: 18 }} selectable>
                        Milk remains the primary nutrition source until 12 months. Use this as a planning estimate, not medical advice.
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

            </View>
        </Card>
          </View>

          {/* ── RIGHT: human-centric results ───────────────────────
              The answer first: how old is my baby, is intake normal,
              and what have I spent / will I spend. Detailed charts and
              the reference table are pushed to the full-width bottom. */}
          <View style={{ flex: twoCol ? 1 : undefined, width: twoCol ? undefined : '100%', gap: 16 }}>
            {(
              <>
                {guideline ? (
                  <BenchmarkStatusCard
                    dailyMl={estimate.dailyMl}
                    low={guideline.dMin}
                    high={guideline.dMax}
                    status={intakeStatus}
                  />
                ) : null}

                {showCost ? (
                  <>
                    <View className="flex-row flex-wrap" style={{ gap: 14 }}>
                      <ResultCard
                        eyebrow="Daily formula cost"
                        value={formatCurrency(estimate.costPerMonth != null ? estimate.costPerMonth / 30 : null)}
                        caption={estimate.tinsPerMonth ? `~${estimate.tinsPerMonth.toFixed(1)} tins / month` : undefined}
                      />
                      <ResultCard
                        eyebrow="Monthly cost (now)"
                        value={formatCurrency(estimate.costPerMonth)}
                        caption="at current feeding pattern"
                      />
                      <ResultCard
                        eyebrow="Spent so far"
                        value={formatCurrency(estimate.retroSpend)}
                        caption={
                          ageMonths !== null
                            ? `retroactive · ${ageMonths} month${ageMonths === 1 ? '' : 's'}`
                            : undefined
                        }
                        emphatic
                      />
                      <ResultCard
                        eyebrow={`Projected (months ${ageMonths ?? 0}–11)`}
                        value={formatCurrency(estimate.projectedSpend)}
                        caption="factors in transition to solids"
                        emphatic
                      />
                    </View>

                    {primaryTinPrice !== null && tinsPerYear !== null ? (
                      <Card>
                        <Eyebrow>Singapore vs Malaysia (estimate)</Eyebrow>
                        <Text className="text-sm text-mw-text-muted font-body mt-2 mb-4" selectable>
                          The same tin is usually cheaper across the causeway — a planning figure, not a price guarantee.
                        </Text>
                        <MalaysiaCompare tinPriceSgd={primaryTinPrice} tinsPerYear={tinsPerYear} />
                      </Card>
                    ) : null}
                  </>
                ) : (
                  <Card>
                    <Eyebrow>Cost</Eyebrow>
                    <Text className="font-display-bold text-mw-text" style={{ fontSize: 20, marginTop: 8 }} selectable>
                      Pick a formula to see spend
                    </Text>
                    <Text className="text-sm text-mw-text-muted font-body mt-2" style={{ lineHeight: 20 }} selectable>
                      Choose a formula (or breastmilk + a supplement) in the panel on the {twoCol ? 'left' : 'top'} — your spend so far and projected spend appear here.
                    </Text>
                  </Card>
                )}
              </>
            )}
          </View>
        </View>

        {/* ── BOTTOM: charts + reference table, full container width ── */}
        {(
          <View style={{ marginTop: 28, gap: 24 }}>
            {showCost ? (
              <Card>
                <SectionTitle title="Monthly formula spend" icon="2" />
                <Text className="text-xs text-mw-text-muted font-body mb-4" selectable>
                  Light = past estimate · solid = current month · muted = projected. Past months retroactive, then projected to month 11.
                </Text>
                <SpendChart monthlyData={estimate.monthlyData} babyMonths={ageMonths ?? 0} />
              </Card>
            ) : null}

            {showCost && ageMonths !== null && ageMonths > 0 ? (
              <Card>
                <SectionTitle title="Cumulative spend curve" icon="3" />
                <Text className="text-xs text-mw-text-muted font-body mb-4" selectable>
                  Solid line is estimated actual spend so far · dashed line is projected spend to 12 months.
                </Text>
                <CumulativeSpendChart monthlyData={estimate.monthlyData} babyMonths={ageMonths} />
                <InfoBox tone="muted">
                  Methodology: past spend uses benchmark ml × formula price/g. Projected spend uses your entered feeds and age-based solids reduction from 6 months. Breastmilk cost is treated as S$0.
                </InfoBox>
              </Card>
            ) : null}

            {ageMonths !== null ? (
              <Card>
                <SectionTitle title="Intake benchmark by month" icon="4" />
                <Text className="text-xs text-mw-text-muted font-body mb-4" selectable>
                  Recommended daily milk intake across the first year. Shaded band is the benchmark range; the dot is your baby.
                </Text>
                <BenchmarkChart babyMonths={ageMonths} currentDailyMl={estimate.dailyMl} />
                <View className="flex-row flex-wrap gap-3 mt-3">
                  <LegendSwatch color={colors.greenLight} label="Recommended range" boxed />
                  <LegendSwatch color={colors.green} label="Benchmark midpoint" />
                  <LegendSwatch color={colors.info} label="Your baby in range" />
                  <LegendSwatch color={colors.danger} label="Below range" />
                </View>
              </Card>
            ) : null}

            {/* Static reference — shows regardless of DOB. The current
                row is highlighted only once an age is known (null → none). */}
            <Card>
              <SectionTitle title="Singapore infant feeding guidelines" icon="5" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: 620 }}>
                  <GuidelineHeader />
                  {SG_GUIDELINES.map((item) => (
                    <GuidelineRow key={item.m} current={item.m === ageMonths} guideline={item} />
                  ))}
                </View>
              </ScrollView>
              <Text className="text-[11.5px] text-mw-text-muted font-body mt-3" style={{ lineHeight: 18 }} selectable>
                Planning benchmarks adapted from the MilkWise design handoff. Always follow your paediatrician&apos;s specific advice.
              </Text>
            </Card>

            <Text className="text-[11.5px] text-mw-text-muted font-body text-center" style={{ lineHeight: 18 }} selectable>
              All calculations are estimates based on typical usage. Actual consumption varies by baby, growth spurts, and feeding schedules. This is a planning tool, not a prescription.
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const Card = ({ children }: { children: React.ReactNode }) => {
  const { tokens } = useTheme();
  return (
  <View
    className="bg-mw-bg-card"
    style={{
      padding: 24,
      borderRadius: tokens.radius.card,
      // s1 = resting card. Theme-keyed: subtle on light, much heavier on
      // dark (#000 @ 0.40) so the card reads off the near-black page.
      ...tokens.shadow.s1,
    }}
  >
    {children}
  </View>
  );
};

/** Uppercase, letter-spaced micro-label — the design's `.mw-eyebrow`. */
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <Text
    className="font-body-semibold uppercase text-mw-text-muted"
    style={{ fontSize: 11, letterSpacing: 1.3 }}
    selectable
  >
    {children}
  </Text>
);

/**
 * One big-number result tile (design `.mw-result-card`): tracked eyebrow,
 * oversized tabular-mono value, mono caption. This is the human-centric
 * payload — "what am I spending" — so the number is the loudest thing on
 * the card.
 */
const ResultCard = ({
  eyebrow,
  value,
  caption,
  emphatic = false,
}: {
  eyebrow: string;
  value: string;
  caption?: string;
  /** Sage-tinted treatment for the headline figure (spent / projected). */
  emphatic?: boolean;
}) => {
  const colors = useV2Colors();
  return (
    <View
      className="rounded-xl"
      style={{
        // 2-up grid to match the reference (Daily | Monthly / Spent |
        // Projected). flexBasis ~46% + grow means exactly two per row on
        // the results column, collapsing to one when it gets narrow.
        flexGrow: 1,
        flexBasis: '46%',
        minWidth: 200,
        padding: 22,
        backgroundColor: emphatic ? colors.greenLight : colors.surface,
        borderWidth: 1,
        borderColor: emphatic ? colors.greenLight : colors.border,
      }}
    >
      <Text
        className="font-body-semibold uppercase"
        style={{ fontSize: 11, letterSpacing: 1.3, color: emphatic ? colors.greenText : colors.muted, marginBottom: 12 }}
        selectable
      >
        {eyebrow}
      </Text>
      <Text
        className="font-mono"
        style={{
          fontSize: 36,
          lineHeight: 38,
          letterSpacing: -0.6,
          color: emphatic ? colors.greenText : colors.text,
          fontVariant: ['tabular-nums'],
        }}
        selectable
      >
        {value}
      </Text>
      {caption ? (
        <Text
          className="font-mono"
          style={{ fontSize: 12, color: emphatic ? colors.greenText : colors.muted, marginTop: 8, opacity: emphatic ? 0.85 : 1 }}
          selectable
        >
          {caption}
        </Text>
      ) : null}
    </View>
  );
};

/**
 * Intake-vs-benchmark status card (design `.mw-benchmark`): the at-a-glance
 * "is my baby's milk intake normal" answer. Status text + a horizontal
 * range bar with the recommended band shaded and a marker at today's
 * intake. Pure layout off existing tokens — no chart dependency.
 */
const BenchmarkStatusCard = ({
  dailyMl,
  low,
  high,
  status,
}: {
  dailyMl: number;
  low: number;
  high: number;
  status: 'low' | 'high' | 'ok' | null;
}) => {
  const colors = useV2Colors();
  const noGuide = low === 0 && high === 0;
  const tone = status === 'ok' ? colors.greenText : colors.danger;
  const label = noGuide
    ? 'No specific guideline'
    : status === 'ok'
      ? 'Within typical range'
      : status === 'low'
        ? 'Below typical range'
        : 'Above typical range';
  // Scale so the band sits comfortably mid-bar and a high reading still
  // fits — mirrors the design's BenchmarkBar maths.
  const maxScale = Math.max(high * 1.5, dailyMl * 1.1, 1500);
  // Annotated as the RN percentage template type so it's assignable to
  // style `left` (a bare `string` is not — DimensionValue is stricter).
  const pct = (v: number): `${number}%` =>
    `${Math.min(100, Math.max(0, (v / maxScale) * 100))}%`;
  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between" style={{ gap: 16, marginBottom: 18 }}>
        <View style={{ flexShrink: 1 }}>
          <Eyebrow>Intake benchmark</Eyebrow>
          <Text
            className="font-display-bold"
            style={{ fontSize: 24, lineHeight: 28, color: tone, marginTop: 6 }}
            selectable
          >
            {label}
          </Text>
          {!noGuide ? (
            <Text className="font-mono" style={{ fontSize: 12, color: colors.muted, marginTop: 4 }} selectable>
              {low}–{high} ml/day
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-baseline" style={{ flexShrink: 0 }}>
          <Text
            className="font-mono"
            style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1, color: colors.text, fontVariant: ['tabular-nums'] }}
            selectable
          >
            {Math.round(dailyMl).toLocaleString('en-SG')}
          </Text>
          <Text className="font-body" style={{ fontSize: 14, color: colors.muted, marginLeft: 5 }} selectable>
            ml/day
          </Text>
        </View>
      </View>

      {/* Range bar: track → shaded recommended band → intake marker. */}
      <View style={{ height: 10, borderRadius: 999, backgroundColor: colors.surface2, position: 'relative', overflow: 'hidden' }}>
        {!noGuide ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: pct(low),
              width: `${Math.max(0, Math.min(100, (high / maxScale) * 100) - Math.min(100, (low / maxScale) * 100))}%`,
              backgroundColor: colors.greenLight,
            }}
          />
        ) : null}
        <View
          style={{
            position: 'absolute',
            top: -2,
            width: 12,
            height: 14,
            borderRadius: 4,
            left: pct(dailyMl),
            marginLeft: -6,
            backgroundColor: tone,
            borderWidth: 2,
            borderColor: colors.surface,
          }}
        />
      </View>
      <View className="flex-row justify-between" style={{ marginTop: 8 }}>
        <Text className="font-mono" style={{ fontSize: 11, color: colors.muted }} selectable>0</Text>
        {!noGuide ? (
          <Text className="font-body-semibold" style={{ fontSize: 11, color: colors.greenText }} selectable>
            Typical {low}–{high} ml
          </Text>
        ) : null}
        <Text className="font-mono" style={{ fontSize: 11, color: colors.muted }} selectable>
          {Math.round(maxScale).toLocaleString('en-SG')}
        </Text>
      </View>
    </Card>
  );
};

const SectionTitle = ({ title, icon }: { title: string; icon: string }) => {
  const colors = useV2Colors();
  return (
  <View className="flex-row items-center gap-2 mb-1">
    <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.greenLight }}>
      <Text className="text-xs font-body-semibold" style={{ color: colors.greenText }}>{icon}</Text>
    </View>
    <Text className="font-display-bold text-mw-text" style={{ fontSize: 22 }} selectable>{title}</Text>
  </View>
  );
};

/**
 * Field label. Optional right-aligned `hint` mirrors the design's
 * `.mw-label` (label left, small mono helper right — e.g. "grams",
 * "cannot be in the future", "auto-fills scoop, tin size, price").
 */
const Label = ({ children, hint }: { children: React.ReactNode; hint?: string }) => {
  if (hint) {
    return (
      <View className="flex-row items-baseline justify-between mb-2" style={{ gap: 8 }}>
        <Text className="text-[11px] font-body-semibold uppercase tracking-wider text-mw-text-muted" selectable>
          {children}
        </Text>
        <Text className="text-[11px] font-mono text-mw-text-muted" selectable>
          {hint}
        </Text>
      </View>
    );
  }
  return (
    <Text className="text-[11px] font-body-semibold uppercase tracking-wider text-mw-text-muted mb-2" selectable>
      {children}
    </Text>
  );
};

const DobPart = ({
  label,
  value,
  onChange,
  maxLength,
  width,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  width: number;
}) => (
  <View>
    <Text className="text-[10px] text-mw-text-muted font-body-semibold text-center mb-1">{label}</Text>
    <TextInput
      value={value}
      onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, maxLength))}
      keyboardType="numeric"
      maxLength={maxLength}
      placeholder={label}
      className="rounded-lg border border-mw-border bg-mw-bg-panel text-mw-text text-center font-mono-medium"
      style={{ width, paddingVertical: 10, fontSize: 17, fontVariant: ['tabular-nums'] }}
    />
  </View>
);

/**
 * Single date-of-birth field. On web it's the real `<input type="date">`
 * — one tap, a calendar popover, locale formatting and keyboard a11y for
 * free (matches the design screenshot). It writes back into the existing
 * day/month/year string state (zero-padded) so `parseDobParts` and every
 * downstream calc stay byte-for-byte unchanged. Native keeps the original
 * three-box entry (no platform date control there).
 */
const pad2 = (s: string) => s.padStart(2, '0');

const DobDateField = ({
  day,
  month,
  year,
  setDay,
  setMonth,
  setYear,
}: {
  day: string;
  month: string;
  year: string;
  setDay: (v: string) => void;
  setMonth: (v: string) => void;
  setYear: (v: string) => void;
}) => {
  const colors = useV2Colors();
  const { scheme } = useTheme();
  const todayIso = new Date().toISOString().slice(0, 10);
  const isoValue =
    year.length === 4 && month !== '' && day !== ''
      ? `${year}-${pad2(month)}-${pad2(day)}`
      : '';

  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Input: any = 'input';
    return (
      <Input
        type="date"
        value={isoValue}
        max={todayIso}
        onChange={(e: { target: { value: string } }) => {
          const v = e.target.value; // 'YYYY-MM-DD' or '' when cleared
          if (!v) {
            setYear('');
            setMonth('');
            setDay('');
            return;
          }
          const [y, m, d] = v.split('-');
          setYear(y);
          setMonth(m);
          setDay(d);
        }}
        aria-label="Baby's date of birth"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '13px 14px',
          borderRadius: 10,
          border: `1.5px solid ${colors.border}`,
          background: colors.surface2,
          color: colors.text,
          fontSize: 15,
          fontFamily: 'JetBrainsMono_400Regular',
          // Themes the browser-drawn calendar glyph + popover.
          colorScheme: scheme,
          outline: 'none',
        }}
      />
    );
  }

  return (
    <View className="flex-row items-end gap-2">
      <DobPart label="DD" value={day} onChange={setDay} maxLength={2} width={60} />
      <Text className="text-2xl text-mw-border pb-2">/</Text>
      <DobPart label="MM" value={month} onChange={setMonth} maxLength={2} width={60} />
      <Text className="text-2xl text-mw-border pb-2">/</Text>
      <DobPart label="YYYY" value={year} onChange={setYear} maxLength={4} width={86} />
    </View>
  );
};

const SegmentedControl = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) => {
  const colors = useV2Colors();
  return (
  <View className="flex-row rounded-lg border border-mw-border bg-mw-bg-panel p-1 gap-1">
    {options.map((option) => {
      const active = option.value === value;
      return (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          className="flex-1 rounded-md px-2 py-2 items-center"
          style={{ backgroundColor: active ? colors.surface : 'transparent' }}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
        >
          <Text className="text-xs font-body-semibold text-center" style={{ color: active ? colors.greenText : colors.muted }}>
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
  );
};

const MiniStat = ({ value, label }: { value: string; label: string }) => {
  const colors = useV2Colors();
  return (
  <View className="rounded-lg bg-mw-bg-panel items-center" style={{ minWidth: 88, padding: 12 }}>
    <Text className="font-mono-medium" style={{ fontSize: 18, color: colors.greenText, fontVariant: ['tabular-nums'] }} selectable>{value}</Text>
    <Text className="text-[11px] text-mw-text-muted font-body mt-1" selectable>{label}</Text>
  </View>
  );
};


/**
 * Parse a composite selection key `productId#variantIdx` into its parts.
 * Returns `[null, 0]` for empty / breastmilk so callers can short-circuit.
 */
const parseProductKey = (key: string): [string | null, number] => {
  if (!key || key === 'breastmilk') return [null, 0];
  const hashIndex = key.indexOf('#');
  if (hashIndex < 0) return [key, 0]; // legacy: no variant suffix
  const productId = key.slice(0, hashIndex);
  const variantIdx = Number.parseInt(key.slice(hashIndex + 1), 10);
  return [productId, Number.isFinite(variantIdx) ? variantIdx : 0];
};

/**
 * Resolve a composite key into a Product whose mirror fields (price,
 * weightG, pricePerGram, scoopG, …) come from the chosen variant rather
 * than the default `variants[0]`. The feeding calculator + ProductInfoCard
 * read these mirror fields directly, so this adapter is the only place
 * that needs to know about variants.
 */
const resolveProductWithVariant = (
  products: Product[],
  key: string,
): Product | null => {
  const [productId, variantIdx] = parseProductKey(key);
  if (!productId) return null;
  const base = products.find((p) => p.id === productId);
  if (!base) return null;
  const variant = base.variants[variantIdx] ?? base.variants[0];
  if (!variant) return base; // defensive — should never happen
  return {
    ...base,
    weightG:        variant.weightG,
    price:          variant.price,
    scoopG:         variant.scoopG,
    waterMl:        variant.waterMl,
    img:            variant.img,
    scoopsPerTin:   variant.scoopsPerTin,
    pricePerGram:   variant.pricePerGram,
    pricePerScoop:  variant.pricePerScoop,
    pricePerMl:     variant.pricePerMl,
  };
};

const ProductSelect = ({
  label,
  hint,
  value,
  products,
  placeholder,
  includeBreastmilk = false,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  products: Product[];
  placeholder: string;
  includeBreastmilk?: boolean;
  onChange: (value: string) => void;
}) => {
  const colors = useV2Colors();
  if (Platform.OS === 'web') {
    // React Native does not provide a Picker; on web, the native HTML select
    // gives keyboard and screen-reader behavior for free.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Select: any = 'select';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Option: any = 'option';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const OptGroup: any = 'optgroup';
    return (
      <View>
        <Label hint={hint}>{label}</Label>
        <Select
          value={value}
          onChange={(event: { target: { value: string } }) => onChange(event.target.value)}
          style={makeProductSelectStyle(colors)}
          aria-label={label}
        >
          <Option value="">{placeholder}</Option>
          {includeBreastmilk ? <Option value="breastmilk">Breastmilk (exclusive or primary)</Option> : null}
          <OptGroup label="Formula">
            {/* Render one <option> per (product × variant) so a tin sold
                in multiple pack sizes is shopper-comparable. Composite
                key `${id}#${i}` survives a JSON round-trip and parses
                back with `parseProductKey`. */}
            {products.flatMap((product) =>
              product.variants.map((variant, idx) => (
                <Option key={`${product.id}#${idx}`} value={`${product.id}#${idx}`}>
                  {product.name} ({product.brand}) - {formatCurrency(variant.price)}/{formatWeight(variant.weightG)}
                </Option>
              )),
            )}
          </OptGroup>
        </Select>
      </View>
    );
  }

  // Native path — horizontal scroll of chips, one per variant. Same key
  // scheme so the parsing helpers above work identically on native and web.
  return (
    <View>
      <Label>{label}</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {includeBreastmilk ? (
          <SelectionChip label="Breastmilk" active={value === 'breastmilk'} onPress={() => onChange('breastmilk')} />
        ) : null}
        {products.flatMap((product) =>
          product.variants.map((variant, idx) => {
            const key = `${product.id}#${idx}`;
            return (
              <SelectionChip
                key={key}
                label={`${product.brand} ${product.name} · ${formatWeight(variant.weightG)}`}
                active={value === key}
                onPress={() => onChange(key)}
              />
            );
          }),
        )}
      </ScrollView>
    </View>
  );
};

const SelectionChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => {
  const colors = useV2Colors();
  return (
  <Pressable
    onPress={onPress}
    className="rounded-full border px-3 py-2"
    style={{
      backgroundColor: active ? colors.greenText : colors.surface,
      borderColor: active ? colors.greenText : colors.border,
    }}
  >
    <Text className="text-xs font-body-semibold" style={{ color: active ? colors.textInverse : colors.text }} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
  );
};

const ProductInfoCard = ({ product, compact = false }: { product: Product; compact?: boolean }) => {
  const colors = useV2Colors();
  return (
  <View className="flex-row items-center gap-3 rounded-lg" style={{ backgroundColor: compact ? colors.surface : colors.surface2, padding: compact ? 10 : 12 }}>
    <Image
      source={getProductImage(product.img)}
      resizeMode="contain"
      style={{
        width: compact ? 44 : 52,
        height: compact ? 44 : 52,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      accessibilityLabel=""
      accessibilityElementsHidden
    />
    <View className="flex-1">
      <Text className="text-[11px] text-mw-text-muted font-body-semibold uppercase" selectable>{product.brand}</Text>
      <Text className="text-[13.5px] font-body-semibold text-mw-text" numberOfLines={2} selectable>{product.name}</Text>
      <Text className="text-xs text-mw-text-muted font-body mt-0.5" selectable>
        {formatWeight(product.weightG ?? 0)} · {formatCurrency(product.price)} · {formatCurrency(product.pricePerGram)}/g · {product.scoopG ?? '-'}g/scoop
      </Text>
    </View>
  </View>
  );
};

/**
 * Bordered numeric field (design: the "Price per tin" $-prefixed input).
 * `label` is optional — when the caller already renders a <Label hint>
 * above (the screenshot pattern), omit it and pass `aria` for a11y.
 */
const SpecField = ({
  label,
  aria,
  value,
  onChange,
  prefix,
  suffix,
  decimals = false,
}: {
  label?: string;
  aria?: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  decimals?: boolean;
}) => {
  const colors = useV2Colors();
  // Keep input numeric. For decimal fields allow one dot; collapse any
  // extra dots so "4.3.1" → "4.31" rather than NaN at the parse boundary.
  const sanitize = (raw: string): string => {
    const cleaned = raw.replace(decimals ? /[^\d.]/g : /[^\d]/g, '');
    if (!decimals) return cleaned;
    const [head, ...tail] = cleaned.split('.');
    return tail.length ? `${head}.${tail.join('')}` : cleaned;
  };
  return (
    <View style={{ flex: 1, minWidth: 96 }}>
      {label ? (
        <Text className="text-[10px] text-mw-text-muted font-body-semibold mb-1" selectable>{label}</Text>
      ) : null}
      <View
        className="flex-row items-center rounded-lg border border-mw-border bg-mw-bg-card"
        style={{ paddingHorizontal: 12 }}
      >
        {prefix ? <Text className="font-mono" style={{ color: colors.muted, fontSize: 14 }}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={(t) => onChange(sanitize(t))}
          keyboardType={decimals ? 'decimal-pad' : 'numeric'}
          placeholder="—"
          placeholderTextColor={colors.muted}
          accessibilityLabel={aria ?? label ?? 'Numeric value'}
          className="flex-1 font-mono-medium text-mw-text"
          style={{ paddingVertical: 13, fontSize: 15, fontVariant: ['tabular-nums'] }}
        />
        {suffix ? <Text className="font-mono ml-1" style={{ color: colors.muted, fontSize: 12 }}>{suffix}</Text> : null}
      </View>
    </View>
  );
};

/**
 * Compact −/＋ stepper for scoop size (design screenshot). Distinct from
 * the slider-backed `Stepper` used for ml/feed & feeds/day — the spec
 * fields read as a tight numeric trio, not sliders.
 */
const SpecStepper = ({
  value,
  onChange,
  step,
  min,
  max,
  decimals = false,
}: {
  value: string;
  onChange: (v: string) => void;
  step: number;
  min: number;
  max: number;
  decimals?: boolean;
}) => {
  const colors = useV2Colors();
  const fmt = (n: number) => (decimals ? String(Math.round(n * 10) / 10) : String(Math.round(n)));
  const bump = (dir: 1 | -1) => {
    const n = Number(value);
    const base = Number.isFinite(n) ? n : min;
    onChange(fmt(Math.min(max, Math.max(min, base + dir * step))));
  };
  const Btn = ({ label, dir }: { label: string; dir: 1 | -1 }) => (
    <Pressable
      onPress={() => bump(dir)}
      accessibilityRole="button"
      accessibilityLabel={dir === 1 ? 'Increase' : 'Decrease'}
      hitSlop={8}
      style={{ width: 42, paddingVertical: 12, alignItems: 'center' }}
    >
      <Text className="font-mono" style={{ fontSize: 18, color: colors.text }}>{label}</Text>
    </Pressable>
  );
  return (
    <View
      className="flex-row items-center rounded-lg border border-mw-border bg-mw-bg-card"
      style={{ alignSelf: 'flex-start' }}
    >
      <Btn label="−" dir={-1} />
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(decimals ? /[^\d.]/g : /[^\d]/g, ''))}
        keyboardType={decimals ? 'decimal-pad' : 'numeric'}
        accessibilityLabel="Scoop size in grams"
        className="font-mono-medium text-mw-text text-center"
        style={{
          width: 64,
          paddingVertical: 11,
          fontSize: 15,
          fontVariant: ['tabular-nums'],
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
        }}
      />
      <Btn label="＋" dir={1} />
    </View>
  );
};

/**
 * Tin-size picker. Web → native <select> of common SG pack sizes; the
 * current value is always present (prepended if a product's weight isn't
 * a standard size). Native → numeric fallback.
 */
const TIN_SIZES = [380, 400, 800, 820, 850, 900, 1650, 1700, 1800];

const SpecSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const colors = useV2Colors();
  const opts = value && !TIN_SIZES.includes(Number(value))
    ? [Number(value), ...TIN_SIZES]
    : TIN_SIZES;
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Select: any = 'select';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Option: any = 'option';
    return (
      <Select
        value={value}
        onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
        aria-label="Tin size in grams"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '13px 12px',
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          color: colors.text,
          fontSize: 15,
          fontFamily: 'JetBrainsMono_400Regular',
        }}
      >
        {opts.map((g) => (
          <Option key={g} value={String(g)}>{g}g</Option>
        ))}
      </Select>
    );
  }
  return <SpecField aria="Tin size in grams" value={value} onChange={onChange} suffix="g" />;
};

const RatioControl = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const colors = useV2Colors();
  return (
  <View>
    <View className="flex-row flex-wrap gap-2">
      {[10, 30, 50, 70, 90].map((pct) => (
        <Pressable
          key={pct}
          onPress={() => onChange(pct)}
          className="rounded-full border px-3 py-2"
          style={{
            backgroundColor: value === pct ? colors.greenText : colors.surface,
            borderColor: value === pct ? colors.greenText : colors.border,
          }}
        >
          <Text className="text-xs font-mono-medium" style={{ color: value === pct ? colors.textInverse : colors.text, fontVariant: ['tabular-nums'] }}>
            {pct}/{100 - pct}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
  );
};

const InfoBox = ({ tone, children }: { tone: 'green' | 'amber' | 'blue' | 'muted'; children: React.ReactNode }) => {
  const colors = useV2Colors();
  const palette = {
    green: { bg: colors.greenLight, border: colors.green, fg: colors.greenText },
    amber: { bg: colors.amberLight, border: colors.amber, fg: colors.amber },
    blue: { bg: colors.infoSoft, border: colors.info, fg: colors.info },
    muted: { bg: colors.surface2, border: colors.border, fg: colors.muted },
  }[tone];
  return (
    <View className="rounded-lg mt-4" style={{ backgroundColor: palette.bg, borderLeftWidth: 3, borderLeftColor: palette.border, padding: 12 }}>
      <Text className="text-sm font-body" style={{ color: palette.fg, lineHeight: 20 }} selectable>
        {children}
      </Text>
    </View>
  );
};

/**
 * Cross-border price estimate. Singapore parents routinely buy formula in
 * Johor Bahru because the same tin is materially cheaper in Malaysia. This
 * card turns the already-computed yearly tin volume into a concrete "what
 * you'd save" figure — the highest-intent number on the page for a
 * cost-driven user.
 *
 * Constants are deliberately rough and labelled "estimate" in the UI:
 *   - SGD_TO_MYR: nominal exchange rate. Directional, not a live quote;
 *     formula isn't a forex-sensitive purchase, so a fixed planning rate
 *     is honest enough and avoids a network dependency on this screen.
 *   - MY_DISCOUNT: typical SG→MY retail price gap for the same product
 *     (~28%, matching the design handoff's MalaysiaCompare reference).
 * Both are single-source named constants so a future correction is one
 * edit, not a hunt through arithmetic.
 */
const SGD_TO_MYR = 3.05;
const MY_DISCOUNT = 0.28;

const MalaysiaCompare = ({
  tinPriceSgd,
  tinsPerYear,
}: {
  tinPriceSgd: number;
  tinsPerYear: number;
}) => {
  const colors = useV2Colors();
  // MY price in SGD-equivalent, then converted to ringgit for display.
  const myPriceSgd = tinPriceSgd * (1 - MY_DISCOUNT);
  const myPriceMyr = Math.round(tinPriceSgd * SGD_TO_MYR * (1 - MY_DISCOUNT));
  const savePerTin = tinPriceSgd - myPriceSgd;
  const annualSavings = savePerTin * tinsPerYear;
  const pctLess = Math.round(MY_DISCOUNT * 100);

  return (
    <View style={{ gap: 16 }}>
      <View className="flex-row flex-wrap" style={{ gap: 16 }}>
        <View className="rounded-lg bg-mw-bg-panel" style={{ flex: 1, minWidth: 150, padding: 16 }}>
          <Text className="text-[11px] font-body-semibold uppercase tracking-wider text-mw-text-muted" selectable>
            SG / tin
          </Text>
          <Text className="font-mono-medium mt-1" style={{ fontSize: 24, color: colors.text, fontVariant: ['tabular-nums'] }} selectable>
            {formatCurrency(tinPriceSgd)}
          </Text>
        </View>
        <View className="rounded-lg bg-mw-bg-panel" style={{ flex: 1, minWidth: 150, padding: 16 }}>
          <Text className="text-[11px] font-body-semibold uppercase tracking-wider text-mw-text-muted" selectable>
            MY / tin (est.)
          </Text>
          <Text className="font-mono-medium mt-1" style={{ fontSize: 24, color: colors.text, fontVariant: ['tabular-nums'] }} selectable>
            RM {myPriceMyr.toLocaleString('en-SG')}
          </Text>
        </View>
      </View>

      {/* Highlighted savings panel — the design's sage "what you'd save"
          block. greenText (not green) for the label so small uppercase
          text clears WCAG-AA on the tint (§9b Phase 7 a11y rule). */}
      <View className="rounded-xl items-center" style={{ backgroundColor: colors.greenLight, padding: 20 }}>
        <Text className="text-[11px] font-body-semibold uppercase tracking-wider text-center" style={{ color: colors.greenText }} selectable>
          Estimated annual savings
        </Text>
        <Text className="font-mono-medium mt-2 text-center" style={{ fontSize: 34, color: colors.greenText, fontVariant: ['tabular-nums'] }} selectable>
          {formatCurrency(annualSavings)}
        </Text>
        <Text className="text-xs font-body mt-2 text-center" style={{ color: colors.greenText, lineHeight: 18 }} selectable>
          ~{pctLess}% less in MY · based on {formatNumber(tinsPerYear, { maximumFractionDigits: 1 })} tins/year at your current feeding rate. Cross-border purchases for personal use are generally permitted but subject to SG customs allowances.
        </Text>
      </View>
    </View>
  );
};

const LegendSwatch = ({ color, label, boxed = false }: { color: string; label: string; boxed?: boolean }) => (
  <View className="flex-row items-center gap-1.5">
    <View
      style={{
        width: boxed ? 16 : 12,
        height: boxed ? 8 : 12,
        borderRadius: boxed ? 3 : 6,
        backgroundColor: color,
        borderWidth: boxed ? 1 : 0,
        borderColor: 'rgba(27,94,59,.3)',
      }}
    />
    <Text className="text-xs text-mw-text-muted font-body" selectable>{label}</Text>
  </View>
);

const GuidelineHeader = () => (
  <View className="flex-row bg-mw-bg-panel border-b border-mw-border">
    {['Age', 'ml / feed', 'Feeds / day', 'Daily total', 'Notes'].map((label, index) => (
      <Text
        key={label}
        className="text-[10.5px] font-body-semibold uppercase tracking-wider text-mw-text-muted"
        style={{ width: index === 4 ? 260 : 90, paddingHorizontal: 10, paddingVertical: 9 }}
      >
        {label}
      </Text>
    ))}
  </View>
);

const GuidelineRow = ({
  guideline,
  current,
}: {
  guideline: (typeof SG_GUIDELINES)[number];
  current: boolean;
}) => {
  const colors = useV2Colors();
  return (
  <View className="flex-row border-b border-mw-border" style={{ backgroundColor: current ? colors.greenLight : 'transparent' }}>
    <GuidelineCell text={guideline.label} width={90} current={current} />
    <GuidelineCell text={`${guideline.mlMin}-${guideline.mlMax}ml`} width={90} current={current} mono />
    <GuidelineCell text={`${guideline.fMin}-${guideline.fMax}x`} width={90} current={current} mono />
    <GuidelineCell text={`${guideline.dMin}-${guideline.dMax}ml`} width={90} current={current} mono />
    <GuidelineCell text={guideline.note} width={260} muted />
  </View>
  );
};

const GuidelineCell = ({
  text,
  width,
  current = false,
  muted = false,
  mono = false,
}: {
  text: string;
  width: number;
  current?: boolean;
  muted?: boolean;
  /** Numeric range columns (ml/feed, feeds/day, daily total) render in
      tabular mono so the ranges align down each column. Age + Notes
      are prose and stay body. */
  mono?: boolean;
}) => {
  const colors = useV2Colors();
  return (
  <Text
    className={`text-xs ${mono ? (current ? 'font-mono-medium' : 'font-mono') : 'font-body'}`}
    style={{
      width,
      paddingHorizontal: 10,
      paddingVertical: 9,
      color: current ? colors.greenText : muted ? colors.muted : colors.text,
      // Mono carries weight via the family; body keeps the current-row bold cue.
      ...(mono ? { fontVariant: ['tabular-nums'] as const } : { fontWeight: current ? '700' : '400' }),
      lineHeight: 17,
    }}
    selectable
  >
    {text}
  </Text>
  );
};
