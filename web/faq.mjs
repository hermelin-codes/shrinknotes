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
      a: 'Nein. Die meisten PDF-Kompressoren machen aus den Seiten Bilder, und dann wird die Handschrift beim Reinzoomen unscharf. ShrinkNotes fügt die winzigen Formen jedes Strichs zu einer sauberen Kontur zusammen. Das Ergebnis bleibt Vektorgrafik und sieht bei jedem Zoom gleich aus.',
    },
    {
      q: 'Was ist anders als bei Smallpdf, iLovePDF oder Adobe Acrobat?',
      a: 'Smallpdf, iLovePDF, der Online-Kompressor von Adobe Acrobat und der Filter „Dateigröße reduzieren“ in der Vorschau-App auf dem Mac sind Allzweck-Tools. Sie machen PDFs vor allem kleiner, indem sie eingebettete Fotos und Bilder neu komprimieren. GoodNotes speichert Handschrift aber nicht als Bilder, sondern als Hunderttausende winzige Vektorformen. Diese Tools verkleinern die Datei deshalb kaum oder machen aus den Seiten Bilder, und dann wird die Handschrift beim Reinzoomen unscharf. ShrinkNotes ist genau für diesen Fall gebaut: Es fügt die Formen jedes Strichs zu einer sauberen Kontur zusammen. Die Datei wird so meist rund 90 % kleiner und bleibt scharf. Anders als bei den Online-Diensten wird deine Datei nie hochgeladen, und es gibt keine Nutzungslimits oder kostenpflichtigen Kompressionsstufen.',
    },
    {
      q: 'Kann ich das bedenkenlos mit privaten Notizen nutzen?',
      a: 'Ja. Die PDF wird komplett in deinem Browser verarbeitet und nie auf einen Server hochgeladen.',
    },
    {
      q: 'Kann ich mehrere PDFs auf einmal verkleinern?',
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
  ],
};
