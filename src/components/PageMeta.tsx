/**
 * PageMeta — per-route <title> + description for web SEO.
 *
 * Expo Router's head manager owns the document <title> at runtime (the
 * `data-rh` element in the exported HTML). The shell title in `+html.tsx`
 * alone is not enough: with no screen-level Head, the runtime title is the
 * empty string and crawlers see an empty first <title> element. Mounting
 * this component in each screen fixes both — at export time the route's
 * static HTML carries the right tags, and at runtime client navigation
 * updates the tab title.
 *
 * Native is a no-op: expo-router/head only renders on web.
 */

import Head from 'expo-router/head';
import { APP_NAME } from '../config/constants';

type Props = {
  /** Page-specific part of the title; rendered as "{title} · MilkWise SG". */
  title: string;
  /** Meta + OG description. Falls back to the site-wide default. */
  description?: string;
};

const DEFAULT_DESCRIPTION =
  'Independent baby-formula comparison for Singapore parents. Compare 76 ' +
  'formulas side-by-side, calculate your real monthly cost, and read ' +
  'plain-English nutrition guidance. No ads, no sponsors.';

export const PageMeta = ({ title, description = DEFAULT_DESCRIPTION }: Props) => {
  const full = `${title} · ${APP_NAME}`;
  return (
    <Head>
      <title>{full}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
    </Head>
  );
};
