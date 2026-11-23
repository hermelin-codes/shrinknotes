// FAQ of the start page per language, shown on the page, in structured data (FAQPage) and in llms.txt. Plain text only.
export const FAQ = {
  en: [
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
      q: 'How is ShrinkNotes different from Smallpdf, iLovePDF or Adobe Acrobat?',
      a: 'Smallpdf, iLovePDF, the Adobe Acrobat online compressor and the "Reduce File Size" filter in Apple Preview are general-purpose tools. They mainly shrink PDFs by re-compressing embedded photos and images. GoodNotes handwriting is not stored as images but as hundreds of thousands of tiny vector shapes, so these tools either barely reduce the file or turn pages into images, which makes handwriting blurry when you zoom in. ShrinkNotes is built for exactly this case: it merges the shapes of each pen stroke into one clean outline, so the file typically gets around 90% smaller and stays sharp. Unlike the online services, your file is never uploaded, and there are no usage limits or paid compression levels.',
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
    {
      q: 'How it works (for techies)',
      a: 'ShrinkNotes never touches pixels. It parses the PDF with pdf-lib, picks the large page content streams and form XObjects (Flate-only, at least 64 KB), inflates them with fflate and rewrites the decoded operator stream in a single pass with a custom lexer. Everything that is not a filled path (text, images, clip paths, rectangles) is copied byte for byte, and streams with inline images are left alone. GoodNotes draws each pen stroke as one path of many tiny overlapping subpaths, so for every fill operator the subpaths are collected, Bézier segments are flattened to polylines (Wang\'s formula, 0.006 pt tolerance), snapped to an integer grid of 0.001 pt (repeated and collinear points are dropped first, which also protects Clipper2 from an endless loop on coarsely rounded coordinates) and merged with a Clipper2 polygon union that uses the same fill rule as the original operator (nonzero or even-odd). The resulting outline is thinned out with Douglas-Peucker at 0.02 pt, written back as m/l/h/f operators with two decimals and deflated at level 9. A stream is only replaced if the result is actually smaller, and anything the lexer cannot parse cleanly stays untouched. The only loss is that 0.02 pt geometric tolerance: in 600 dpi comparisons, pages differ from the original in just a few dozen edge pixels. The streams are processed largest first, in parallel in a pool of Web Workers (up to 4, 2 on iOS, with a main-thread fallback) with transferable buffers, so everything stays in your browser. The code is MIT licensed and on GitHub: github.com/hermelin-codes/shrinknotes',
    },
  ],
  de: [
    {
      q: 'Wie mache ich eine GoodNotes-PDF kleiner?',
      a: 'Exportiere dein Notizbuch oder einzelne Seiten in GoodNotes als PDF, öffne ShrinkNotes, zieh die PDF auf die Seite und speichere die kleinere Datei. Handschriftliche Notizen werden meist rund 90 % kleiner. In unseren Tests wurde aus einem 116 MB großen Export eine Datei mit 9,8 MB.',
    },
    {
      q: 'Warum sind GoodNotes-PDFs so groß?',
      a: 'GoodNotes exportiert jeden Strich als Kette aus winzigen, überlappenden Formen, ungefähr eine für jeden Punkt, den dein Stift aufgezeichnet hat. Zwei Seiten Handschrift können über 300.000 davon enthalten. Das sind schnell mehrere Dutzend Megabyte.',
    },
    {
      q: 'Wird meine Handschrift unscharf?',
      a: 'Nein. Die meisten PDF-Kompressoren machen aus den Seiten Bilder, und dann wird die Handschrift beim Reinzoomen unscharf. ShrinkNotes setzt die winzigen Formen jedes Strichs wieder zu einer Linie zusammen. Das Ergebnis bleibt Vektorgrafik und sieht bei jedem Zoom gleich aus.',
    },
    {
      q: 'Was ist anders als bei Smallpdf, iLovePDF oder Adobe Acrobat?',
      a: 'Smallpdf, iLovePDF, der Online-Kompressor von Adobe Acrobat und der Filter „Dateigröße reduzieren“ in der Vorschau-App auf dem Mac sind Allzweck-Tools. Sie machen PDFs vor allem kleiner, indem sie eingebettete Fotos und Bilder neu komprimieren. GoodNotes speichert Handschrift aber nicht als Bilder, sondern als Hunderttausende winzige Vektorformen. Diese Tools komprimieren die Datei deshalb kaum oder machen aus den Seiten Bilder, und dann wird die Handschrift beim Reinzoomen unscharf. ShrinkNotes ist genau für diesen Fall gebaut: Es setzt die Formen jedes Strichs wieder zu einer Linie zusammen. Die Datei wird so meist rund 90 % kleiner und bleibt scharf. Anders als bei den Online-Diensten wird deine Datei nie hochgeladen, und es gibt keine Nutzungslimits oder kostenpflichtigen Kompressionsstufen.',
    },
    {
      q: 'Kann ich das bedenkenlos mit privaten Notizen nutzen?',
      a: 'Ja. Die PDF wird komplett in deinem Browser verarbeitet und nie auf einen Server hochgeladen.',
    },
    {
      q: 'Kann ich mehrere PDFs auf einmal komprimieren?',
      a: 'Ja. Wähle mehrere PDFs aus oder zieh sie zusammen rein. Sie werden nacheinander verarbeitet, und du kannst jede Datei einzeln oder alle zusammen als ZIP speichern.',
    },
    {
      q: 'Funktioniert das auf dem iPad?',
      a: 'Ja, in Safari auf iPad und iPhone und in jedem aktuellen Browser auf Mac, Windows und Linux. Sehr große Dateien können auf älteren iPads an die Speichergrenze stoßen. Nimm dafür besser einen Computer.',
    },
    {
      q: 'Funktioniert das auch mit Notability, OneNote oder anderen Apps?',
      a: 'ShrinkNotes ist für GoodNotes-Exporte gebaut. PDFs aus anderen Apps werden eventuell auch kleiner, wenn sie Handschrift genauso speichern. Wenn nicht, bleibt die Datei unverändert.',
    },
    {
      q: 'Ist das kostenlos?',
      a: 'Ja. Kein Konto, keine Upload-Grenze, kein Wasserzeichen.',
    },
    {
      q: 'Wie funktioniert das? (für Techies)',
      a: 'ShrinkNotes fasst nie Pixel an. Es parst die PDF mit pdf-lib, wählt die großen Seiten-Content-Streams und Form-XObjects aus (nur Flate, mindestens 64 KB), entpackt sie mit fflate und schreibt den dekodierten Operatorstrom in einem Durchlauf mit einem eigenen Lexer um. Alles, was kein gefüllter Pfad ist (Text, Bilder, Clip-Pfade, Rechtecke), wird Byte für Byte übernommen, und Streams mit Inline-Bildern bleiben unangetastet. GoodNotes zeichnet jeden Strich als einen Pfad aus vielen winzigen, überlappenden Subpfaden. Bei jedem Fill-Operator werden deshalb die Subpfade gesammelt, Bézier-Segmente zu Polylinien abgeflacht (Wang-Formel, 0,006 pt Toleranz), auf ein ganzzahliges Raster von 0,001 pt gerundet (doppelte und kollineare Punkte fallen vorher raus, das schützt Clipper2 auch vor einer Endlosschleife bei grob gerundeten Koordinaten) und per Clipper2-Polygonvereinigung zusammengeführt, mit derselben Füllregel wie der ursprüngliche Operator (Nonzero oder Even-Odd). Die entstandene Kontur wird mit Douglas-Peucker bei 0,02 pt ausgedünnt, als m/l/h/f-Operatoren mit zwei Nachkommastellen zurückgeschrieben und mit Level 9 wieder gepackt. Ein Stream wird nur ersetzt, wenn das Ergebnis wirklich kleiner ist, und alles, was der Lexer nicht sauber lesen kann, bleibt unangetastet. Verlust entsteht nur durch diese 0,02 pt geometrische Toleranz: Im Vergleich bei 600 dpi unterscheiden sich die Seiten vom Original nur in ein paar Dutzend Randpixeln. Die Streams laufen, der größte zuerst, parallel in einem Pool aus Web Workern (bis zu 4, auf iOS 2, mit Fallback auf den Hauptthread) mit übertragbaren Buffern, alles bleibt also in deinem Browser. Der Code steht unter MIT-Lizenz auf GitHub: github.com/hermelin-codes/shrinknotes',
    },
  ],
};
