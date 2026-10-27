// UI: pick a PDF, shrink it locally, offer the result.
import { shrinkPdf } from './pdf.js';
import { createRunner } from './runner.js';

const $ = (id) => document.getElementById(id);
const fmtMB = (b) => (b / 1e6).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' MB';
const fmtSec = (ms) => (ms / 1000).toLocaleString('en-US', { maximumFractionDigits: ms < 10000 ? 1 : 0 }) + ' s';

let downloadsCap = null;
if (window.claude && typeof window.claude.use === 'function') {
  window.claude.use('downloads').then((d) => { downloadsCap = d; }).catch(() => {});
}

let busy = false;
let lastResult = null;

function setProgress(frac, label) {
  const pct = Math.max(0, Math.min(100, Math.round(frac * 100)));
  $('bar-fill').style.strokeDashoffset = String(100 - pct);
  $('bar').setAttribute('aria-valuenow', String(pct));
  $('pct').textContent = pct + '%';
  if (label) $('phase').textContent = label;
}

function show(view) {
  for (const v of ['view-idle', 'view-work', 'view-done', 'view-error']) $(v).hidden = v !== view;
}

function fail(msg) {
  busy = false;
  $('error-msg').textContent = msg;
  show('view-error');
}

async function handle(file) {
  if (busy || !file) return;
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
    fail("That's not a PDF. Export your notebook from GoodNotes as a PDF and pick that file.");
    return;
  }
  busy = true;
  $('work-name').textContent = `${file.name} · ${fmtMB(file.size)}`;
  show('view-work');
  setProgress(0.01, 'Reading file…');
  const t0 = performance.now();

  let runner = null;
  const weights = [], done = [];
  const report = () => {
    let s = 0, t = 0;
    for (let i = 0; i < weights.length; i++) { s += weights[i] * (done[i] || 0); t += weights[i]; }
    setProgress(0.04 + 0.92 * s / (t || 1));
  };

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    setProgress(0.03, 'Looking inside…');
    await new Promise((r) => setTimeout(r, 20));

    const { bytes: out, totals } = await shrinkPdf(bytes, (raw, id) => runner.run(raw, id), (e) => {
      if (e.type === 'plan') {
        e.streams.forEach((size, i) => { weights[i] = size; done[i] = 0; });
        runner = createRunner(e.streams.length, (id, f) => { done[id] = f * 0.85; report(); });
        $('phase').textContent = 'Merging pen strokes…';
      } else if (e.type === 'done' || e.type === 'skip') {
        done[e.id] = 1; report();
      } else if (e.type === 'saving') {
        setProgress(0.97, 'Writing the new PDF…');
      }
    });
    if (runner) runner.close();

    if (totals.replaced === 0 || out.length >= file.size) {
      fail("Nothing to shrink here. ShrinkNotes is made for handwritten GoodNotes notes, and this PDF doesn't seem to contain any.");
      return;
    }
    const ms = performance.now() - t0;
    lastResult = { bytes: out, name: file.name.replace(/\.pdf$/i, '') + ' (small).pdf' };
    $('done-name').textContent = file.name;
    $('done-before').textContent = fmtMB(file.size);
    $('done-after').textContent = fmtMB(out.length);
    $('done-saving').textContent = Math.round((1 - out.length / file.size) * 100) + '% smaller';
    $('done-detail').textContent = `in ${fmtSec(ms)}`;
    $('save-note').textContent = '';
    show('view-done');
    $('save').focus();
  } catch (err) {
    if (runner) runner.close();
    console.error(err);
    fail("This file couldn't be read. Is it an unchanged PDF export from GoodNotes?");
  } finally {
    busy = false;
  }
}

async function save() {
  if (!lastResult) return;
  const blob = new Blob([lastResult.bytes], { type: 'application/pdf' });
  if (downloadsCap) {
    try {
      await downloadsCap.save({ filename: lastResult.name, data: blob });
      $('save-note').textContent = 'Saved.';
    } catch (e) {
      $('save-note').textContent = e && e.code === 'declined' ? 'Not saved.' : "Saving didn't work here.";
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = lastResult.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function reset() {
  lastResult = null;
  $('file').value = '';
  show('view-idle');
}

// ---- wiring
$('file').addEventListener('change', (e) => handle(e.target.files[0]));
$('save').addEventListener('click', save);
$('again').addEventListener('click', reset);
$('retry').addEventListener('click', reset);

const sheet = $('sheet');
['dragenter', 'dragover'].forEach((t) => sheet.addEventListener(t, (e) => { e.preventDefault(); sheet.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => sheet.addEventListener(t, (e) => { e.preventDefault(); sheet.classList.remove('over'); }));
sheet.addEventListener('drop', (e) => { if (!busy) handle(e.dataTransfer.files[0]); });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());
