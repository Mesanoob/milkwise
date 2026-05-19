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
  const products = useMemo(
    () => getAllProducts().sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState<Gender>('');

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
  const [mlPerFeed, setMlPerFeed] = useState(150);
  const [feedsPerDay, setFeedsPerDay] = useState(5);
  const [hasSolids, setHasSolids] = useState(false);
  const [solidsLevel, setSolidsLevel] = useState<SolidsLevel>('starting');

  const dob = useMemo(() => parseDobParts(day, month, year), [day, month, year]);
  const age = useMemo(() => (dob ? calcAge(dob) : null), [dob]);
  const ageMonths = age ? Math.min(age.months, 11) : null;
  const guideline = ageMonths !== null ? SG_GUIDELINES[ageMonths] : null;
  const dobError = year.length === 4 && !dob
    ? 'Invalid date. Check DD / MM / YYYY.'
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
    ],
  );

  const hasDob = dob !== null;
  const showCost = (primaryProduct || supplementalProduct) && estimate.costPerMonth !== null;
  const intakeStatus = guideline
    ? estimate.dailyMl < guideline.dMin
      ? 'low'
      : estimate.dailyMl > guideline.dMax
        ? 'high'
        : 'ok'
    : null;
  const primaryLabel = primaryIsBreastmilk ? 'Breastmilk' : primaryProduct?.name ?? '';
  const supplementalLabel = supplementalProduct?.name ?? '';

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

      <View style={{ maxWidth: 960, width: '100%', marginHorizontal: 'auto', paddingHorizontal: 20, paddingVertical: 28, gap: 24 }}>
        <Card>
          <SectionTitle title="Baby Info" icon="1" />
          <Text className="text-sm text-mw-text-muted font-body mb-5" selectable>
            Enter birth date and feeding details to personalise the benchmark and cost estimate.
          </Text>

          <View className="flex-row flex-wrap gap-5">
            <View style={{ flex: 1, minWidth: 260 }}>
              <Label>Date of birth</Label>
              <View className="flex-row items-end gap-2">
                <DobPart label="DD" value={day} onChange={setDay} maxLength={2} width={60} />
                <Text className="text-2xl text-mw-border pb-2">/</Text>
                <DobPart label="MM" value={month} onChange={setMonth} maxLength={2} width={60} />
                <Text className="text-2xl text-mw-border pb-2">/</Text>
                <DobPart label="YYYY" value={year} onChange={setYear} maxLength={4} width={86} />
              </View>
              {dobError ? (
                <Text className="text-xs mt-2 font-body" style={{ color: colors.danger }} selectable>
                  {dobError}
                </Text>
              ) : null}
            </View>

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
          </View>

          {age && guideline ? (
            <View className="mt-5 rounded-xl flex-row flex-wrap items-center gap-4" style={{ backgroundColor: colors.greenLight, padding: 18 }}>
              <View style={{ flex: 1, minWidth: 240 }}>
                <Text className="text-[11px] font-body-semibold uppercase tracking-wider" style={{ color: colors.green }}>
                  Your baby is
                </Text>
                <Text className="font-display-bold mt-1" style={{ fontSize: 30, color: colors.green }} selectable>
                  {age.months} month{age.months === 1 ? '' : 's'}, {age.days} day{age.days === 1 ? '' : 's'}
                </Text>
                <Text className="text-xs font-body mt-1" style={{ color: colors.greenMid }} selectable>
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
        </Card>

        {hasDob && ageMonths !== null ? (
          <Card>
            <SectionTitle title="Singapore Feeding Benchmark" icon="2" />
            <Text className="text-sm text-mw-text-muted font-body mb-4" selectable>
              Recommended daily milk intake by month. Shaded band is the benchmark range.
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

        {hasDob ? (
          <Card>
            <SectionTitle title="Your Baby's Feeding" icon="3" />
            <Text className="text-sm text-mw-text-muted font-body mb-5" selectable>
              Current feeding pattern drives powder usage and monthly formula cost.
            </Text>

            <View style={{ gap: 20 }}>
              <ProductSelect
                label="Formula / breastmilk you are using"
                value={primaryId}
                products={products}
                includeBreastmilk
                placeholder="Select primary feeding"
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

              <View className="rounded-lg flex-row flex-wrap items-center gap-2" style={{ backgroundColor: colors.surface2, padding: 12 }}>
                <Text className="text-sm text-mw-text-muted font-body">Total milk today:</Text>
                <Text className="text-lg font-mono-medium" style={{ color: colors.green, fontVariant: ['tabular-nums'] }} selectable>
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

              {guideline && intakeStatus ? (
                <InfoBox tone={intakeStatus === 'ok' ? 'green' : 'amber'}>
                  {intakeStatus === 'ok'
                    ? `${estimate.dailyMl}ml/day is within the ${guideline.dMin}-${guideline.dMax}ml benchmark range for ${ageMonths} months.`
                    : intakeStatus === 'low'
                      ? `${estimate.dailyMl}ml/day is below the ${guideline.dMin}ml benchmark minimum. Check with a paediatrician if intake or weight gain is a concern.`
                      : `${estimate.dailyMl}ml/day is above the ${guideline.dMax}ml benchmark maximum. This can happen, but discuss concerns with a paediatrician.`}
                </InfoBox>
              ) : null}
            </View>
          </Card>
        ) : null}

        {hasDob && showCost ? (
          <Card>
            <SectionTitle title="Formula Usage & Cost" icon="4" />
            <Text className="text-sm text-mw-text-muted font-body mb-5" selectable>
              {primaryIsBreastmilk
                ? `Breastmilk primary + ${supplementalLabel} supplement`
                : `${primaryLabel}${useSupplement && supplementalLabel ? ` + ${supplementalLabel}` : ''}`} · {estimate.effectivePricePerGram ? `${formatCurrency(estimate.effectivePricePerGram)}/g effective` : 'No formula cost'}
            </Text>

            <View className="flex-row flex-wrap gap-3 mb-6">
              <StatCard value={`${Math.round(estimate.powderDayG)}g`} label="Powder / day" />
              <StatCard value={`${Math.round(estimate.powderMonthG)}g`} label="Powder / month" />
              <StatCard value={estimate.tinsPerMonth ? estimate.tinsPerMonth.toFixed(1) : '-'} label="Tins / month" />
              <StatCard value={formatCurrency(estimate.costPerMonth)} label="Cost / month" />
              <StatCard value={formatCurrency((estimate.costPerMonth ?? 0) * 12)} label="Est. / year" />
            </View>

            <Text className="text-base font-body-semibold text-mw-text mb-1" selectable>
              Monthly formula cost, 0 to 12 months
            </Text>
            <Text className="text-xs text-mw-text-muted font-body mb-3" selectable>
              Light green = past estimate, dark green = current month, grey = projected.
            </Text>
            <SpendChart monthlyData={estimate.monthlyData} babyMonths={ageMonths ?? 0} />
          </Card>
        ) : null}

        {hasDob && showCost && ageMonths !== null && ageMonths > 0 ? (
          <Card>
            <SectionTitle title="Estimated Lifetime Formula Spend" icon="5" />
            <Text className="text-sm text-mw-text-muted font-body mb-5" selectable>
              Past spend is estimated from benchmark intake. Projected spend uses your entered feeding rate.
            </Text>
            <View className="flex-row flex-wrap gap-3 mb-6">
              <SpendSummary tone="amber" value={formatCurrency(estimate.retroSpend)} label={`Already spent months 0-${ageMonths - 1}`} />
              <SpendSummary tone="greenLight" value={formatCurrency(estimate.projectedSpend)} label={`Projected months ${ageMonths}-11`} />
              <SpendSummary tone="green" value={formatCurrency(estimate.totalSpend)} label="Stage 1 total birth to 12 months" />
            </View>
            <Text className="text-base font-body-semibold text-mw-text mb-1" selectable>
              Cumulative spend curve
            </Text>
            <Text className="text-xs text-mw-text-muted font-body mb-3" selectable>
              Solid line is estimated actual spend. Dashed line is projected spend.
            </Text>
            <CumulativeSpendChart monthlyData={estimate.monthlyData} babyMonths={ageMonths} />
            <InfoBox tone="muted">
              Methodology: past spend uses benchmark ml x formula price/g. Projected spend uses your entered feeds and age-based solids reduction from 6 months. Breastmilk cost is treated as S$0.
            </InfoBox>
          </Card>
        ) : null}

        {hasDob && ageMonths !== null ? (
          <Card>
            <SectionTitle title="Singapore Infant Feeding Guidelines" icon="6" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: 620 }}>
                <GuidelineHeader />
                {SG_GUIDELINES.map((item) => (
                  <GuidelineRow key={item.m} current={item.m === ageMonths} guideline={item} />
                ))}
              </View>
            </ScrollView>
            <Text className="text-[11.5px] text-mw-text-muted font-body mt-3" style={{ lineHeight: 18 }} selectable>
              Source note: these are planning benchmarks adapted from the provided MilkWise design handoff. Always follow your paediatrician's specific advice.
            </Text>
          </Card>
        ) : (
          <View className="items-center py-12">
            <Text className="text-5xl mb-3 text-mw-text-muted">^</Text>
            <Text className="text-xl font-display-bold text-mw-text mb-2" selectable>
              Enter your baby's birthday above
            </Text>
            <Text className="text-sm text-mw-text-muted font-body text-center" selectable>
              The calculator will show personalised feeding benchmarks, usage, and cost estimates.
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <View
    className="bg-mw-bg-card rounded-xl"
    style={{
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 1,
    }}
  >
    {children}
  </View>
);

const SectionTitle = ({ title, icon }: { title: string; icon: string }) => {
  const colors = useV2Colors();
  return (
  <View className="flex-row items-center gap-2 mb-1">
    <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.greenLight }}>
      <Text className="text-xs font-body-semibold" style={{ color: colors.green }}>{icon}</Text>
    </View>
    <Text className="font-display-bold text-mw-text" style={{ fontSize: 22 }} selectable>{title}</Text>
  </View>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-[11px] font-body-semibold uppercase tracking-wider text-mw-text-muted mb-2" selectable>
    {children}
  </Text>
);

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
          <Text className="text-xs font-body-semibold text-center" style={{ color: active ? colors.green : colors.muted }}>
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
    <Text className="font-mono-medium" style={{ fontSize: 18, color: colors.green, fontVariant: ['tabular-nums'] }} selectable>{value}</Text>
    <Text className="text-[11px] text-mw-text-muted font-body mt-1" selectable>{label}</Text>
  </View>
  );
};

const StatCard = ({ value, label }: { value: string; label: string }) => {
  const colors = useV2Colors();
  return (
  <View className="rounded-lg bg-mw-bg-panel items-center" style={{ flex: 1, minWidth: 128, paddingHorizontal: 12, paddingVertical: 14 }}>
    <Text className="font-mono-medium text-center" style={{ fontSize: 21, color: colors.green, fontVariant: ['tabular-nums'] }} selectable>{value}</Text>
    <Text className="text-[11px] text-mw-text-muted font-body mt-1 text-center" selectable>{label}</Text>
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
  value,
  products,
  placeholder,
  includeBreastmilk = false,
  onChange,
}: {
  label: string;
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
        <Label>{label}</Label>
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
      backgroundColor: active ? colors.green : colors.surface,
      borderColor: active ? colors.green : colors.border,
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
            backgroundColor: value === pct ? colors.green : colors.surface,
            borderColor: value === pct ? colors.green : colors.border,
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
    green: { bg: colors.greenLight, border: colors.green, fg: colors.green },
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

const SpendSummary = ({
  tone,
  value,
  label,
}: {
  tone: 'amber' | 'greenLight' | 'green';
  value: string;
  label: string;
}) => {
  const colors = useV2Colors();
  const styles = {
    amber: { bg: colors.amberLight, fg: colors.amber, border: colors.amber },
    greenLight: { bg: colors.greenLight, fg: colors.green, border: colors.green },
    green: { bg: colors.green, fg: colors.textInverse, border: colors.green },
  }[tone];
  return (
    <View className="rounded-xl items-center border" style={{ flex: 1, minWidth: 180, padding: 18, backgroundColor: styles.bg, borderColor: styles.border }}>
      <Text className="text-[10px] font-body-semibold uppercase tracking-wider text-center" style={{ color: styles.fg, opacity: tone === 'green' ? 0.75 : 1 }} selectable>
        {label}
      </Text>
      <Text className="font-mono-medium mt-2 text-center" style={{ fontSize: 27, color: styles.fg, fontVariant: ['tabular-nums'] }} selectable>{value}</Text>
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
      color: current ? colors.green : muted ? colors.muted : colors.text,
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
