// Runs stream jobs on a pool of Web Workers (falls back to the main thread).
import { shrinkStream } from './stream.js';

/* global __WORKER_SOURCE__ */

function poolSize(jobCount) {
  const cores = navigator.hardwareConcurrency || 2;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  const cap = iOS ? 2 : 4;            // Safari on iPad has a tight per-tab memory budget
  return Math.max(1, Math.min(jobCount, cap, Math.max(1, cores - 1)));
}

export function createRunner(jobCount, onProgress) {
  let workers = [];
  let url = null;
  try {
    url = URL.createObjectURL(new Blob([__WORKER_SOURCE__], { type: 'text/javascript' }));
    const n = poolSize(jobCount);
    for (let i = 0; i < n; i++) workers.push(new Worker(url));
  } catch {
    for (const w of workers) w.terminate();
    workers = [];
  }
  const revoke = () => { if (url) URL.revokeObjectURL(url); url = null; };

  if (workers.length === 0) {
    revoke();
    // Main-thread fallback: one stream at a time, yielding so the UI can paint.
    let chain = Promise.resolve();
    return {
      threads: 0,
      run: (raw, id) => (chain = chain.then(async () => {
        await new Promise((r) => setTimeout(r, 30));
        return shrinkStream(raw, (f) => onProgress(id, f));
      })),
      close() {},
    };
  }

  const queue = [];
  const idle = [...workers];
  const pending = new Map();
  const pump = () => {
    while (idle.length && queue.length) {
      const w = idle.pop();
      const job = queue.shift();
      // copy the stream bytes only now, so the transfer does not detach pdf-lib's
      // buffer and only the streams being worked on are held twice in memory
      const raw = job.raw.slice();
      job.raw = null;
      w.postMessage({ id: job.id, raw }, [raw.buffer]);
      w._job = job;
    }
  };
  for (const w of workers) {
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'progress') { onProgress(m.id, m.frac); return; }
      pending.get(m.id)(m.res);
      pending.delete(m.id);
      idle.push(w);
      pump();
    };
    w.onerror = (e) => {
      e.preventDefault();
      const job = w._job;
      if (job && pending.has(job.id)) { pending.get(job.id)(null); pending.delete(job.id); }
      idle.push(w); pump();
    };
  }
  return {
    threads: workers.length,
    run: (raw, id) => new Promise((resolve) => { pending.set(id, resolve); queue.push({ id, raw }); pump(); }),
    close() { for (const w of workers) w.terminate(); revoke(); },
  };
}
