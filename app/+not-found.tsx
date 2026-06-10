/**
 * app/+not-found.tsx — catch-all 404 screen.
 *
 * Expo Router serves this for any URL that doesn't match a real route.
 * Keeping it friendly and on-brand turns dead links into a moment of trust
 * instead of a moment of confusion.
 */

import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { EmptyState } from '../src/components/EmptyState';
import { PageMeta } from '../src/components/PageMeta';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen>
      <PageMeta title="Page not found" />
      <EmptyState
        title="Page not found"
        description="That link doesn't lead anywhere. Try the home page instead."
        actionLabel="Back to compare"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
