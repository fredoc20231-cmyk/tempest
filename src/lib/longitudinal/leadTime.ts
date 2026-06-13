/**
 * Longitudinal gate + lead-time computation.
 * Requires ≥3 ordered timepoints. A phenotype/outcome series is required
 * to compute lead_time; without it the analysis is "retrospective trajectory only".
 */
export interface LongitudinalSeries {
  /** Ordered timepoints (numeric, monotonically increasing). */
  timepoints: number[];
  /** fTTI / topology score at each timepoint. */
  fTTI: number[];
  /** Optional phenotype/outcome score at each timepoint. */
  phenotype?: number[] | null;
  /** Threshold for fTTI crossing (default 6.0 — matches manuscript). */
  fTTIThreshold?: number;
  /** Threshold for phenotype crossing. Default 0.5 (binary midpoint). */
  phenotypeThreshold?: number;
}

export interface LongitudinalGateResult {
  ok: boolean;
  reason?: string;
  mode: "endpoint" | "longitudinal-no-phenotype" | "longitudinal-with-phenotype";
  thresholdCrossingTime: number | null;
  phenotypeCrossingTime: number | null;
  leadTime: number | null;
  earlyWarningCandidate: boolean;
}

/** First time the series crosses the threshold from below; null if never. */
export function firstCrossing(
  t: number[],
  y: number[],
  threshold: number,
): number | null {
  for (let i = 1; i < t.length; i++) {
    if (y[i - 1] < threshold && y[i] >= threshold) {
      // linear interpolation between samples
      const dy = y[i] - y[i - 1] || 1e-12;
      const frac = (threshold - y[i - 1]) / dy;
      return t[i - 1] + frac * (t[i] - t[i - 1]);
    }
    if (i === 1 && y[0] >= threshold) return t[0];
  }
  return null;
}

export function evaluateLongitudinal(s: LongitudinalSeries): LongitudinalGateResult {
  const t = s.timepoints ?? [];
  const f = s.fTTI ?? [];
  if (t.length < 3 || f.length !== t.length) {
    return {
      ok: false,
      reason: "Longitudinal mode requires ≥3 ordered timepoints with matching fTTI values.",
      mode: "endpoint",
      thresholdCrossingTime: null,
      phenotypeCrossingTime: null,
      leadTime: null,
      earlyWarningCandidate: false,
    };
  }
  // monotonic check
  for (let i = 1; i < t.length; i++) {
    if (!(t[i] > t[i - 1])) {
      return {
        ok: false,
        reason: "Timepoints must be strictly increasing.",
        mode: "endpoint",
        thresholdCrossingTime: null,
        phenotypeCrossingTime: null,
        leadTime: null,
        earlyWarningCandidate: false,
      };
    }
  }
  const fThr = s.fTTIThreshold ?? 6.0;
  const tx = firstCrossing(t, f, fThr);

  const hasPhenotype = Array.isArray(s.phenotype) && s.phenotype.length === t.length;
  if (!hasPhenotype) {
    return {
      ok: true,
      mode: "longitudinal-no-phenotype",
      thresholdCrossingTime: tx,
      phenotypeCrossingTime: null,
      leadTime: null,
      earlyWarningCandidate: false,
    };
  }
  const pThr = s.phenotypeThreshold ?? 0.5;
  const px = firstCrossing(t, s.phenotype as number[], pThr);
  const leadTime = tx != null && px != null ? px - tx : null;
  return {
    ok: true,
    mode: "longitudinal-with-phenotype",
    thresholdCrossingTime: tx,
    phenotypeCrossingTime: px,
    leadTime,
    earlyWarningCandidate: leadTime != null && leadTime > 0,
  };
}
