// Builds the site into dist/:
//   dist/index.html     standalone page (deploy this, e.g. to Cloudflare Pages)
//   .preview/fragment.html  same page without the document skeleton (for embedding hosts, not deployed)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';

const common = { bundle: true, minify: true, write: false, format: 'iife', target: ['safari15', 'chrome100', 'firefox100'], legalComments: 'none' };

const worker = await build({ ...common, entryPoints: ['src/worker-entry.js'] });
const workerSrc = worker.outputFiles[0].text;

const app = await build({
  ...common,
  entryPoints: ['src/app.js'],
  define: { __WORKER_SOURCE__: JSON.stringify(workerSrc) },
});
const appSrc = app.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// Fonts are inlined (no requests to Google): Shantell Sans and DM Mono, both SIL OFL 1.1, latin subset.
const FONTS = [
  ['Shantell Sans', 400, '@fontsource/shantell-sans/files/shantell-sans-latin-400-normal.woff2'],
  ['Shantell Sans', 600, '@fontsource/shantell-sans/files/shantell-sans-latin-600-normal.woff2'],
  ['Shantell Sans', 800, '@fontsource/shantell-sans/files/shantell-sans-latin-800-normal.woff2'],
  ['DM Mono', 500, '@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2'],
];
const fontCss = FONTS.map(([family, weight, file]) => {
  const b64 = readFileSync(new URL(`node_modules/${file}`, import.meta.url)).toString('base64');
  return `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
}).join('\n');

const fragment = readFileSync('web/template.html', 'utf8')
  .replace('/*__FONTS__*/', () => fontCss)
  .replace('/*__APP__*/', () => appSrc);
// ---- standalone site (what gets deployed)
const SITE_URL = 'https://shrinknotes.pages.dev/';
const TITLE = 'ShrinkNotes – Compress GoodNotes PDFs without losing quality';
const DESCRIPTION = 'Make huge GoodNotes PDF exports small. Your handwriting stays sharp vector, and the file never leaves your device. Free, runs in your browser.';

const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M4 20c4-9 7-12 9-10s-3 9 0 9 6-12 9-11 1 8 6 8" fill="none" stroke="#2c57c9" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`;
const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ShrinkNotes',
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any (runs in the browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
});
// the template's own <title>/<meta> lines belong in <head> here
const body = fragment.replace(/^<title>.*\n/m, '').replace(/^<meta name="(claude:viewport-fit-sides|description)".*\n/gm, '');
const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${TITLE}</title>
<meta name="description" content="${DESCRIPTION}">
<link rel="canonical" href="${SITE_URL}">
<meta name="google-site-verification" content="r7uLQ8P6uCxjhFmRTjHVPOYxPbBk2Y86NVCqoM9Z-tU">
<link rel="icon" href="${favicon}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#f3ead9">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ShrinkNotes">
<meta property="og:title" content="Compress your GoodNotes PDF">
<meta property="og:description" content="Huge GoodNotes exports made small. Handwriting stays sharp, nothing is uploaded.">
<meta property="og:url" content="${SITE_URL}">
<meta property="og:image" content="${SITE_URL}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="ShrinkNotes: a 116.3 MB GoodNotes PDF shrunk to 9.8 MB">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd}</script>
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}</style>
</head>
<body>
${body}
</body>
</html>
`;

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', standalone);
mkdirSync('.preview', { recursive: true });
writeFileSync('.preview/fragment.html', fragment);   // for embedding hosts; not deployed
cpSync('web/public', 'dist', { recursive: true });
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>
</urlset>
`);
console.log(`dist/index.html  ${(standalone.length / 1024).toFixed(0)} KB  (worker ${(workerSrc.length / 1024).toFixed(0)} KB)`);
