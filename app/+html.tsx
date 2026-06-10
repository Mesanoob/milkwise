/**
 * app/+html.tsx — the HTML document shell for web builds.
 *
 * Expo Router renders this ONCE at export time to produce the HTML that
 * wraps the client bundle. It never re-renders in the browser, so only
 * static document-level concerns belong here: <head> metadata, viewport,
 * and the scroll-behaviour style Expo recommends for ScrollView parity.
 *
 * SEO note: the app ships as a single-page export, so these tags are the
 * one set of metadata crawlers and link-unfurlers (WhatsApp, Telegram —
 * the channels SG parents actually share on) will see for every route.
 * Keep the description in sync with APP_TAGLINE in src/config/constants.ts.
 */

import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Update this when the production domain is finalised — it drives the
// canonical URL and the OG/Twitter card links.
const SITE_URL = 'https://milkwise.sg';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en-SG">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* No <title>/<meta description> here — every screen mounts
            <PageMeta>, and Expo Router's head manager owns those tags.
            A second static copy would produce duplicate elements. */}
        <link rel="canonical" href={SITE_URL} />

        {/* Brand colour for browser chrome — matches theme.ts light bg. */}
        <meta name="theme-color" content="#F7F3EA" />

        {/* Open Graph — WhatsApp/Telegram/Facebook link previews.
            og:title / og:description come from each screen's <PageMeta>. */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MilkWise SG" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:locale" content="en_SG" />

        {/* Twitter/X card. */}
        <meta name="twitter:card" content="summary" />

        {/*
          Disable body scrolling on web so ScrollView behaves closer to
          native — recommended by Expo's html template. Remove if the app
          ever moves to body scrolling.
        */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
