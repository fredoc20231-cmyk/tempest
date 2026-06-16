/**
 * TEMPEST embedded knowledge base — deterministic rule explanations grounded
 * in the audit safeguards. No model calls; safe for client-side use.
 */
import type {
  DatasetContext,
  EvidenceType,
  ValidityStatus,
} from "./dataIntelligenceEngine";

export interface NeoantigenLike {
  gene: string;
  binder?: "strong" | "weak" | "non-binder";
  percentRank?: number;
  expression_status?: "confirmed" | "absent" | "unknown";
  germline_status?: string;
  n_timepoints?: number;
  variant_type?: "snv" | "indel" | "fusion";
  tier?: 1 | 2 | 3;
  excluded?: boolean;
  manuscript_label?: string;
}

export function explainValidityFloor(n: number): string {
  if (n < 25)
    return `n=${n} is below the proof-of-concept validity floor (n ≥ 25 per condition). Composite fTTI is suppressed; only z_N is reportable.`;
  return `n=${n} meets the proof-of-concept validity floor (≥25). Composite fTTI = z_B + z_L^VR + z_N is computable; the threshold remains proof-of-concept only.`;
}

export function explainEvidenceType(evidence_type: EvidenceType): string {
  switch (evidence_type) {
    case "endpoint":
      return "Endpoint comparison: quantifies established state separation between groups. No temporal claim is made.";
    case "longitudinal_retrospective":
      return "Longitudinal retrospective: trajectory structure across ordered timepoints. No phenotype timing, so early-warning claims are not supported.";
    case "longitudinal_with_outcome":
      return "Longitudinal with phenotype: trajectory plus outcome timing. Early-warning claims require lead_time > 0.";
    case "prospective":
      return "Prospective: held-out outcome labels enable prediction testing.";
    case "synthetic_ground_truth":
      return "Synthetic ground truth: method-validation only; no biological claim transfers.";
  }
}

export interface AllowedClaimsCtx {
  evidence_type: EvidenceType;
  lead_time?: number | null;
  longitudinal_data?: boolean;
  immunogenicity_validated?: boolean;
}

export function explainAllowedClaims(ctx: AllowedClaimsCtx): {
  allowed: string[];
  disallowed: string[];
} {
  const allowed: string[] = ["research-use only", "hypothesis-generating observation"];
  const disallowed: string[] = [
    "clinical-grade",
    "validated threshold",
    "therapeutic recommendation",
  ];
  const isLong =
    ctx.evidence_type === "longitudinal_retrospective" ||
    ctx.evidence_type === "longitudinal_with_outcome" ||
    ctx.evidence_type === "prospective" ||
    ctx.longitudinal_data === true;
  const isPro = ctx.evidence_type === "prospective";
  const leadOk = typeof ctx.lead_time === "number" && ctx.lead_time > 0;

  if (ctx.evidence_type === "endpoint") {
    allowed.push("state separation");
    disallowed.push("transition dynamics", "early warning", "prospective prediction", "predicts resistance");
  }
  if (isLong) allowed.push("transition dynamics", "retrospective trajectory");
  if (leadOk) allowed.push("early-warning candidate");
  else disallowed.push("early warning");
  if (isPro) allowed.push("prospective prediction");
  else disallowed.push("prospective prediction");
  allowed.push(
    ctx.immunogenicity_validated
      ? "vaccine target"
      : "computationally nominated candidate pending immunogenicity validation",
  );
  if (!ctx.immunogenicity_validated) disallowed.push("vaccine target");

  return { allowed: Array.from(new Set(allowed)), disallowed: Array.from(new Set(disallowed)) };
}

export function recommendModules(context: DatasetContext): string[] {
  return context.recommended_modules;
}

export function recommendNextExperiment(
  context: DatasetContext,
  results?: { lead_time?: number | null; top_neoantigen?: string | null },
): string {
  if (context.validity_status === "insufficient_groups")
    return "Add a second condition group (≥25 samples) before any composite fTTI claim.";
  if (context.validity_status === "zN_only")
    return `Expand sampling to ≥25 per group (currently n=${context.min_per_group}); only z_N is reportable until then.`;
  if (context.dataset_type === "neoantigen_prioritization")
    return "Run Sanger tail-DNA confirmation, qRT-PCR expression, then peptide synthesis for top Tier 1 candidates.";
  if (context.evidence_type === "longitudinal_with_outcome" && (results?.lead_time ?? 0) > 0)
    return "Design a prospective held-out cohort to test the early-warning candidate under blinded conditions.";
  if (context.evidence_type === "longitudinal_retrospective")
    return "Acquire phenotype timing (event/outcome) to enable lead-time analysis.";
  if (context.evidence_type === "endpoint")
    return "Acquire ≥3 ordered timepoints with phenotype timing to move from state separation to early-warning candidacy.";
  return "Proceed to Report; outputs are hypothesis-generating only.";
}

export function interpretNeoantigenCandidate(c: NeoantigenLike): string {
  if (c.excluded) return `${c.gene}: EXCLUDED — germline-risk or hard-blocked.`;
  const gene = c.gene.toLowerCase();
  if (gene === "amz1" && c.expression_status === "confirmed" && (c.n_timepoints ?? 0) >= 3)
    return "Amz1 is the lead computational candidate pending immunogenicity validation because it is strong-binding, RNA-confirmed, somatic, and recurrent across ≥3 timepoints.";
  if (gene === "csprs")
    return "Csprs is an expression-gated strong binder; promotion requires confirmed RNA expression.";
  if (c.variant_type === "fusion" && c.binder === "non-binder")
    return `${c.gene} is a transcript-level biomarker only; MHC binding and expression not validated.`;
  const safe = c.manuscript_label ?? "computationally nominated candidate";
  return `${c.gene}: ${safe} (binder=${c.binder ?? "unknown"}, expression=${c.expression_status ?? "unknown"}).`;
}

export function interpretBenchmark(context: DatasetContext): string {
  const groups = Object.keys(context.group_counts).length;
  if (groups < 2) return "Single-class geometry only — AUROC cannot be computed.";
  if (context.min_per_group != null && context.min_per_group < 25)
    return `Binary/multi-class benchmark with n=${context.min_per_group} in the smallest group: report descriptive geometry only, AUROC is unstable.`;
  return "Binary/multi-class benchmark with adequate sample size; AUROC and DA-distance are reportable.";
}

export function interpretLongitudinal(
  context: DatasetContext,
  leadTime: number | null | undefined,
): string {
  if (context.evidence_type === "longitudinal_retrospective")
    return "Retrospective trajectory across ordered timepoints; early-warning claims are not supported without phenotype timing.";
  if (context.evidence_type === "longitudinal_with_outcome") {
    if (typeof leadTime === "number" && leadTime > 0)
      return `fTTI threshold crossing precedes phenotype crossing by ${leadTime.toFixed(2)} time units — early-warning candidate result requiring prospective validation.`;
    return "Phenotype timing present but lead_time ≤ 0; this is retrospective trajectory only.";
  }
  return "Insufficient longitudinal structure (≥3 ordered timepoints required).";
}

export const KNOWLEDGE_FACTS = {
  validity_floor: "n ≥ 25 per condition; otherwise composite fTTI is suppressed.",
  threshold_status: "fTTI threshold is proof-of-concept only; not validated for clinical stratification.",
  clinical_recommendation: "TEMPEST does not issue clinical or therapeutic recommendations; outputs are research-use only.",
  prediction_rule: "Prediction language is disallowed unless evidence_type = prospective or lead_time > 0.",
  germline_rule: "Germline / germline-risk / dbSNP-overlap / pending-tail-DNA candidates cannot be Tier 1.",
  auroc_rule: "AUROC is blocked for single-class benchmarks.",
} as const;
