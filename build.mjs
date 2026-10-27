// Builds the site into dist/:
//   dist/index.html     standalone page (deploy this, e.g. to Cloudflare Pages)
//   dist/fragment.html  same page without the document skeleton (for embedding hosts)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

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
const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M4 20c4-9 7-12 9-10s-3 9 0 9 6-12 9-11 1 8 6 8" fill="none" stroke="#2c57c9" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`;
const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="icon" href="${favicon}">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}</style>
</head>
<body>
${fragment}
</body>
</html>
`;

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', standalone);
writeFileSync('dist/fragment.html', fragment);
console.log(`dist/index.html  ${(standalone.length / 1024).toFixed(0)} KB  (worker ${(workerSrc.length / 1024).toFixed(0)} KB)`);
