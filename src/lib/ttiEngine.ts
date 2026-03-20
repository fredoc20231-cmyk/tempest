/**
 * TTI Real Computation Engine
 * All math runs in-browser on actual data — zero mocks.
 * kNN, union-find H0, graph conductance, H1 graph approximation, jitter null, bootstrap.
 */

/* ── PRNG ── */
export function makePRNG(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rand: () => number) {
  const u = Math.max(1e-14, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/* ── Standardize ── */
export function standardize(X: number[][]): number[][] {
  const n = X.length, p = X[0].length;
  const mean = new Float64Array(p), std = new Float64Array(p);
  for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) mean[j] += X[i][j] / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) std[j] += (X[i][j] - mean[j]) ** 2 / n;
  for (let j = 0; j < p; j++) std[j] = Math.sqrt(std[j]) || 1;
  return X.map(row => Array.from({ length: p }, (_, j) => (row[j] - mean[j]) / std[j]));
}

/* ── PCA via power iteration ── */
export function computePCA(X: number[][], nComp = 2) {
  const n = X.length, p = X[0].length, mean = new Float64Array(p);
  for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) mean[j] += X[i][j] / n;
  const Xc = X.map(row => Array.from({ length: p }, (_, j) => row[j] - mean[j]));
  const rand = makePRNG(7);
  const vecs: number[][] = [];
  let Xr = Xc.map(r => [...r]);

  for (let c = 0; c < nComp; c++) {
    let v = Array.from({ length: p }, () => randn(rand));
    let len = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    v = v.map(x => x / len);
    for (let iter = 0; iter < 40; iter++) {
      const Xv = Xr.map(row => row.reduce((s, x, j) => s + x * v[j], 0));
      const nv = new Float64Array(p);
      for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) nv[j] += Xr[i][j] * Xv[i];
      len = Math.sqrt(Array.from(nv).reduce((s, x) => s + x * x, 0));
      v = Array.from(nv).map(x => x / len);
    }
    vecs.push(v);
    const proj = Xr.map(row => row.reduce((s, x, j) => s + x * v[j], 0));
    Xr = Xr.map((row, i) => row.map((x, j) => x - proj[i] * v[j]));
  }

  const scores = Xc.map(row => vecs.map(v => row.reduce((s, x, j) => s + x * v[j], 0)));
  const totalVar = Xc.reduce((s, row) => s + row.reduce((ss, x) => ss + x * x, 0), 0) / n;
  const varExp = vecs.map(v => {
    const p2 = Xc.map(row => row.reduce((s, x, j) => s + x * v[j], 0));
    return (p2.reduce((s, x) => s + x * x, 0) / n / totalVar) * 100;
  });
  return { scores, varExp };
}

/* ── kNN Graph ── */
export function knnGraph(X: number[][], k: number) {
  const n = X.length, p = X[0].length;
  const D = new Float32Array(n * n);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      let s = 0;
      for (let d = 0; d < p; d++) { const dd = X[i][d] - X[j][d]; s += dd * dd; }
      const dist = Math.sqrt(s);
      D[i * n + j] = dist;
      D[j * n + i] = dist;
    }
  const indices: number[][] = [], distances: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: [number, number][] = [];
    for (let j = 0; j < n; j++) if (j !== i) row.push([j, D[i * n + j]]);
    row.sort((a, b) => a[1] - b[1]);
    const nb = row.slice(0, k);
    indices.push(nb.map(x => x[0]));
    distances.push(nb.map(x => x[1]));
  }
  return { indices, distances, D };
}

/* ── Union-Find ── */
function makeUF(n: number) {
  const p = Array.from({ length: n }, (_, i) => i), r = new Int32Array(n);
  const find = (x: number): number => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; };
  const union = (a: number, b: number) => {
    a = find(a); b = find(b);
    if (a === b) return false;
    if (r[a] < r[b]) [a, b] = [b, a];
    p[b] = a;
    if (r[a] === r[b]) r[a]++;
    return true;
  };
  return { find, union };
}

/* ── H0 Filtration ── */
export function computeH0(D: Float32Array, n: number, T = 30) {
  const vals: number[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) vals.push(D[i * n + j]);
  vals.sort((a, b) => a - b);
  const lo = vals[Math.floor(vals.length * 0.02)], hi = vals[Math.floor(vals.length * 0.25)];
  const eps = Array.from({ length: T }, (_, t) => lo + (hi - lo) * t / (T - 1));
  const beta0 = eps.map(e => {
    const uf = makeUF(n); let nc = n;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (D[i * n + j] <= e && uf.union(i, j)) nc--;
    return nc;
  });
  const mid = eps[Math.floor(T / 2)];
  const sigma = Math.sqrt(eps.reduce((s, v) => s + (v - mid) ** 2, 0) / T) || 1;
  let F = 0;
  for (let t = 0; t < T; t++) F += Math.max(0, beta0[t] - 1) * Math.exp(-(eps[t] ** 2) / (2 * sigma ** 2));
  return { eps, beta0, F: F / T };
}

/* ── Directional Dispersion ── */
function computeDispersion(X: number[][], indices: number[][]) {
  const n = X.length, p = X[0].length;
  let sum = 0, count = 0;
  for (let i = 0; i < n; i++) {
    const nbrs = indices[i], mv = new Float64Array(p);
    for (const j of nbrs) {
      let len = 0;
      for (let d = 0; d < p; d++) len += (X[j][d] - X[i][d]) ** 2;
      len = Math.sqrt(len) || 1e-12;
      for (let d = 0; d < p; d++) mv[d] += (X[j][d] - X[i][d]) / len;
    }
    sum += Math.sqrt(Array.from(mv).reduce((s, v) => s + v * v, 0)) / nbrs.length;
    count++;
  }
  return count ? 1 - sum / count : 0;
}

/* ── Graph Conductance ── */
function computeConductance(indices: number[][], distances: number[][], S_mask: boolean[], R_mask: boolean[], n: number) {
  const allD = distances.flat().sort((a, b) => a - b);
  const sigma = allD[Math.floor(allD.length / 2)] || 1;
  const gauss = (d: number) => Math.exp(-d * d / (2 * sigma * sigma));
  let cut = 0, volS = 0, volR = 0;
  for (let i = 0; i < n; i++)
    for (let t = 0; t < indices[i].length; t++) {
      const j = indices[i][t], w = gauss(distances[i][t]);
      const si = S_mask[i], sj = S_mask[j], ri = R_mask[i], rj = R_mask[j];
      if (si && sj) volS += w;
      else if (ri && rj) volR += w;
      else if ((si && rj) || (ri && sj)) { cut += w / 2; volS += w / 2; volR += w / 2; }
      else { if (si || sj) volS += w / 2; if (ri || rj) volR += w / 2; }
    }
  return cut / (Math.min(volS, volR) || 1e-12);
}

/* ── H1 Approximation ── */
function computeH1(indices: number[][], distances: number[][], n: number, h1Thresh: number) {
  const seen = new Set<number>();
  let edges = 0;
  for (let i = 0; i < n; i++)
    for (let t = 0; t < indices[i].length; t++) {
      const j = indices[i][t], key = Math.min(i, j) * n + Math.max(i, j);
      if (!seen.has(key)) { seen.add(key); edges++; }
    }
  const uf = makeUF(n);
  let comps = n;
  for (let i = 0; i < n; i++) for (const j of indices[i]) if (uf.union(i, j)) comps--;
  const beta1 = Math.max(0, edges - n + comps);
  const medD = [...distances.flat()].sort((a, b) => a - b);
  const m = medD[Math.floor(medD.length / 2)] || 1;
  const L = Math.max(0, beta1 * Math.max(0, m - h1Thresh));
  return { L, beta1, edges, comps };
}

/* ── Jitter ── */
function jitter(X: number[][], scale: number, seed: number) {
  const rand = makePRNG(seed);
  return X.map(row => row.map(v => v + randn(rand) * scale));
}

/* ── Subsample ── */
export function subsampleData(X: number[][], S_mask: boolean[], R_mask: boolean[], maxN: number, seed = 1) {
  if (X.length <= maxN) return { X, S_mask, R_mask };
  const rand = makePRNG(seed);
  const used = new Set<number>();
  while (used.size < maxN) used.add(Math.floor(rand() * X.length));
  const idx = [...used];
  return { X: idx.map(i => X[i]), S_mask: idx.map(i => S_mask[i]), R_mask: idx.map(i => R_mask[i]) };
}

/* ── TTI Result Type ── */
export interface TTIResult {
  tti: number;
  tti_ci: [number, number];
  z: { zL: number; zB: number; zN: number };
  p: { pL: number; pB: number; pN: number };
  raw: { L: number; B: number; F: number; D: number; phi: number; N: number; h1Thresh: number; beta1: number; edges: number; comps: number };
  null: { nullL: number[]; nullB: number[]; nullN: number[] };
  h0: { eps: number[]; beta0: number[]; F: number };
  pcaResult: { scores: number[][]; varExp: number[] };
  S_mask: boolean[];
  R_mask: boolean[];
  n: number;
  phaseTransition: boolean;
  sourceName?: string;
  genePanel?: string[];
}

/* ── Main TTI Computation ── */
export async function computeTTI(
  X: number[][],
  S_mask: boolean[],
  R_mask: boolean[],
  params: { k?: number; nullReps?: number; bsReps?: number; bsFrac?: number; seed?: number },
  onProgress?: (msg: string, pct: number) => void,
): Promise<TTIResult> {
  const { k = 15, nullReps = 50, bsReps = 50, bsFrac = 0.80, seed = 42 } = params;
  const n = X.length;

  onProgress?.("Building kNN graph…", 8);
  await new Promise(r => setTimeout(r, 10));
  const { indices, distances, D } = knnGraph(X, k);

  onProgress?.("H0 filtration — β₀(ε) curve…", 20);
  await new Promise(r => setTimeout(r, 10));
  const h0 = computeH0(D, n);

  onProgress?.("Directional dispersion…", 30);
  await new Promise(r => setTimeout(r, 10));
  const Ddisp = computeDispersion(X, indices);
  const B = h0.F + Ddisp;

  onProgress?.("Graph conductance φ(S,R)…", 40);
  await new Promise(r => setTimeout(r, 10));
  const phi = computeConductance(indices, distances, S_mask, R_mask, n);
  const N = -Math.log(phi + 1e-12);

  onProgress?.("H1 threshold probe…", 46);
  await new Promise(r => setTimeout(r, 10));
  const allD = [...distances.flat()].sort((a, b) => a - b);
  const medDist = allD[Math.floor(allD.length / 2)] || 1;
  const h1Probes: number[] = [];
  for (let r = 0; r < 5; r++) {
    const Xn = jitter(X, 0.5 * medDist, seed + 10000 + r);
    const { distances: dn } = knnGraph(Xn, k);
    const fdn = [...dn.flat()].sort((a, b) => a - b);
    h1Probes.push(fdn[Math.floor(fdn.length / 2)] || 1);
  }
  const h1Thresh = h1Probes.reduce((s, v) => s + v, 0) / h1Probes.length;

  onProgress?.("H1 loop mass β₁…", 52);
  await new Promise(r => setTimeout(r, 10));
  const { L, beta1, edges, comps } = computeH1(indices, distances, n, h1Thresh);

  onProgress?.(`Null distribution (${nullReps} jitter permutations)…`, 56);
  const nullL: number[] = [], nullB: number[] = [], nullN: number[] = [];
  for (let r = 0; r < nullReps; r++) {
    if (r % 10 === 0) {
      onProgress?.(`Null permutation ${r + 1}/${nullReps}…`, 56 + (r / nullReps) * 22);
      await new Promise(res => setTimeout(res, 2));
    }
    const Xn = jitter(X, 0.5 * medDist, seed + 20000 + r);
    const { indices: ni, distances: nd, D: Dn } = knnGraph(Xn, k);
    const h0n = computeH0(Dn, n);
    const Dn2 = computeDispersion(Xn, ni);
    nullB.push(h0n.F + Dn2);
    const phin = computeConductance(ni, nd, S_mask, R_mask, n);
    nullN.push(-Math.log(phin + 1e-12));
    const { L: Ln } = computeH1(ni, nd, n, h1Thresh);
    nullL.push(Ln);
  }

  const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const sd = (arr: number[]) => {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length) || 1e-9;
  };
  const zScore = (v: number, arr: number[]) => (v - mean(arr)) / sd(arr);
  const pVal = (v: number, arr: number[]) => Math.max(1 / arr.length, arr.filter(x => x >= v).length / arr.length);

  const zL = zScore(L, nullL), zB = zScore(B, nullB), zN = zScore(N, nullN);
  const pL = pVal(L, nullL), pB = pVal(B, nullB), pN = pVal(N, nullN);
  const tti = zL + zB + zN;

  onProgress?.(`Bootstrap CI (${bsReps} resamples)…`, 80);
  await new Promise(r => setTimeout(r, 10));
  const muL = mean(nullL), sdL = sd(nullL), muB = mean(nullB), sdB = sd(nullB), muN = mean(nullN), sdN = sd(nullN);
  const bsTTI: number[] = [];
  const mSize = Math.max(10, Math.floor(bsFrac * n));
  const rand = makePRNG(seed + 30000);
  for (let b = 0; b < bsReps; b++) {
    const used = new Set<number>();
    while (used.size < mSize) used.add(Math.floor(rand() * n));
    const idx = [...used];
    const Xb = idx.map(i => X[i]), Sb = idx.map(i => S_mask[i]), Rb = idx.map(i => R_mask[i]);
    if (!Sb.some(Boolean) || !Rb.some(Boolean)) continue;
    const kb = Math.min(k, Math.min(Sb.filter(Boolean).length, Rb.filter(Boolean).length) - 1);
    if (kb < 2) continue;
    const { indices: ib, distances: db, D: Db } = knnGraph(Xb, kb);
    const h0b = computeH0(Db, Xb.length);
    const Db2 = computeDispersion(Xb, ib);
    const phib = computeConductance(ib, db, Sb, Rb, Xb.length);
    const Nb = -Math.log(phib + 1e-12);
    const { L: Lb } = computeH1(ib, db, Xb.length, h1Thresh);
    bsTTI.push((Lb - muL) / sdL + (h0b.F + Db2 - muB) / sdB + (Nb - muN) / sdN);
  }
  bsTTI.sort((a, b) => a - b);
  const ci: [number, number] = bsTTI.length >= 10
    ? [bsTTI[Math.floor(bsTTI.length * 0.025)], bsTTI[Math.floor(bsTTI.length * 0.975)]]
    : [NaN, NaN];

  const pcaResult = computePCA(X);

  onProgress?.("Complete.", 100);

  return {
    tti, tti_ci: ci,
    z: { zL, zB, zN }, p: { pL, pB, pN },
    raw: { L, B, F: h0.F, D: Ddisp, phi, N, h1Thresh, beta1, edges, comps },
    null: { nullL, nullB, nullN },
    h0, pcaResult, S_mask, R_mask, n,
    phaseTransition: tti >= 6.0,
  };
}

/* ── Synthetic topology generators ── */
function embedHD(X2: number[][], p = 20, noise = 0.05, seed = 0) {
  const rand = makePRNG(seed);
  const A = Array.from({ length: 2 }, () => Array.from({ length: p }, () => randn(rand)));
  return X2.map(([x, y]) => Array.from({ length: p }, (_, j) => x * A[0][j] + y * A[1][j] + randn(rand) * noise));
}

export const GENERATORS: Record<string, (n?: number, seed?: number) => { X2: number[][]; labels: string[]; X: number[][] }> = {
  null_gaussian: (n = 140, seed = 1) => {
    const rand = makePRNG(seed);
    const X2 = Array.from({ length: n }, () => [randn(rand) * 60, randn(rand) * 60]);
    const labels = X2.map((_, i) => i < n / 2 ? "S" : "R");
    return { X2, labels, X: standardize(embedHD(X2, 20, 0.05, seed)) };
  },
  bottleneck: (n = 140, seed = 2) => {
    const rand = makePRNG(seed);
    const pts: number[][] = [], labels: string[] = [];
    for (let i = 0; i < n / 2; i++) { pts.push([-85 + randn(rand) * 13, randn(rand) * 13]); labels.push("S"); }
    for (let i = 0; i < n / 2; i++) { pts.push([85 + randn(rand) * 13, randn(rand) * 13]); labels.push("R"); }
    for (let i = 0; i < 22; i++) { pts.push([-85 + 170 * (i / 22), randn(rand) * 4]); labels.push("S"); }
    return { X2: pts, labels, X: standardize(embedHD(pts, 20, 0.05, seed)) };
  },
  branch_y: (n = 140, seed = 3) => {
    const rand = makePRNG(seed);
    const pts: number[][] = [], labels: string[] = [];
    const nT = Math.floor(n / 3);
    for (let i = 0; i < nT; i++) { pts.push([i / nT * 70 - 100, randn(rand) * 8]); labels.push("S"); }
    for (let i = 0; i < n - nT; i++) {
      const x = rand() * 80; const sign = i < (n - nT) / 2 ? 1 : -1;
      pts.push([x - 25, sign * (x + 20) * 0.4 + randn(rand) * 8]); labels.push("R");
    }
    return { X2: pts, labels, X: standardize(embedHD(pts, 20, 0.05, seed)) };
  },
  loop: (n = 140, seed = 4) => {
    const rand = makePRNG(seed);
    const X2 = Array.from({ length: n }, () => {
      const t = rand() * 2 * Math.PI;
      return [Math.cos(t) * 80 + randn(rand) * 9, Math.sin(t) * 60 + randn(rand) * 9];
    });
    const labels = X2.map(([x, y]) => Math.atan2(y, x) < 0 ? "R" : "S");
    return { X2, labels, X: standardize(embedHD(X2, 20, 0.05, seed)) };
  },
};

/* ── CSV Parser ── */
export function parseUpload(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 3) throw new Error("File has fewer than 3 rows");
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const header = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ""));
  const labelKeywords = ["label", "condition", "group", "class", "type", "status", "phenotype", "treatment", "response"];
  const labelCol = header.findIndex(h => labelKeywords.includes(h.toLowerCase()));
  const skipCols = new Set(
    [labelCol, header.findIndex(h => ["sample", "sampleid", "id", "name"].includes(h.toLowerCase()))].filter(i => i >= 0),
  );
  const featCols = header.map((_, i) => i).filter(i => !skipCols.has(i));
  const rows: { features: number[]; label: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(sep).map(s => s.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;
    const nums = featCols.map(ci => parseFloat(parts[ci]));
    if (nums.some(isNaN) || nums.length === 0) continue;
    const lbl = labelCol >= 0 ? parts[labelCol] : (i - 1 < Math.floor((lines.length - 1) / 2) ? "S" : "R");
    rows.push({ features: nums, label: lbl });
  }

  if (rows.length < 6) throw new Error(`Only ${rows.length} valid rows found (need ≥ 6)`);
  const uniqueLabels = [...new Set(rows.map(r => r.label))];
  if (uniqueLabels.length < 2) throw new Error(`Only 1 unique label "${uniqueLabels[0]}" — need 2 groups`);
  const sLabel = uniqueLabels[0], rLabel = uniqueLabels[1];

  return {
    X: rows.map(r => r.features),
    labels: rows.map(r => r.label),
    S_mask: rows.map(r => r.label === sLabel),
    R_mask: rows.map(r => r.label === rLabel),
    nSamples: rows.length,
    nFeatures: featCols.length,
    uniqueLabels,
    sLabel,
    rLabel,
    featureNames: featCols.map(i => header[i]),
  };
}

/* ── Public API endpoints ── */
const NCBI = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const CBIO = "https://www.cbioportal.org/api";

export const OV_GENES = [7157, 672, 675, 5728, 5925, 898, 4609, 4763, 51755, 4854, 2305, 2064, 207, 5290];
export const OV_SYMBOLS = ["TP53", "BRCA1", "BRCA2", "PTEN", "RB1", "CCNE1", "MYC", "NF1", "CDK12", "NOTCH3", "FOXM1", "ERBB2", "AKT1", "PIK3CA"];

export interface GEOResult {
  id: string;
  accession: string;
  title: string;
  organism: string;
  nSamples: number;
  summary: string;
  platform: string;
  pubDate: string;
}

export async function searchGEO(query: string): Promise<GEOResult[]> {
  const r = await fetch(`${NCBI}/esearch.fcgi?db=gds&term=${encodeURIComponent(query)}&retmax=8&retmode=json`);
  if (!r.ok) throw new Error(`NCBI HTTP ${r.status}`);
  const d = await r.json();
  const ids = d.esearchresult?.idlist || [];
  if (!ids.length) return [];
  const sr = await fetch(`${NCBI}/esummary.fcgi?db=gds&id=${ids.join(",")}&retmode=json`);
  const sd = await sr.json();
  return ids.map((id: string) => {
    const e = sd.result?.[id] || {};
    return {
      id, accession: e.accession || `GDS${id}`, title: e.title || "Untitled",
      organism: e.taxon || "Unknown", nSamples: e.n_samples || 0,
      summary: (e.summary || "").slice(0, 200), platform: e.gpl || "", pubDate: e.pdat || "",
    };
  });
}

export interface TCGAData {
  X: number[][];
  S_mask: boolean[];
  R_mask: boolean[];
  samples: string[];
  nSamples: number;
  geneSymbols: string[];
}

export async function fetchTCGAOV(onStatus?: (msg: string) => void): Promise<TCGAData> {
  onStatus?.("Fetching TCGA-OV sample list from cBioPortal…");
  const clinR = await fetch(`${CBIO}/studies/ov_tcga_pub/clinical-data?clinicalDataType=SAMPLE`);
  const clinD = clinR.ok ? await clinR.json() : [];
  const stageMap: Record<string, string> = {};
  for (const c of clinD) if (c.clinicalAttributeId?.toUpperCase().includes("STAGE") && !stageMap[c.sampleId]) stageMap[c.sampleId] = c.value;

  onStatus?.(`Fetching mRNA expression for ${OV_GENES.length} HGSOC driver genes…`);
  const exprR = await fetch(`${CBIO}/molecular-profiles/ov_tcga_pub_mrna/gene-molecular-data/fetch?projection=SUMMARY`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entrezGeneIds: OV_GENES, sampleListId: "ov_tcga_pub_all" }),
  });
  if (!exprR.ok) throw new Error(`cBioPortal expression HTTP ${exprR.status}`);
  const exprD = await exprR.json();
  const byS: Record<string, Record<number, number>> = {};
  for (const e of exprD) { if (!byS[e.sampleId]) byS[e.sampleId] = {}; byS[e.sampleId][e.entrezGeneId] = e.value; }

  const samples = Object.keys(byS).filter(s => OV_GENES.every(g => byS[s][g] !== undefined));
  const X = samples.map(s => OV_GENES.map(g => byS[s][g]));
  const isEarly = (s: string) => { const st = (stageMap[s] || "").toUpperCase(); return st.includes("I") && !st.includes("III") && !st.includes("IV"); };
  const isLate = (s: string) => { const st = (stageMap[s] || "").toUpperCase(); return st.includes("III") || st.includes("IV"); };
  const S_mask = samples.map(s => isEarly(s));
  const R_mask = samples.map(s => isLate(s));
  const nS = S_mask.filter(Boolean).length, nR = R_mask.filter(Boolean).length;
  onStatus?.(`Loaded ${samples.length} TCGA-OV samples. Stage I/II: ${nS} parental, Stage III/IV: ${nR} advanced.`);
  return { X, S_mask, R_mask, samples, nSamples: samples.length, geneSymbols: OV_SYMBOLS };
}
