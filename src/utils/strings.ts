/**
 * String helpers — small, pure, dependency-free.
 *
 * These are used by search/filter logic. Keep them deterministic and
 * side-effect free so they remain trivially unit-testable.
 */

/**
 * Lower-case + strip non-alphanumeric characters.
 *
 * Used for forgiving search: "S-26 Gold" matches the query "s26gold" because
 * both sides go through this function first. This is a poor man's Unicode
 * normalisation — fine for the Latin product names MilkWise carries.
 */
export const normaliseForSearch = (input: string): string =>
  input.toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * Convert any specialty key (e.g. "csection") into a human-readable label
 * for chips and filter buttons. Falls back to a title-cased version of the
 * key so a missing entry still renders something sensible rather than
 * crashing the UI.
 */
const SPECIALTY_LABELS: Record<string, string> = {
  budget:         'Budget',
  organic:        'Organic',
  gentle:         'Gentle Digestion',
  goat:           'Goat Milk',
  soy:            'Soy-Based',
  lactosefree:    'Lactose-Free',
  ha:             'HA (Hypoallergenic-Lite)',
  hypoallergenic: 'Hypoallergenic',
  ar:             'Anti-Reflux',
  csection:       'C-Section Recovery',
  premature:      'Premature',
};

export const labelForSpecialty = (key: string | null | undefined): string => {
  if (!key) return '';
  if (SPECIALTY_LABELS[key]) return SPECIALTY_LABELS[key];
  // Fallback: turn "someThing" → "Some Thing"
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
};
