# ShrinkNotes

Compress PDF exports from GoodNotes **without rasterizing the handwriting**. Runs entirely in the browser, nothing is uploaded.

| File | Before | After |
|---|---|---|
| Statistics formula sheet, 4 pages | 116.3 MB | 9.8 MB |
| Mechanics formula sheet, 2 pages | 61.8 MB | 4.7 MB |

## Why GoodNotes PDFs are huge

GoodNotes exports every pen stroke as a chain of small, overlapping filled shapes ("stamps"), roughly one per stylus sample, each built from about ten Bézier curves with 7-digit coordinates. Two pages of notes easily contain 300,000+ of these shapes. Generic PDF compressors can only recompress the bytes or rasterize the pages, which makes handwriting blurry when you zoom in.

## How it works

1. Parse the PDF (pdf-lib) and pick the large Flate-compressed page content streams and form XObjects.
2. Inflate each stream and run a single-pass lexer over it. Everything that is not a filled path is copied byte for byte.
3. For each filled path (one stroke): flatten the Béziers (Wang's formula, 0.006 pt tolerance), union all subpaths with the **same fill rule the PDF uses** (Clipper2, nonzero / even-odd), simplify the outline (Douglas–Peucker, 0.02 pt) and write it back with 2-decimal coordinates.
4. Deflate (level 9) and write the new PDF. A stream is only replaced if it got smaller; streams with inline images are left untouched.

Streams are processed in parallel Web Workers (max. 2 on iPad because of Safari's memory limit). Rendered at 600 dpi, the output differs from the original only in a few dozen anti-aliasing pixels per page.

## Development

```sh
npm install
npm run build                          # → dist/index.html, one self-contained file
npm run shrink -- in.pdf out.pdf       # shrink a file in Node (worker_threads)
npm run test:browser -- in.pdf out.pdf # end-to-end test in headless Chromium (needs playwright)
```

## Deploy

`dist/index.html` is the whole site. On Cloudflare Pages use build command `npm run build` and output directory `dist`.

## Project layout

```
src/content.js       content-stream lexer and rewriter
src/geometry.js      flatten → union → simplify for one stroke
src/stream.js        inflate → rewrite → deflate for one stream
src/pdf.js           PDF-level orchestration (pdf-lib)
src/runner.js        Web Worker pool with main-thread fallback
src/worker-entry.js  worker script
src/app.js           UI
web/template.html    page markup and styles
build.mjs            bundles everything into dist/index.html
```

## Dependencies

- [pdf-lib](https://github.com/Hopding/pdf-lib) (MIT): PDF parsing and writing
- [clipper2-ts](https://www.npmjs.com/package/clipper2-ts) (BSL-1.0): polygon union
- [fflate](https://github.com/101arrowz/fflate) (MIT): inflate/deflate
- [esbuild](https://esbuild.github.io) (MIT): build
- Fonts [Shantell Sans](https://github.com/arrowtype/shantell-sans) and [DM Mono](https://github.com/googlefonts/dm-mono) (SIL OFL 1.1) via Fontsource, inlined into the page so no third-party requests are made

## License

MIT. Not affiliated with GoodNotes.
