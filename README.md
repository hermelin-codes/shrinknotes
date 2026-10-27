# ShrinkNotes

**Compress your GoodNotes PDF without turning your handwriting into pixels.**

👉 **Try it: [shrinknotes.pages.dev](https://shrinknotes.pages.dev)**

Exported a notebook from GoodNotes and got a 100 MB PDF that's too big to email, upload or share? ShrinkNotes makes it a fraction of the size, and your handwriting stays sharp at any zoom.

| Example | Before | After |
|---|---|---|
| Statistics formula sheet, 4 pages | 116.3 MB | 9.8 MB |
| Mechanics formula sheet, 2 pages | 61.8 MB | 4.7 MB |

## How to use it

1. In GoodNotes, export your notebook or pages as **PDF**.
2. Open ShrinkNotes and drop the PDF onto the page (or tap to pick it).
3. Save the smaller PDF.

Works on iPad, Mac, Windows and Linux in any current browser.

## Your notes stay on your device

Your file is never uploaded. All the work happens inside your browser, so ShrinkNotes never sees your notes. The page sets no cookies. Visits are counted with Cloudflare Web Analytics, which works without cookies and without personal profiles.

## Why are GoodNotes PDFs so big?

GoodNotes exports every pen stroke as a chain of tiny overlapping shapes, roughly one for every point your pencil recorded. Two pages of notes can easily contain over 300,000 of them.

Most PDF compressors fix this by turning each page into an image. The file gets smaller, but your handwriting turns blurry as soon as you zoom in. ShrinkNotes instead merges the tiny shapes of each stroke into one clean outline. The result is still vector, so it looks the same as before.

Everything else in your PDF (typed text, pictures, imported slides, backgrounds) is copied over unchanged.

## FAQ

**Will it change how my notes look?**
No. At 600 dpi, the shrunk file differs from the original in only a few dozen edge pixels per page, invisible to the eye.

**My PDF didn't get smaller.**
ShrinkNotes is built for handwritten notes. PDFs that are mostly photos or scanned pages don't contain pen strokes it can merge. If you think your file should work, please open an issue.

**Is it free?**
Yes, and open source.

## How it works (for developers)

1. Parse the PDF with pdf-lib and pick the large page content streams and form XObjects.
2. Inflate each stream and run a single-pass lexer over it. Everything that isn't a filled path is copied byte for byte.
3. For each filled path (one pen stroke): flatten the Bézier curves, merge all overlapping shapes with the same fill rule the PDF uses (Clipper2), simplify the outline (Douglas–Peucker, 0.02 pt) and write it back with two decimals.
4. Deflate and write the new PDF. A stream is only replaced if it actually got smaller.

Streams are processed in parallel Web Workers.

```
src/content.js       content-stream lexer and rewriter
src/geometry.js      flatten → merge → simplify for one stroke
src/stream.js        inflate → rewrite → deflate for one stream
src/pdf.js           PDF-level orchestration
src/runner.js        Web Worker pool
src/app.js           UI
web/template.html    markup and styles
build.mjs            bundles everything into dist/index.html
```

### Run it locally

```sh
npm install
npm run build                     # → dist/index.html, open it in a browser
npm run shrink -- in.pdf out.pdf  # shrink a file from the command line
node scripts/make-images.cjs      # regenerate the preview image and icon (needs playwright)
```

## Contributing

Found a GoodNotes PDF that doesn't shrink or comes out wrong? Please open an issue. If you can, attach the file or describe which pens and features (highlighter, shapes, images) it uses.

## Credits

Built with [pdf-lib](https://github.com/Hopding/pdf-lib), [Clipper2](https://www.npmjs.com/package/clipper2-ts), [fflate](https://github.com/101arrowz/fflate) and [esbuild](https://esbuild.github.io). Fonts: [Shantell Sans](https://github.com/arrowtype/shantell-sans) and [DM Mono](https://github.com/googlefonts/dm-mono) (SIL Open Font License).

## License

MIT

ShrinkNotes is an independent project and is not affiliated with GoodNotes.
