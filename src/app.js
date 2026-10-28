// UI: pick one or more PDFs, shrink them locally, offer the results.
import { zipSync } from 'fflate';
import { shrinkPdf } from './pdf.js';
import { createRunner } from './runner.js';

const $ = (id) => document.getElementById(id);
const fmtMB = (b) => (b / 1e6).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' MB';
const fmtSec = (ms) => (ms / 1000).toLocaleString('en-US', { maximumFractionDigits: ms < 10000 ? 1 : 0 }) + ' s';
const pctSmaller = (before, after) => Math.round((1 - after / before) * 100) + '% smaller';
const smallName = (name) => name.replace(/\.pdf$/i, '') + ' (small).pdf';
const isPdf = (f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf';

const MSG_NOT_PDF = "That's not a PDF. Export your notebook from GoodNotes as a PDF and pick that file.";
const MSG_NOTHING = "Nothing to shrink here. ShrinkNotes is made for handwritten GoodNotes notes, and this PDF doesn't seem to contain any.";
const MSG_UNREADABLE = "This file couldn't be read. Is it an unchanged PDF export from GoodNotes?";

let downloadsCap = null;
if (window.claude && typeof window.claude.use === 'function') {
  window.claude.use('downloads').then((d) => { downloadsCap = d; }).catch(() => {});
}

let busy = false;
let single = null;          // { bytes, name } for the one-file view
let results = [];           // [{ bytes, name }] for the several-files view

class ShrinkError extends Error {}

/** Shrink one File. onProgress(frac 0..1, label?). Returns { out, totals, ms }. */
async function shrinkFile(file, onProgress) {
  const t0 = performance.now();
  let runner = null;
  const weights = [], done = [];
  const report = () => {
    let s = 0, t = 0;
    for (let i = 0; i < weights.length; i++) { s += weights[i] * (done[i] || 0); t += weights[i]; }
    onProgress(0.04 + 0.92 * s / (t || 1));
  };
  try {
    onProgress(0.01, 'Reading file…');
    const bytes = new Uint8Array(await file.arrayBuffer());
    onProgress(0.03, 'Looking inside…');
    await new Promise((r) => setTimeout(r, 20));
    const { bytes: out, totals } = await shrinkPdf(bytes, (raw, id) => runner.run(raw, id), (e) => {
      if (e.type === 'plan') {
        e.streams.forEach((size, i) => { weights[i] = size; done[i] = 0; });
        runner = createRunner(e.streams.length, (id, f) => { done[id] = f * 0.85; report(); });
        onProgress(0.04, 'Merging pen strokes…');
      } else if (e.type === 'done' || e.type === 'skip') {
        done[e.id] = 1; report();
      } else if (e.type === 'saving') {
        onProgress(0.97, 'Writing the new PDF…');
      }
    });
    if (totals.replaced === 0 || out.length >= file.size) throw new ShrinkError(MSG_NOTHING);
    return { out, totals, ms: performance.now() - t0 };
  } catch (err) {
    if (err instanceof ShrinkError) throw err;
    console.error(err);
    throw new ShrinkError(MSG_UNREADABLE);
  } finally {
    if (runner) runner.close();
  }
}

// ---------- views

function show(view) {
  for (const v of ['view-idle', 'view-work', 'view-done', 'view-multi', 'view-error']) $(v).hidden = v !== view;
}

// For PDFs without handwriting, point to a general-purpose compressor (also runs in the browser).
const OTHER_COMPRESSOR = 'https://opentoolkit.github.io/CompressPDF/';

function fail(msg) {
  const el = $('error-msg');
  el.textContent = msg;
  if (msg === MSG_NOTHING) {
    const a = document.createElement('a');
    a.href = OTHER_COMPRESSOR; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'a general PDF compressor';
    el.append(' For other PDFs, try ', a, '.');
  }
  show('view-error');
}

// the pen line is revealed left to right by widening its clip rectangle (viewBox is 400 wide)
function drawLine(rect, frac) {
  const pct = Math.max(0, Math.min(100, Math.round(frac * 100)));
  rect.setAttribute('width', String(pct === 0 ? 0 : 6 + pct * 4.06));
  return pct;
}

// ---------- one file

async function handleOne(file) {
  if (!isPdf(file)) { fail(MSG_NOT_PDF); return; }
  $('work-name').textContent = `${file.name} · ${fmtMB(file.size)}`;
  show('view-work');
  try {
    const { out, ms } = await shrinkFile(file, (frac, label) => {
      const pct = drawLine($('bar-fill'), frac);
      $('bar').setAttribute('aria-valuenow', String(pct));
      $('pct').textContent = pct + '%';
      if (label) $('phase').textContent = label;
    });
    single = { bytes: out, name: smallName(file.name) };
    $('done-name').textContent = file.name;
    $('done-before').textContent = fmtMB(file.size);
    $('done-after').textContent = fmtMB(out.length);
    $('done-saving').textContent = pctSmaller(file.size, out.length);
    $('done-detail').textContent = `in ${fmtSec(ms)}`;
    $('save-note').textContent = '';
    show('view-done');
    $('save').focus();
  } catch (err) {
    fail(err.message);
  }
}

// ---------- several files (processed one after another to keep memory low on iPads)

let rowSeq = 0;
function makeRow(file) {
  const li = $('row-tpl').content.firstElementChild.cloneNode(true);
  const clipId = 'row-clip-' + (++rowSeq);
  li.querySelector('clipPath').id = clipId;
  li.querySelector('.ink').setAttribute('clip-path', `url(#${clipId})`);
  li.querySelector('.row-name').textContent = file.name;
  $('multi-list').appendChild(li);
  return {
    li,
    rect: li.querySelector('rect'),
    info: li.querySelector('.row-info'),
    set(state, text) { li.dataset.state = state; if (text !== undefined) this.info.textContent = text; },
  };
}

async function handleMany(files) {
  results = [];
  $('multi-list').textContent = '';
  $('multi-sum').hidden = true;
  $('save-all').hidden = true;
  $('again-multi').hidden = true;
  $('multi-note').textContent = '';
  show('view-multi');

  const rows = files.map((f) => ({ file: f, row: makeRow(f) }));
  let before = 0, after = 0;
  for (const { file, row } of rows) {
    if (!isPdf(file)) { row.set('error', 'Not a PDF, skipped'); continue; }
    row.set('working', fmtMB(file.size));
    try {
      const { out } = await shrinkFile(file, (frac) => drawLine(row.rect, frac));
      const name = smallName(file.name);
      results.push({ bytes: out, name });
      before += file.size; after += out.length;
      row.set('done', `${fmtMB(file.size)} → ${fmtMB(out.length)}`);
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'link row-save'; btn.textContent = 'Save';
      btn.addEventListener('click', () => saveFile(out, name, 'application/pdf', $('multi-note')));
      row.li.querySelector('.row-top').appendChild(btn);
    } catch (err) {
      row.set('error', err.message === MSG_NOTHING ? 'Nothing to shrink, skipped' : "Couldn't read this file");
    }
  }

  $('again-multi').hidden = false;
  if (results.length) {
    $('multi-sum').innerHTML = '';
    const hl = document.createElement('span');
    hl.className = 'hl';
    hl.textContent = `${fmtMB(before)} → ${fmtMB(after)}`;
    $('multi-sum').append(hl, ` · ${pctSmaller(before, after)}`);
    $('multi-sum').hidden = false;
    $('save-all').hidden = false;
    $('save-all').focus();
  }
}

async function saveAll() {
  if (!results.length) return;
  const entries = {};
  for (const r of results) {
    let name = r.name, n = 2;
    while (entries[name]) name = r.name.replace(/\.pdf$/i, ` ${n++}.pdf`);
    entries[name] = [r.bytes, { level: 0 }];   // PDFs are already compressed; just store them
  }
  const zip = zipSync(entries);
  await saveFile(zip, 'ShrinkNotes.zip', 'application/zip', $('multi-note'));
}

// ---------- saving

async function saveFile(bytes, name, type, noteEl) {
  const blob = new Blob([bytes], { type });
  if (downloadsCap) {
    try {
      await downloadsCap.save({ filename: name, data: blob });
      noteEl.textContent = 'Saved.';
    } catch (e) {
      noteEl.textContent = e && e.code === 'declined' ? 'Not saved.' : "Saving didn't work here.";
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ---------- entry

async function handle(fileList) {
  const files = [...(fileList || [])];
  if (busy || files.length === 0) return;
  busy = true;
  try {
    if (files.length === 1) await handleOne(files[0]);
    else await handleMany(files);
  } finally {
    busy = false;
  }
}

function reset() {
  single = null; results = [];
  $('file').value = '';
  show('view-idle');
}

$('file').addEventListener('change', (e) => handle(e.target.files));
$('save').addEventListener('click', () => single && saveFile(single.bytes, single.name, 'application/pdf', $('save-note')));
$('again').addEventListener('click', reset);
$('again-multi').addEventListener('click', reset);
$('save-all').addEventListener('click', saveAll);
$('retry').addEventListener('click', reset);

const sheet = $('sheet');
['dragenter', 'dragover'].forEach((t) => sheet.addEventListener(t, (e) => { e.preventDefault(); sheet.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => sheet.addEventListener(t, (e) => { e.preventDefault(); sheet.classList.remove('over'); }));
sheet.addEventListener('drop', (e) => handle(e.dataTransfer.files));
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());
