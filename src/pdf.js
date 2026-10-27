// PDF-level orchestration: find the big ink content streams, shrink them
// (via a pluggable `runJob`, e.g. a worker pool), and write the new file.
import { PDFDocument, PDFName, PDFRawStream, PDFArray, PDFRef, PDFDict } from 'pdf-lib';

const MIN_STREAM_BYTES = 64 * 1024;

function isFlateOnly(dict) {
  const f = dict.get(PDFName.of('Filter'));
  if (!f) return false;
  if (f instanceof PDFName) return f === PDFName.of('FlateDecode');
  if (f instanceof PDFArray) return f.size() === 1 && f.get(0) === PDFName.of('FlateDecode');
  return false;
}

/** Collect refs of streams that are page content streams or form XObjects. */
function contentStreamRefs(doc) {
  const ctx = doc.context;
  const refs = new Set();
  const addContents = (c) => {
    if (c instanceof PDFRef) {
      const o = ctx.lookup(c);
      if (o instanceof PDFArray) for (let i = 0; i < o.size(); i++) addContents(o.get(i));
      else refs.add(c.toString());
    } else if (c instanceof PDFArray) for (let i = 0; i < c.size(); i++) addContents(c.get(i));
  };
  for (const page of doc.getPages()) addContents(page.node.get(PDFName.of('Contents')));
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Form')) refs.add(ref.toString());
  }
  return refs;
}

/**
 * @param {Uint8Array} bytes  input PDF
 * @param {(raw: Uint8Array, id: number) => Promise<{data: Uint8Array, stats: object}|null>} runJob
 * @param {(info: object) => void} onEvent  progress callback
 */
export async function shrinkPdf(bytes, runJob, onEvent = () => {}) {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true, throwOnInvalidObject: false });
  const wanted = contentStreamRefs(doc);
  const jobs = [];
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream) || !wanted.has(ref.toString())) continue;
    if (obj.contents.length < MIN_STREAM_BYTES || !isFlateOnly(obj.dict)) continue;
    if (obj.dict.get(PDFName.of('DecodeParms'))) continue;
    jobs.push({ ref, obj });
  }
  jobs.sort((a, b) => b.obj.contents.length - a.obj.contents.length);   // biggest first
  onEvent({ type: 'plan', streams: jobs.map(j => j.obj.contents.length), pages: doc.getPageCount() });

  const totals = { paths: 0, merged: 0, subpaths: 0, replaced: 0 };
  await Promise.all(jobs.map(async (job, id) => {
    const res = await runJob(job.obj.contents, id);
    if (!res) { onEvent({ type: 'skip', id }); return; }
    const dict = job.obj.dict.clone(doc.context);
    dict.delete(PDFName.of('DecodeParms'));
    doc.context.assign(job.ref, PDFRawStream.of(dict, res.data));
    for (const k of ['paths', 'merged', 'subpaths']) totals[k] += res.stats[k];
    totals.replaced++;
    onEvent({ type: 'done', id, before: job.obj.contents.length, after: res.data.length });
  }));

  onEvent({ type: 'saving' });
  const out = await doc.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
  return { bytes: out, totals };
}
