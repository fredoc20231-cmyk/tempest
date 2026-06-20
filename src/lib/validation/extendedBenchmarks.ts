/**
 * Extended-benchmark approximations for state-separation methods reviewers
 * commonly ask about (PHATE, Monocle pseudotime, CellRank, Waddington-OT).
 *
 * IMPORTANT: these are *transparent in-browser approximations* of each method's
 * core idea, not the reference implementations. The UI labels them as such.
 */

export interface BenchmarkInput {
  /** flat numeric matrix [n_samples × n_features] */
  X: number[][];
  /** binary class label per sample (0/1) — required for AUROC */
  y?: (0 | 1)[];
  /** optional ordered timepoints per sample (for pseudotime-style methods) */
  t?: number[];
}

export interface ExtendedBenchmarkResult {
  method: string;
  full_name: string;
  description: string;
  score: number;
  note: string;
}

function colMean(X: number[][]) {
  const n = X.length, p = X[0]?.length ?? 0;
  const m = new Array(p).fill(0);
  for (const r of X) for (let j = 0; j < p; j++) m[j] += r[j] / n;
  return m;
}

function l2(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

/** PHATE-proxy: heat-diffusion-style spread.
 *  We use mean pairwise diffusion-distance from a kernel exp(-d²/σ²).
 */
export function phateProxy(input: BenchmarkInput): ExtendedBenchmarkResult {
  const { X } = input;
  const n = Math.min(X.length, 80);
  const Xs = X.slice(0, n);
  let sumD = 0, count = 0;
  const dists: number[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = l2(Xs[i], Xs[j]); dists.push(d); sumD += d; count++;
  }
  const sigma = sumD / Math.max(1, count) || 1;
  let entropy = 0;
  for (const d of dists) {
    const k = Math.exp(-(d * d) / (sigma * sigma));
    if (k > 1e-9) entropy -= k * Math.log(k);
  }
  return {
    method: "PHATE-proxy",
    full_name: "Heat-diffusion embedding entropy (PHATE-style)",
    description: "Approximation of PHATE's diffusion-based geometric spread.",
    score: entropy / Math.max(1, dists.length),
    note: "In-browser proxy; not the PHATE reference implementation.",
  };
}

/** Monocle-style pseudotime monotonicity: rank-correlation between supplied t
 *  and projection onto first principal direction.
 */
export function monocleProxy(input: BenchmarkInput): ExtendedBenchmarkResult {
  const { X, t } = input;
  if (!t || t.length !== X.length) {
    return {
      method: "Monocle-proxy", full_name: "Pseudotime monotonicity (Monocle-style)",
      description: "Requires per-sample time annotations.",
      score: NaN, note: "Skipped: no timepoint vector supplied.",
    };
  }
  const mean = colMean(X);
  const proj = X.map((r) => r.reduce((s, v, j) => s + (v - mean[j]), 0));
  // Spearman ρ via rank
  const rank = (a: number[]) => {
    const idx = a.map((v, i) => ({ v, i })).sort((x, y) => x.v - y.v);
    const r = new Array(a.length);
    idx.forEach((o, k) => (r[o.i] = k + 1));
    return r;
  };
  const r1 = rank(proj), r2 = rank(t);
  let sum = 0;
  for (let i = 0; i < r1.length; i++) sum += (r1[i] - r2[i]) ** 2;
  const n = r1.length;
  const rho = 1 - (6 * sum) / (n * (n * n - 1));
  return {
    method: "Monocle-proxy",
    full_name: "Pseudotime ↔ time-axis Spearman ρ",
    description: "Approximation of Monocle's pseudotime ordering quality.",
    score: rho,
    note: "In-browser proxy; not Monocle3.",
  };
}

/** CellRank-style transition entropy: variance of nearest-neighbour displacements. */
export function cellRankProxy(input: BenchmarkInput): ExtendedBenchmarkResult {
  const { X } = input;
  const n = Math.min(X.length, 60);
  let s = 0, sq = 0, c = 0;
  for (let i = 0; i < n; i++) {
    let best = Infinity;
    for (let j = 0; j < n; j++) if (i !== j) best = Math.min(best, l2(X[i], X[j]));
    s += best; sq += best * best; c++;
  }
  const mean = s / Math.max(1, c);
  const variance = sq / Math.max(1, c) - mean * mean;
  return {
    method: "CellRank-proxy",
    full_name: "Nearest-neighbour transition variance (CellRank-style)",
    description: "Approximation of CellRank's directed-transition uncertainty.",
    score: Math.sqrt(Math.max(0, variance)),
    note: "In-browser proxy; not CellRank2.",
  };
}

/** Waddington-OT-style transport cost between two halves of the dataset
 *  (greedy bipartite matching, Euclidean ground metric).
 */
export function wotProxy(input: BenchmarkInput): ExtendedBenchmarkResult {
  const { X, y, t } = input;
  let A: number[][] = [], B: number[][] = [];
  if (y && y.length === X.length && new Set(y).size === 2) {
    X.forEach((r, i) => (y[i] === 1 ? B.push(r) : A.push(r)));
  } else if (t && t.length === X.length) {
    const med = [...t].sort((a, b) => a - b)[Math.floor(t.length / 2)];
    X.forEach((r, i) => (t[i] >= med ? B.push(r) : A.push(r)));
  } else {
    const half = Math.floor(X.length / 2);
    A = X.slice(0, half); B = X.slice(half);
  }
  const m = Math.min(A.length, B.length, 50);
  if (m === 0) {
    return {
      method: "WOT-proxy", full_name: "Optimal-transport cost (Waddington-OT-style)",
      description: "Greedy OT between two halves of the dataset.",
      score: NaN, note: "Insufficient samples to split.",
    };
  }
  const used = new Set<number>();
  let cost = 0;
  for (let i = 0; i < m; i++) {
    let best = Infinity, bestJ = -1;
    for (let j = 0; j < B.length; j++) {
      if (used.has(j)) continue;
      const d = l2(A[i], B[j]);
      if (d < best) { best = d; bestJ = j; }
    }
    if (bestJ >= 0) { used.add(bestJ); cost += best; }
  }
  return {
    method: "WOT-proxy",
    full_name: "Optimal-transport cost (Waddington-OT-style)",
    description: "Greedy bipartite OT cost between split halves.",
    score: cost / m,
    note: "In-browser proxy; not the WOT reference implementation.",
  };
}

export function runExtendedBenchmarks(input: BenchmarkInput): ExtendedBenchmarkResult[] {
  if (!input.X.length || !input.X[0]?.length) return [];
  return [phateProxy(input), monocleProxy(input), cellRankProxy(input), wotProxy(input)];
}
