#!/usr/bin/env node
/**
 * scripts/generate-image-map.mjs
 *
 * Regenerates `src/data/imageMap.ts` from the contents of
 * `assets/products/`. Run after adding or removing product images:
 *
 *   npm run generate:images
 *
 * Why a script (not a runtime glob): React Native's Metro bundler requires
 * STATIC `require()` calls so it can include the image bytes in the final
 * bundle. A glob would work at dev-time on web but fail in the native build.
 */

import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const IMG_DIR   = join(ROOT, 'assets/products');
const OUT_FILE  = join(ROOT, 'src/data/imageMap.ts');

const ALLOWED_EXT = /\.(jpg|jpeg|png|webp)$/i;

const images = readdirSync(IMG_DIR)
  .filter((name) => ALLOWED_EXT.test(name))
  .sort();

const entries = images
  .map((name) => `  '${name}': require('../../assets/products/${name}'),`)
  .join('\n');

const output = `/**
 * Auto-generated image map.
 *
 * React Native's \`require()\` only accepts STATIC string literals — you cannot
 * say \`require(somePath)\` and expect Metro to bundle the asset. To work
 * around that we generate one \`require\` per file at build time and look up
 * the result by filename at runtime.
 *
 * To regenerate after adding/removing images in \`assets/products/\`:
 *   npm run generate:images
 *
 * DO NOT EDIT BY HAND.
 */

import type { ImageSourcePropType } from 'react-native';

const PLACEHOLDER: ImageSourcePropType = require('../../assets/icon.png');

const imageMap: Record<string, ImageSourcePropType> = {
${entries}
};

export const getProductImage = (path: string | null | undefined): ImageSourcePropType => {
  if (!path) return PLACEHOLDER;
  const filename = path.split('/').pop() ?? path;
  return imageMap[filename] ?? PLACEHOLDER;
};

export { PLACEHOLDER as PLACEHOLDER_IMAGE };
`;

writeFileSync(OUT_FILE, output);
console.log(`Wrote ${OUT_FILE} (${images.length} images)`);
