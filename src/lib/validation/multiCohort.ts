/**
 * Multi-cohort longitudinal harness.
 * Aggregates fTTI-style trajectory results across N independent longitudinal cohorts.
 * No fabrication: cohorts must be supplied by the caller.
 */
import { auroc } from "@/lib/stats/auroc";

export interface CohortTrajectory {
  label: string;
  timepoints: number[];                 // monotonic time axis
  fTTI: number[];                       // per-timepoint fTTI score
  phenotype?: { t: number; positive: boolean } | null; // optional transition event
  provenance: "USER-UPLOADED" | "DEMO/SYNTHETIC";
}

export interface CohortSummary {
  label: string;
  n_timepoints: number;
  max_fTTI: number;
  cross_idx: number | null;             // index where fTTI crosses Ψ*
  cross_t: number | null;
  lead_time: number | null;             // phenotype_t - cross_t (positive = early warning)
  provenance: string;
}

export interface MultiCohortReport {
  threshold: number;
  cohorts: CohortSummary[];
  n_cohorts: number;
  n_with_phenotype: number;
  pooled_AUROC: number | null;          // discriminates phenotype-positive vs negative by max_fTTI
  median_lead_time: number | null;
  mean_lead_time: number | null;
  ci_lead_time: [number, number] | null;
}

function quantile(sorted: number[], q: number) {
  if (sorted.length === 0) return NaN;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function summarizeCohort(c: CohortTrajectory, threshold: number): CohortSummary {
  const idx = c.fTTI.findIndex((v) => v >= threshold);
  const cross_idx = idx >= 0 ? idx : null;
  const cross_t = cross_idx != null ? c.timepoints[cross_idx] : null;
  const lead_time =
    cross_t != null && c.phenotype != null ? c.phenotype.t - cross_t : null;
  return {
    label: c.label,
    n_timepoints: c.timepoints.length,
    max_fTTI: Math.max(...c.fTTI),
    cross_idx,
    cross_t,
    lead_time,
    provenance: c.provenance,
  };
}

export function aggregateMultiCohort(
  cohorts: CohortTrajectory[],
  threshold: number,
): MultiCohortReport {
  const summaries = cohorts.map((c) => summarizeCohort(c, threshold));
  const phenoCohorts = cohorts.filter((c) => c.phenotype != null);
  const labels = phenoCohorts.map((c) => (c.phenotype!.positive ? 1 : 0) as 0 | 1);
  const scores = phenoCohorts.map((c) => Math.max(...c.fTTI));
  const pooled =
    phenoCohorts.length >= 2 && new Set(labels).size === 2 ? auroc(scores, labels) : null;

  const leads = summaries.map((s) => s.lead_time).filter((x): x is number => x != null);
  const sortedLeads = [...leads].sort((a, b) => a - b);
  const median = leads.length ? quantile(sortedLeads, 0.5) : null;
  const mean = leads.length ? leads.reduce((a, b) => a + b, 0) / leads.length : null;
  const ci: [number, number] | null = leads.length >= 3
    ? [quantile(sortedLeads, 0.025), quantile(sortedLeads, 0.975)]
    : null;

  return {
    threshold,
    cohorts: summaries,
    n_cohorts: cohorts.length,
    n_with_phenotype: phenoCohorts.length,
    pooled_AUROC: Number.isFinite(pooled as number) ? (pooled as number) : null,
    median_lead_time: median,
    mean_lead_time: mean,
    ci_lead_time: ci,
  };
}
