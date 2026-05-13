/**
 * EmptyState — what we show when a filter combination returns zero results.
 *
 * Generic on purpose: it accepts a `title`, optional `description`, and an
 * optional action button. That lets us reuse the same component for
 * "no products match", "no detail data on file", and future empty states
 * without forking the design.
 */

import { View, Text, Pressable } from 'react-native';

export interface EmptyStateProps {
  title:        string;
  description?: string;
  actionLabel?: string;
  onAction?:    () => void;
}

export const EmptyState = ({ title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <View className="items-center justify-center px-6 py-12 gap-3">
      <Text className="text-4xl">¬</Text>
      <Text className="text-lg font-serif text-text text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-muted text-center max-w-[320px]">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityLabel={actionLabel}
          className="mt-2 bg-green px-4 py-2 rounded-lg"
        >
          <Text className="text-white text-sm font-sans-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};
