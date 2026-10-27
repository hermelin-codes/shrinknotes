// Node test harness: node test/cli.mjs in.pdf out.pdf  (runs streams in parallel worker_threads)
import { readFileSync, writeFileSync } from 'node:fs';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { shrinkStream } from '../src/stream.js';
import { shrinkPdf } from '../src/pdf.js';

if (!isMainThread) {
  parentPort.on('message', ({ raw, id }) => {
    const t = performance.now();
    const res = shrinkStream(raw);
    parentPort.postMessage({ id, res, ms: performance.now() - t });
  });
} else {
  const [inp, outp] = process.argv.slice(2);
  const t0 = performance.now();
  const n = Math.max(1, Math.min(4, availableParallelism() - 1));
  const workers = Array.from({ length: n }, () => new Worker(new URL(import.meta.url)));
  const waiting = new Map(); let rr = 0;
  for (const w of workers) w.on('message', (m) => { console.log(`  stream ${m.id}: ${m.ms.toFixed(0)} ms`); waiting.get(m.id)(m.res); });
  const runJob = (raw, id) => new Promise((resolve) => { waiting.set(id, resolve); workers[rr++ % n].postMessage({ raw, id }); });
  const input = readFileSync(inp);
  const { bytes, totals } = await shrinkPdf(new Uint8Array(input), runJob, (e) => { if (e.type === 'plan') console.log('plan', e); });
  writeFileSync(outp, bytes);
  for (const w of workers) w.terminate();
  console.log(`${(input.length / 1e6).toFixed(1)} MB -> ${(bytes.length / 1e6).toFixed(1)} MB in ${((performance.now() - t0) / 1000).toFixed(1)} s`, totals, `workers=${n}`);
}
