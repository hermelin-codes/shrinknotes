// Content-stream rewriter. Everything that is not a filled path is copied
// byte-for-byte; filled paths are replaced by their merged outline.
import { unionStroke } from './geometry.js';

const WS = new Uint8Array(256);
for (const c of [0, 9, 10, 12, 13, 32]) WS[c] = 1;
const DELIM = new Uint8Array(256);
for (const c of '()<>[]{}/%') DELIM[c.charCodeAt(0)] = 1;

const OP_M = 0, OP_L = 1, OP_C = 2, OP_V = 3, OP_Y = 4, OP_H = 5;
const PATH_ARITY = { m: 2, l: 2, c: 6, v: 4, y: 4, h: 0 };
const PATH_CODE = { m: OP_M, l: OP_L, c: OP_C, v: OP_V, y: OP_Y, h: OP_H };

class Writer {
  constructor(cap) { this.buf = new Uint8Array(cap); this.len = 0; }
  ensure(n) {
    if (this.len + n <= this.buf.length) return;
    let cap = this.buf.length * 2;
    while (cap < this.len + n) cap *= 2;
    const nb = new Uint8Array(cap); nb.set(this.buf.subarray(0, this.len)); this.buf = nb;
  }
  bytes(src, a, b) { this.ensure(b - a); this.buf.set(src.subarray(a, b), this.len); this.len += b - a; }
  byte(c) { this.ensure(1); this.buf[this.len++] = c; }
  ascii(s) { this.ensure(s.length); for (let i = 0; i < s.length; i++) this.buf[this.len++] = s.charCodeAt(i); }
  // number with 2 decimals, shortest form: 12.5 → "12.5", 0.25 → ".25", -0 → "0"
  num(x) {
    this.ensure(24);
    let v = Math.round(x * 100);
    if (v === 0) { this.buf[this.len++] = 48; return; }
    if (v < 0) { this.buf[this.len++] = 45; v = -v; }
    const ip = Math.floor(v / 100), fp = v - ip * 100;
    if (ip > 0) { const s = String(ip); for (let i = 0; i < s.length; i++) this.buf[this.len++] = s.charCodeAt(i); }
    if (fp > 0) {
      this.buf[this.len++] = 46;
      this.buf[this.len++] = 48 + Math.floor(fp / 10);
      if (fp % 10) this.buf[this.len++] = 48 + (fp % 10);
    }
  }
  result() { return this.buf.subarray(0, this.len); }
}

/**
 * Rewrite one decoded content stream.
 * Returns { data: Uint8Array, stats } or null when the stream must stay untouched.
 */
export function rewriteContent(src, onProgress) {
  const n = src.length;
  const out = new Writer(Math.max(1024, n >> 3));
  const stats = { paths: 0, merged: 0, subpaths: 0 };

  // operand stack (numbers only; non-numeric operands set a flag)
  const nums = new Float64Array(64);
  let nOps = 0, complexOperand = false;

  // current path
  let pathStart = -1;              // byte offset where the path started
  let pathOps = [], pathNums = [];
  let pathOk = true, clip = false;

  let opStart = 0;                 // start of operands of the current operator
  let i = 0;
  let nextReport = 1 << 22;

  const resetPath = () => { pathStart = -1; pathOps = []; pathNums = []; pathOk = true; clip = false; };

  while (i < n) {
    const c = src[i];
    if (WS[c]) { i++; continue; }
    if (i >= nextReport && onProgress) { onProgress(i / n); nextReport = i + (1 << 22); }

    if (c === 37) {                                   // % comment
      while (i < n && src[i] !== 10 && src[i] !== 13) i++;
      continue;
    }
    // ---- numbers
    if ((c >= 48 && c <= 57) || c === 45 || c === 43 || c === 46) {
      let j = i, neg = false;
      if (c === 45) { neg = true; j++; } else if (c === 43) j++;
      let v = 0, scale = 0, any = false;
      while (j < n) {
        const d = src[j];
        if (d >= 48 && d <= 57) { v = v * 10 + (d - 48); if (scale) scale *= 10; any = true; j++; }
        else if (d === 46 && !scale) { scale = 1; j++; }
        else break;
      }
      if (!any) return null;                         // malformed – don't touch
      if (nOps < 64) nums[nOps] = (neg ? -v : v) / (scale || 1);
      nOps++;
      i = j;
      continue;
    }
    // ---- other operand types: skip them correctly, mark operands as complex
    if (c === 47) {                                   // /Name
      i++; while (i < n && !WS[src[i]] && !DELIM[src[i]]) i++;
      complexOperand = true; nOps++; continue;
    }
    if (c === 40) {                                   // (string)
      let depth = 1; i++;
      while (i < n && depth) {
        const d = src[i];
        if (d === 92) i += 2;
        else { if (d === 40) depth++; else if (d === 41) depth--; i++; }
      }
      complexOperand = true; nOps++; continue;
    }
    if (c === 60 && src[i + 1] !== 60) {              // <hex>
      while (i < n && src[i] !== 62) i++;
      i++; complexOperand = true; nOps++; continue;
    }
    if (c === 60 || c === 62 || c === 91 || c === 93) { // << >> [ ]
      i += (c === 60 || c === 62) ? 2 : 1;
      complexOperand = true; nOps++; continue;
    }
    // ---- operator
    let j = i;
    while (j < n && !WS[src[j]] && !DELIM[src[j]]) j++;
    if (j === i) { i++; continue; }                   // stray delimiter, e.g. ) or {
    const len = j - i;
    let op;
    if (len === 1) op = String.fromCharCode(c);
    else if (len === 2) op = String.fromCharCode(c, src[i + 1]);
    else op = String.fromCharCode.apply(null, src.subarray(i, Math.min(j, i + 8)));
    if (op === 'BI') return null;                     // inline images: leave stream untouched
    i = j;

    const arity = PATH_ARITY[op];
    if (arity !== undefined && len <= 1) {
      if (pathStart < 0) pathStart = opStart;
      if (nOps !== arity || complexOperand) pathOk = false;
      else {
        pathOps.push(PATH_CODE[op]);
        for (let k = 0; k < arity; k++) pathNums.push(nums[k]);
      }
    } else if (op === 're') {
      if (pathStart < 0) pathStart = opStart;
      pathOk = false;                                 // rectangles: keep path verbatim
    } else if (op === 'W' || op === 'W*') {
      if (pathStart < 0) pathStart = opStart;
      clip = true;
    } else if (pathStart >= 0) {
      // path-painting operator (or anything else) ends the path
      const fill = op === 'f' || op === 'F' || op === 'f*';
      let done = false;
      if (fill && pathOk && !clip && pathOps.length) {
        stats.paths++;
        const rings = unionStroke(pathOps, pathNums, op === 'f*');
        if (rings) {
          let sub = 0;
          for (const o of pathOps) if (o === OP_M) sub++;
          stats.subpaths += sub;
          stats.merged++;
          for (const r of rings) {
            out.byte(10);
            out.num(r[0]); out.byte(32); out.num(r[1]); out.ascii(' m');
            let px = Math.round(r[0] * 100), py = Math.round(r[1] * 100);
            for (let k = 2; k < r.length; k += 2) {
              const qx = Math.round(r[k] * 100), qy = Math.round(r[k + 1] * 100);
              if (qx === px && qy === py) continue;   // collapsed by rounding
              px = qx; py = qy;
              out.byte(10); out.num(r[k]); out.byte(32); out.num(r[k + 1]); out.ascii(' l');
            }
            out.ascii(' h');
          }
          out.byte(10);
          out.ascii(op === 'f*' ? 'f*' : 'f');      // Clipper output is valid for both rules
          done = true;
        }
      }
      if (!done) out.bytes(src, pathStart, i);
      resetPath();
    } else {
      out.bytes(src, opStart, i);
    }
    nOps = 0; complexOperand = false;
    opStart = i;
  }
  if (pathStart >= 0) out.bytes(src, pathStart, n);
  else if (opStart < n) out.bytes(src, opStart, n);
  return { data: out.result(), stats };
}
