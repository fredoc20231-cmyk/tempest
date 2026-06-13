/**
 * Jensen–Shannon divergence between two discrete distributions.
 * Inputs are coerced to probability vectors (non-negative, sum→1).
 */
function normalize(v: number[]): number[] {
  const min = Math.min(...v);
  const shifted = min < 0 ? v.map((x) => x - min) : v.slice();
  const s = shifted.reduce((a, b) => a + b, 0) || 1;
  return shifted.map((x) => x / s);
}

function kld(p: number[], q: number[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 0 && q[i] > 0) s += p[i] * Math.log2(p[i] / q[i]);
  }
  return s;
}

export function jsd(a: number[], b: number[]): number {
  if (a.length !== b.length) return NaN;
  const p = normalize(a);
  const q = normalize(b);
  const m = p.map((x, i) => 0.5 * (x + q[i]));
  return 0.5 * kld(p, m) + 0.5 * kld(q, m);
}
