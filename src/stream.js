// Shrink one compressed content stream: inflate → rewrite → deflate.
// Pure function, used both in Web Workers and on the main thread / in Node.
import { unzlibSync, inflateSync, zlibSync } from 'fflate';
import { rewriteContent } from './content.js';

export function shrinkStream(raw, onProgress) {
  let decoded;
  try { decoded = unzlibSync(raw); } catch { try { decoded = inflateSync(raw); } catch { return null; } }
  const res = rewriteContent(decoded, onProgress);
  if (!res) return null;
  const packed = zlibSync(res.data, { level: 9, mem: 9 });
  if (packed.length >= raw.length) return null;      // never make things bigger
  return { data: packed, stats: res.stats, decodedIn: decoded.length, decodedOut: res.data.length };
}
