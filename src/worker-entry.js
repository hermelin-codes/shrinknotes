// Web Worker: shrinks one content stream per message.
import { shrinkStream } from './stream.js';

self.onmessage = (e) => {
  const { id, raw } = e.data;
  try {
    const res = shrinkStream(raw, (frac) => self.postMessage({ type: 'progress', id, frac }));
    if (!res) { self.postMessage({ type: 'result', id, res: null }); return; }
    self.postMessage({ type: 'result', id, res }, [res.data.buffer]);
  } catch (err) {
    self.postMessage({ type: 'result', id, res: null, error: String(err && err.message || err) });
  }
};
