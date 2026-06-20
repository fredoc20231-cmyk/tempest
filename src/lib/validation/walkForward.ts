/**
 * Walk-forward / leave-one-cohort-out (LOOCV) threshold calibration.
 * For each held-out cohort, find the threshold on the remaining cohorts that
 * maximizes Youden's J = sens + spec - 1 on the phenotype label predicted by
 * "max_fTTI >= threshold", then evaluate on the held-out cohort.
 */
import type { CohortTrajectory } from "./multiCohort";

export interface WalkForwardFold {
  held_out: string;
  threshold: number;
  predicted_positive: boolean;
  actual_positive: boolean | null;
  correct: boolean | null;
}

export interface WalkForwardReport {
  folds: WalkForwardFold[];
  threshold_median: number;
  threshold_ci: [number, number] | null;
  sensitivity: number | null;
  specificity: number | null;
  accuracy: number | null;
  n_eligible: number;
  message: string;
}

function quantile(sorted: number[], q: number) {
  if (sorted.length === 0) return NaN;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function bestThreshold(scores: number[], labels: (0 | 1)[]) {
  const cands = Array.from(new Set(scores)).sort((a, b) => a - b);
  let bestT = cands[0] ?? 0, bestJ = -Infinity;
  for (const t of cands) {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (let i = 0; i < scores.length; i++) {
      const pred = scores[i] >= t ? 1 : 0;
      const y = labels[i];
      if (pred === 1 && y === 1) tp++;
      else if (pred === 1 && y === 0) fp++;
      else if (pred === 0 && y === 0) tn++;
      else fn++;
    }
    const sens = tp + fn === 0 ? 0 : tp / (tp + fn);
    const spec = tn + fp === 0 ? 0 : tn / (tn + fp);
    const J = sens + spec - 1;
    if (J > bestJ) { bestJ = J; bestT = t; }
  }
  return bestT;
}

export function walkForwardCalibrate(cohorts: CohortTrajectory[]): WalkForwardReport {
  const eligible = cohorts.filter((c) => c.phenotype != null);
  if (eligible.length < 3) {
    return {
      folds: [],
      threshold_median: NaN,
      threshold_ci: null,
      sensitivity: null,
      specificity: null,
      accuracy: null,
      n_eligible: eligible.length,
      message: `Need ≥3 phenotype-labelled cohorts for LOOCV (have ${eligible.length}).`,
    };
  }
  const folds: WalkForwardFold[] = [];
  for (let i = 0; i < eligible.length; i++) {
    const train = eligible.filter((_, j) => j !== i);
    const test = eligible[i];
    const labels = train.map((c) => (c.phenotype!.positive ? 1 : 0) as 0 | 1);
    if (new Set(labels).size < 2) continue;
    const scores = train.map((c) => Math.max(...c.fTTI));
    const t = bestThreshold(scores, labels);
    const testScore = Math.max(...test.fTTI);
    const pred = testScore >= t;
    const actual = test.phenotype!.positive;
    folds.push({
      held_out: test.label,
      threshold: t,
      predicted_positive: pred,
      actual_positive: actual,
      correct: pred === actual,
    });
  }
  const ts = folds.map((f) => f.threshold).sort((a, b) => a - b);
  const tp = folds.filter((f) => f.predicted_positive && f.actual_positive === true).length;
  const fn = folds.filter((f) => !f.predicted_positive && f.actual_positive === true).length;
  const tn = folds.filter((f) => !f.predicted_positive && f.actual_positive === false).length;
  const fp = folds.filter((f) => f.predicted_positive && f.actual_positive === false).length;
  return {
    folds,
    threshold_median: quantile(ts, 0.5),
    threshold_ci: ts.length >= 3 ? [quantile(ts, 0.025), quantile(ts, 0.975)] : null,
    sensitivity: tp + fn === 0 ? null : tp / (tp + fn),
    specificity: tn + fp === 0 ? null : tn / (tn + fp),
    accuracy: folds.length ? folds.filter((f) => f.correct).length / folds.length : null,
    n_eligible: eligible.length,
    message: `LOOCV across ${folds.length} folds.`,
  };
}
