// FAQ shown on the page, in structured data (FAQPage) and in llms.txt. Plain text only.
export const FAQ = [
  {
    q: 'How do I make a GoodNotes PDF smaller?',
    a: 'Export your notebook or pages from GoodNotes as a PDF, open ShrinkNotes, drop the PDF onto the page and save the smaller file. Handwritten notes typically shrink by around 90%; in our tests a 116 MB export became 9.8 MB.',
  },
  {
    q: 'Why are GoodNotes PDF exports so large?',
    a: 'GoodNotes exports every pen stroke as a chain of tiny overlapping shapes, roughly one for every point your pencil recorded. Two pages of handwriting can contain over 300,000 of them, which adds up to tens of megabytes.',
  },
  {
    q: 'Will my handwriting get blurry?',
    a: 'No. Most PDF compressors turn pages into images, which makes handwriting blurry when you zoom in. ShrinkNotes merges the tiny shapes of each stroke into one clean outline, so the result is still vector and looks the same at any zoom.',
  },
  {
    q: 'Is it safe to use with private notes?',
    a: 'Yes. The PDF is processed entirely in your browser and never uploaded to any server.',
  },
  {
    q: 'Can I shrink several PDFs at once?',
    a: 'Yes. Select or drop several PDFs together. They are processed one after another, and you can save each file on its own or all of them as one ZIP.',
  },
  {
    q: 'Does it work on iPad?',
    a: 'Yes, it runs in Safari on iPad and iPhone and in any current browser on Mac, Windows and Linux. Very large files can hit the memory limit of older iPads; use a computer for those.',
  },
  {
    q: 'Does it work with Notability, OneNote or other apps?',
    a: 'ShrinkNotes is built for GoodNotes exports. PDFs from other apps may shrink too if they store handwriting the same way; if not, the file is left unchanged.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. No account, no upload limits, no watermark.',
  },
];
