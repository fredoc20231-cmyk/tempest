/**
 * Two-class AUROC via the rank-sum identity (Mann–Whitney U).
 * Returns NaN when scores are degenerate or fewer than 2 classes are present.
 */
export function auroc(scores: number[], labels: (0 | 1 | boolean)[]): number {
  if (scores.length !== labels.length || scores.length < 2) return NaN;
  const y = labels.map((l) => (l ? 1 : 0));
  const pos = y.reduce<number>((s, v) => s + v, 0);
  const neg = y.length - pos;
  if (pos === 0 || neg === 0) return NaN;
  const idx = scores
    .map((s, i) => ({ s, y: y[i], i }))
    .sort((a, b) => a.s - b.s);
  // assign average ranks for ties
  let sumRankPos = 0;
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].s === idx[i].s) j++;
    const avgRank = (i + j + 2) / 2; // 1-indexed
    for (let k = i; k <= j; k++) if (idx[k].y === 1) sumRankPos += avgRank;
    i = j + 1;
  }
  const U = sumRankPos - (pos * (pos + 1)) / 2;
  return U / (pos * neg);
}
