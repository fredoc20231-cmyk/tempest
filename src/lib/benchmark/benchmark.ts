/**
 * Benchmark utilities — pure functions, no UI deps.
 *
 * benchmark_type:
 *   - "single-class"     → geometry only; AUROC blocked
 *   - "binary"           → AUROC permitted across labels
 *   - "longitudinal"     → ≥3 ordered timepoints
 */
import { auroc } from "@/lib/stats/auroc";

export type BenchmarkType =
  | "single-class geometry only"
  | "binary classification benchmark"
  | "longitudinal benchmark";

export interface BenchmarkInput {
  labels?: (string | number | null | undefined)[];
  timepoints?: (number | string | null | undefined)[];
}

export function classifyBenchmark(input: BenchmarkInput): BenchmarkType {
  const tps = (input.timepoints ?? []).filter((t) => t != null && t !== "");
  const ordered = new Set(tps.map(String));
  if (ordered.size >= 3) return "longitudinal benchmark";
  const labels = (input.labels ?? []).filter((l) => l != null && l !== "");
  const classes = new Set(labels.map(String));
  return classes.size >= 2
    ? "binary classification benchmark"
    : "single-class geometry only";
}

export interface BenchmarkMetricScore {
  metric: string;
  value: number;
}

export interface BenchmarkAurocResult {
  metric: string;
  auroc: number | null;
  reason?: string;
}

/**
 * Compute AUROC for each metric only when both classes present.
 * Returns auroc=null with a reason string otherwise (single-class block).
 */
export function computeBenchmarkAurocs(
  benchmarkType: BenchmarkType,
  perSampleScores: Record<string, number[]>,
  labels: (0 | 1 | boolean)[],
): BenchmarkAurocResult[] {
  const single = benchmarkType === "single-class geometry only";
  return Object.entries(perSampleScores).map(([metric, scores]) => {
    if (single) {
      return {
        metric,
        auroc: null,
        reason: "AUROC cannot be estimated from a single-class benchmark.",
      };
    }
    const v = auroc(scores, labels);
    if (Number.isNaN(v)) {
      return { metric, auroc: null, reason: "Degenerate scores or missing class." };
    }
    return { metric, auroc: v };
  });
}

export function benchmarkToCsv(
  benchmarkType: BenchmarkType,
  rows: BenchmarkMetricScore[],
  aurocs: BenchmarkAurocResult[],
): string {
  const aurocByMetric = new Map(aurocs.map((a) => [a.metric, a]));
  const header = ["metric", "value", "auroc", "benchmark_type", "note"];
  const body = rows.map((r) => {
    const a = aurocByMetric.get(r.metric);
    return [
      r.metric,
      Number.isFinite(r.value) ? r.value.toFixed(4) : "",
      a && a.auroc != null ? a.auroc.toFixed(4) : "",
      benchmarkType,
      a?.reason ?? "",
    ];
  });
  return [header, ...body]
    .map((row) =>
      row
        .map((c) => {
          const s = String(c);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}
