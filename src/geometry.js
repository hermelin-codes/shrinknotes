// Geometry for one filled pen stroke: flatten Béziers, union all overlapping
// "stamp" subpaths with the PDF fill rule, simplify, and emit compact path ops.
import { union as union2, FillRule } from 'clipper2-ts';

const SCALE = 1000;             // Clipper works on integers: 0.001 user units
const FLATTEN_TOL = 0.006;       // max curve→polyline deviation (user units)
const SIMPLIFY_TOL = 0.02;      // max deviation after union (user units)
const MAX_SEGMENTS = 64;


/**
 * segs: Float64Array-like flat list produced by the lexer:
 *   op codes: 0=m(x,y) 1=l(x,y) 2=c(x1,y1,x2,y2,x3,y3) 3=v(x2,y2,x3,y3) 4=y(x1,y1,x3,y3) 5=h
 * Returns array of rings (each: flat number array [x0,y0,x1,y1,...] in user units)
 * or null if nothing fillable.
 */
export function unionStroke(ops, nums, evenOdd) {
  const paths = [];
  let path = null;
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let k = 0;
  const push = (x, y) => { path.push({ x: Math.round(x * SCALE), y: Math.round(y * SCALE) }); };
  const close = () => { if (path && path.length >= 3) paths.push(path); path = null; };

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op === 0) {
      close();
      path = [];
      cx = sx = nums[k++]; cy = sy = nums[k++];
      push(cx, cy);
    } else if (op === 5) {
      close();
      cx = sx; cy = sy;
    } else {
      if (!path) { path = []; push(cx, cy); }
      if (op === 1) {
        cx = nums[k++]; cy = nums[k++];
        push(cx, cy);
      } else {
        let x1, y1, x2, y2, x3, y3;
        if (op === 2) { x1 = nums[k++]; y1 = nums[k++]; x2 = nums[k++]; y2 = nums[k++]; x3 = nums[k++]; y3 = nums[k++]; }
        else if (op === 3) { x1 = cx; y1 = cy; x2 = nums[k++]; y2 = nums[k++]; x3 = nums[k++]; y3 = nums[k++]; }
        else { x1 = nums[k++]; y1 = nums[k++]; x3 = nums[k++]; y3 = nums[k++]; x2 = x3; y2 = y3; }
        // Wang's formula: segments needed so the polyline stays within FLATTEN_TOL
        const ddx = Math.max(Math.abs(cx - 2 * x1 + x2), Math.abs(x1 - 2 * x2 + x3));
        const ddy = Math.max(Math.abs(cy - 2 * y1 + y2), Math.abs(y1 - 2 * y2 + y3));
        const m = Math.sqrt(ddx * ddx + ddy * ddy);
        let n = Math.ceil(Math.sqrt(0.75 * m / FLATTEN_TOL));
        if (n < 1) n = 1; else if (n > MAX_SEGMENTS) n = MAX_SEGMENTS;
        for (let j = 1; j <= n; j++) {
          const t = j / n, u = 1 - t;
          const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
          push(a * cx + b * x1 + c * x2 + d * x3, a * cy + b * y1 + c * y2 + d * y3);
        }
        cx = x3; cy = y3;
      }
    }
  }
  close();
  if (paths.length === 0) return null;

  const solution = union2(paths, evenOdd ? FillRule.EvenOdd : FillRule.NonZero);
  if (!solution) return null;

  const rings = [];
  const tol = SIMPLIFY_TOL * SCALE;
  for (const ring of solution) {
    const simp = simplifyRing(ring, tol);
    if (simp.length >= 6) rings.push(simp);
  }
  return rings;
}

// Douglas–Peucker on a closed ring (Clipper integer points) → flat user-unit array
function simplifyRing(ring, tol) {
  const n = ring.length;
  if (n < 3) return [];
  const xs = new Float64Array(n), ys = new Float64Array(n);
  for (let i = 0; i < n; i++) { xs[i] = ring[i].x; ys[i] = ring[i].y; }
  // split ring at point 0 and the point farthest from it
  let far = 0, best = -1;
  for (let i = 1; i < n; i++) {
    const d = (xs[i] - xs[0]) ** 2 + (ys[i] - ys[0]) ** 2;
    if (d > best) { best = d; far = i; }
  }
  const keep = new Uint8Array(n);
  keep[0] = keep[far] = 1;
  const tol2 = tol * tol;
  const stack = [0, far, far, n];          // segment [a, b] with b==n meaning index 0
  while (stack.length) {
    const b = stack.pop(), a = stack.pop();
    const bi = b === n ? 0 : b;
    const ax = xs[a], ay = ys[a], bx = xs[bi], by = ys[bi];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let maxD = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      let d;
      if (len2 === 0) d = (xs[i] - ax) ** 2 + (ys[i] - ay) ** 2;
      else {
        const cr = (xs[i] - ax) * dy - (ys[i] - ay) * dx;
        d = cr * cr / len2;
      }
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol2) { keep[idx] = 1; stack.push(a, idx, idx, b); }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(xs[i] / SCALE, ys[i] / SCALE);
  return out;
}
