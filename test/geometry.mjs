// Regression test: a stroke with coarsely rounded coordinates that used to send
// clipper2-ts into an endless loop (tab crashed with "out of memory").
// Run: node test/geometry.mjs   (fails if the union does not finish within 5 s)
import { readFileSync } from 'node:fs';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { unionStroke } from '../src/geometry.js';

if (isMainThread) {
  const w = new Worker(new URL(import.meta.url), { resourceLimits: { maxOldGenerationSizeMb: 256 } });
  const timer = setTimeout(() => { console.error('FAIL: union did not finish in 5 s'); w.terminate(); process.exitCode = 1; }, 5000);
  w.on('message', (m) => { clearTimeout(timer); console.log(`ok: ${m.rings} ring(s) in ${m.ms} ms`); w.terminate(); });
  w.on('error', (e) => { clearTimeout(timer); console.error('FAIL:', e.message); process.exitCode = 1; });
} else {
  const { ops, nums, evenOdd } = JSON.parse(readFileSync(new URL('./fixtures/clipper-hang-path.json', import.meta.url)));
  const t = performance.now();
  const rings = unionStroke(ops, nums, evenOdd);
  parentPort.postMessage({ rings: rings ? rings.length : 0, ms: Math.round(performance.now() - t) });
}
