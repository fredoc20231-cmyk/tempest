/**
 * Data Intelligence Engine — infers dataset context from a column manifest
 * (and optional row sample) so the rest of TEMPEST can route the analysis
 * correctly without forcing the user to declare their study design.
 *
 * Pure functions; no I/O. Safe to call client-side.
 */

export type DatasetType =
  | "endpoint_comparison"
  | "longitudinal_timecourse"
  | "prospective_validation"
  | "synthetic_demo"
  | "neoantigen_prioritization"
  | "benchmark_dataset"
  | "unknown";

export type OmicsType =
  | "RNA-seq"
  | "ATAC-seq"
  | "ChIP-seq"
  | "multi-omics"
  | "neoantigen"
  | "unknown";

export type EvidenceType =
  | "endpoint"
  | "longitudinal_retrospective"
  | "longitudinal_with_outcome"
  | "prospective"
  | "synthetic_ground_truth";

export type ValidityStatus =
  | "full_fTTI_valid"
  | "zN_only"
  | "invalid_metadata"
  | "insufficient_groups";

export type RecommendedModule =
  | "QC"
  | "fTTI"
  | "benchmark"
  | "longitudinal"
  | "neoantigen"
  | "report";

export interface DetectedColumns {
  condition_column: string | null;
  timepoint_column: string | null;
  phenotype_column: string | null;
  sample_id_column: string | null;
}

export interface DataIntelligenceInput {
  columns: string[];
  sample_rows?: Record<string, unknown>[];
  group_counts?: Record<string, number>;
  prospective_flag?: boolean;
  holdout_outcomes?: boolean;
  synthetic?: boolean;
}

export interface DatasetContext {
  dataset_type: DatasetType;
  omics_type: OmicsType;
  evidence_type: EvidenceType;
  validity_status: ValidityStatus;
  recommended_modules: RecommendedModule[];
  detected_columns: DetectedColumns;
  group_counts: Record<string, number>;
  min_per_group: number | null;
  ordered_timepoints: number | null;
  warnings: string[];
}

const lc = (s: string) => s.toLowerCase().replace(/[\s_.-]+/g, "");

const CONDITION_KEYS = ["condition", "group", "arm", "cohort", "class", "label", "treatment"];
const TIMEPOINT_KEYS = ["timepoint", "time", "day", "week", "visit", "tp", "stage"];
const PHENOTYPE_KEYS = ["phenotype", "outcome", "response", "survival", "progression", "event", "status"];
const SAMPLE_KEYS = ["sample", "sampleid", "patient", "patientid", "donor", "id"];

const NEOANTIGEN_KEYS = ["peptide", "allele", "percentrank", "percent_rank", "binder"];
const RNASEQ_KEYS = ["tpm", "fpkm", "counts", "geneid", "ensembl"];
const ATAC_KEYS = ["peak", "atac", "openchromatin"];
const CHIP_KEYS = ["chip", "h3k", "histone"];

function findColumn(columns: string[], keys: string[]): string | null {
  for (const c of columns) {
    const k = lc(c);
    if (keys.some((kw) => k === lc(kw) || k.includes(lc(kw)))) return c;
  }
  return null;
}

function detectOmics(columns: string[]): OmicsType {
  const lcs = columns.map(lc);
  const flags: OmicsType[] = [];
  if (NEOANTIGEN_KEYS.some((k) => lcs.some((c) => c.includes(lc(k))))) flags.push("neoantigen");
  if (RNASEQ_KEYS.some((k) => lcs.some((c) => c.includes(lc(k))))) flags.push("RNA-seq");
  if (ATAC_KEYS.some((k) => lcs.some((c) => c.includes(lc(k))))) flags.push("ATAC-seq");
  if (CHIP_KEYS.some((k) => lcs.some((c) => c.includes(lc(k))))) flags.push("ChIP-seq");
  if (flags.length === 0) return "unknown";
  if (flags.length === 1) return flags[0];
  if (flags.includes("neoantigen") && flags.length === 1) return "neoantigen";
  return "multi-omics";
}

function countUnique(rows: Record<string, unknown>[], col: string): number {
  const s = new Set<string>();
  for (const r of rows) {
    const v = r?.[col];
    if (v != null) s.add(String(v));
  }
  return s.size;
}

function tallyByColumn(
  rows: Record<string, unknown>[],
  col: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const v = r?.[col];
    if (v == null) continue;
    const k = String(v);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function inferDatasetContext(input: DataIntelligenceInput): DatasetContext {
  const { columns = [], sample_rows = [], prospective_flag, holdout_outcomes, synthetic } = input;
  const warnings: string[] = [];

  const detected: DetectedColumns = {
    condition_column: findColumn(columns, CONDITION_KEYS),
    timepoint_column: findColumn(columns, TIMEPOINT_KEYS),
    phenotype_column: findColumn(columns, PHENOTYPE_KEYS),
    sample_id_column: findColumn(columns, SAMPLE_KEYS),
  };

  const omics_type = detectOmics(columns);

  // Group counts: prefer caller-supplied, else derive from sample rows.
  let group_counts = input.group_counts ?? {};
  if (Object.keys(group_counts).length === 0 && detected.condition_column && sample_rows.length) {
    group_counts = tallyByColumn(sample_rows, detected.condition_column);
  }
  const groupKeys = Object.keys(group_counts);
  const min_per_group = groupKeys.length ? Math.min(...groupKeys.map((k) => group_counts[k])) : null;

  // Ordered timepoints
  let ordered_timepoints: number | null = null;
  if (detected.timepoint_column && sample_rows.length) {
    ordered_timepoints = countUnique(sample_rows, detected.timepoint_column);
  }

  // ---- dataset_type
  let dataset_type: DatasetType = "unknown";
  if (synthetic) dataset_type = "synthetic_demo";
  else if (omics_type === "neoantigen") dataset_type = "neoantigen_prioritization";
  else if (prospective_flag || holdout_outcomes) dataset_type = "prospective_validation";
  else if (ordered_timepoints != null && ordered_timepoints >= 3) dataset_type = "longitudinal_timecourse";
  else if (groupKeys.length >= 2 && (ordered_timepoints == null || ordered_timepoints < 3))
    dataset_type = "endpoint_comparison";
  else if (groupKeys.length >= 2 && detected.phenotype_column) dataset_type = "benchmark_dataset";

  // ---- evidence_type
  let evidence_type: EvidenceType = "endpoint";
  if (synthetic) evidence_type = "synthetic_ground_truth";
  else if (prospective_flag || holdout_outcomes) evidence_type = "prospective";
  else if (ordered_timepoints != null && ordered_timepoints >= 3) {
    evidence_type = detected.phenotype_column ? "longitudinal_with_outcome" : "longitudinal_retrospective";
  }

  // ---- validity_status
  let validity_status: ValidityStatus;
  if (groupKeys.length > 0 && groupKeys.length < 2 && dataset_type !== "neoantigen_prioritization") {
    validity_status = "insufficient_groups";
    warnings.push("Fewer than 2 condition groups — composite fTTI is suppressed.");
  } else if (min_per_group != null && min_per_group < 25) {
    validity_status = "zN_only";
    warnings.push(`Smallest group has n=${min_per_group} (<25). Only z_N is reportable; composite fTTI suppressed.`);
  } else if (
    dataset_type === "unknown" &&
    !detected.condition_column &&
    !detected.timepoint_column &&
    omics_type === "unknown"
  ) {
    validity_status = "invalid_metadata";
    warnings.push("No recognizable condition, timepoint, or omics columns detected.");
  } else {
    validity_status = "full_fTTI_valid";
  }

  if (!detected.sample_id_column) warnings.push("No sample-ID column detected; downstream joins may be ambiguous.");
  if (dataset_type === "endpoint_comparison")
    warnings.push("Endpoint design: prediction language is disallowed; state-separation only.");
  if (evidence_type === "longitudinal_retrospective")
    warnings.push("Longitudinal without phenotype: early-warning claims are not supported.");

  // ---- recommended_modules
  const mods = new Set<RecommendedModule>(["QC", "report"]);
  if (dataset_type === "neoantigen_prioritization") mods.add("neoantigen");
  if (
    validity_status === "full_fTTI_valid" &&
    (dataset_type === "endpoint_comparison" ||
      dataset_type === "longitudinal_timecourse" ||
      dataset_type === "prospective_validation")
  )
    mods.add("fTTI");
  if (groupKeys.length >= 2) mods.add("benchmark");
  if (ordered_timepoints != null && ordered_timepoints >= 3) mods.add("longitudinal");

  return {
    dataset_type,
    omics_type,
    evidence_type,
    validity_status,
    recommended_modules: Array.from(mods),
    detected_columns: detected,
    group_counts,
    min_per_group,
    ordered_timepoints,
    warnings,
  };
}
