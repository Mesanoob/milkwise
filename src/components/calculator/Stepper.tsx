/**
 * Stepper — slider + manual +/− entry for numeric inputs (ml per feed, feeds/day).
 *
 * Design pattern: always keep the slider and the numeric input in sync.
 * We hold a `raw` string locally so the user can type without the field
 * resetting on every keystroke; we commit to the parent only on blur/Enter.
 *
 * Platform note: `@react-native-community/slider` renders a native slider on
 * iOS/Android and an <input type="range"> on web — same API, no Platform.OS needed.
 */

import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../contexts/ThemeContext';

interface StepperProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

function clamp(v: number, mn: number, mx: number) {
  return Math.max(mn, Math.min(mx, v));
}

export function Stepper({ label, value, onChange, min, max, step, unit }: StepperProps) {
  const { tokens } = useTheme();
  // Local raw string so typing "15" doesn't commit after "1"
  const [raw, setRaw] = useState(String(value));

  useEffect(() => { setRaw(String(value)); }, [value]);

  function commit(text: string) {
    const n = Math.round(parseFloat(text));
    if (!isNaN(n) && n >= min && n <= max) {
      onChange(n);
    }
    setRaw(String(isNaN(n) ? value : clamp(n, min, max)));
  }

  function inc() {
    const nv = clamp(value + step, min, max);
    onChange(nv);
    setRaw(String(nv));
  }

  function dec() {
    const nv = clamp(value - step, min, max);
    onChange(nv);
    setRaw(String(nv));
  }

  const mid = Math.round((min + max) / 2);

  return (
    <View className="flex-1">
      <Text className="text-[10px] font-body-semibold text-mw-text-muted uppercase tracking-wider mb-1">
        {label} — <Text className="font-mono-medium" style={{ color: tokens.colors.accentText, fontVariant: ['tabular-nums'] }}>{value}{unit}</Text>
      </Text>

      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={clamp(value, min, max)}
        onValueChange={(n) => { onChange(Math.round(n)); setRaw(String(Math.round(n))); }}
        minimumTrackTintColor={tokens.colors.accent}
        maximumTrackTintColor={tokens.colors.border}
        thumbTintColor={tokens.colors.accent}
        style={{ marginVertical: 4 }}
      />

      <View className="flex-row justify-between mb-2">
        <Text className="text-[10px] text-mw-text-muted font-mono" style={{ fontVariant: ['tabular-nums'] }}>{min}{unit}</Text>
        <Text className="text-[10px] font-mono-medium" style={{ color: tokens.colors.accentText, fontVariant: ['tabular-nums'] }}>{mid}{unit}</Text>
        <Text className="text-[10px] text-mw-text-muted font-mono" style={{ fontVariant: ['tabular-nums'] }}>{max}{unit}</Text>
      </View>

      {/* +/− stepper row */}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={dec}
          className="w-9 h-9 rounded-lg border border-mw-border bg-mw-bg-panel items-center justify-center"
        >
          <Text className="text-lg font-body-semibold text-mw-text">−</Text>
        </Pressable>

        <TextInput
          className="flex-1 text-center py-2 text-lg font-mono-medium rounded-lg border border-mw-border bg-mw-bg-panel text-mw-text"
          style={{ fontVariant: ['tabular-nums'] }}
          keyboardType="numeric"
          value={raw}
          onChangeText={setRaw}
          onBlur={() => commit(raw)}
          onSubmitEditing={(e) => commit(e.nativeEvent.text)}
          returnKeyType="done"
          selectTextOnFocus
        />

        <Pressable
          onPress={inc}
          className="w-9 h-9 rounded-lg border border-mw-border bg-mw-bg-panel items-center justify-center"
        >
          <Text className="text-lg font-body-semibold text-mw-text">+</Text>
        </Pressable>

        <Text className="text-sm font-body-semibold text-mw-text-muted">{unit}</Text>
      </View>
    </View>
  );
}
