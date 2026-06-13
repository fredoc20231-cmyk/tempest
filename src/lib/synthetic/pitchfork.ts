/**
 * Synthetic pitchfork bifurcation: dx/dt = r*x - x^3 + σ·η(t)
 * Ground truth: r > 0 → transition (two attractors); r ≤ 0 → single attractor.
 * Returns per-r metrics (fTTI proxy, DA-dist, Fiedler λ2) suitable for AUROC.
 */
import { makePRNG, randn } from "@/lib/ttiEngine";
import { auroc } from "@/lib/stats/auroc";

export interface PitchforkPoint {
  r: number;
  fTTI: number;
  daDist: number;
  fiedler: number;
  trueLabel: 0 | 1;
}

export interface PitchforkResult {
  points: PitchforkPoint[];
  auroc: { fTTI: number; daDist: number; fiedler: number };
}

function simulate(
  r: number,
  n: number,
  sigma: number,
  seed: number,
): number[] {
  const rand = makePRNG(seed);
  const dt = 0.05;
  const steps = 400;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let x = 0.05 * randn(rand);
    for (let t = 0; t < steps; t++) {
      x += dt * (r * x - x * x * x) + sigma * Math.sqrt(dt) * randn(rand);
    }
    out.push(x);
  }
  return out;
}

function variance(xs: number[]): number {
  const m = xs.reduce((s, v) => s + v, 0) / xs.length;
  return xs.reduce((s, v) => s + (v - m) ** 2, 0) / xs.length;
}

function bimodalityCoefficient(xs: number[]): number {
  const n = xs.length;
  const m = xs.reduce((s, v) => s + v, 0) / n;
  const c2 = xs.reduce((s, v) => s + (v - m) ** 2, 0) / n;
  const c3 = xs.reduce((s, v) => s + (v - m) ** 3, 0) / n;
  const c4 = xs.reduce((s, v) => s + (v - m) ** 4, 0) / n;
  const skew = c3 / Math.pow(c2 || 1e-12, 1.5);
  const kurt = c4 / Math.pow(c2 || 1e-12, 2) - 3;
  return (skew * skew + 1) / (kurt + 3 * ((n - 1) ** 2) / ((n - 2) * (n - 3)));
}

function fiedlerLambda(xs: number[]): number {
  // 1-D Laplacian eigenvalue proxy: gap between two halves
  const sorted = [...xs].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  const left = sorted.slice(0, half);
  const right = sorted.slice(half);
  const lm = left.reduce((s, v) => s + v, 0) / left.length;
  const rm = right.reduce((s, v) => s + v, 0) / right.length;
  const within = variance(left) + variance(right);
  return Math.abs(rm - lm) / (within + 1e-9);
}

function daDist(xs: number[]): number {
  // Distance between two cluster means after split-at-median.
  const sorted = [...xs].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  const left = sorted.slice(0, half);
  const right = sorted.slice(half);
  const lm = left.reduce((s, v) => s + v, 0) / left.length;
  const rm = right.reduce((s, v) => s + v, 0) / right.length;
  return Math.abs(rm - lm);
}

export function runPitchforkValidation(opts?: {
  rValues?: number[];
  n?: number;
  sigma?: number;
  seed?: number;
}): PitchforkResult {
  const rValues =
    opts?.rValues ?? Array.from({ length: 21 }, (_, i) => -1 + i * 0.1);
  const n = opts?.n ?? 60;
  const sigma = opts?.sigma ?? 0.25;
  const seed = opts?.seed ?? 42;

  const points: PitchforkPoint[] = rValues.map((r, i) => {
    const xs = simulate(r, n, sigma, seed + i * 7);
    const bc = bimodalityCoefficient(xs);
    const v = variance(xs);
    return {
      r,
      // fTTI proxy: bimodality + scaled variance (mirrors z_B + z_N)
      fTTI: bc * 3 + Math.log1p(v),
      daDist: daDist(xs),
      fiedler: fiedlerLambda(xs),
      trueLabel: r > 0 ? 1 : 0,
    };
  });

  return {
    points,
    auroc: {
      fTTI: auroc(points.map((p) => p.fTTI), points.map((p) => p.trueLabel)),
      daDist: auroc(points.map((p) => p.daDist), points.map((p) => p.trueLabel)),
      fiedler: auroc(points.map((p) => p.fiedler), points.map((p) => p.trueLabel)),
    },
  };
}
