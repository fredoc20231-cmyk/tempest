/**
 * Outcome interpreter — synthesizes a manuscript-safe outcome summary from
 * a DatasetContext + module results. All language is funnelled through the
 * claim audit before being returned, so any prohibited phrase is replaced
 * or surfaced as a reviewer risk flag.
 */
import type { DatasetContext } from "./dataIntelligenceEngine";
import {
  explainAllowedClaims,
  explainEvidenceType,
  interpretBenchmark,
  interpretLongitudinal,
  interpretNeoantigenCandidate,
  recommendNextExperiment,
  type NeoantigenLike,
} from "./tempestKnowledgeBase";
import { evaluateExportSafety } from "@/lib/audit/claimAudit";

export interface OutcomeResults {
  fTTI_primary?: number | null;
  fTTI_GCT?: number | null;
  lead_time?: number | null;
  benchmark_classes?: number;
  auroc?: number | null;
  top_neoantigen?: NeoantigenLike | null;
  immunogenicity_validated?: boolean;
}

export interface OutcomeInterpretation {
  primary_outcome: string;
  biological_interpretation: string;
  statistical_interpretation: string;
  limitations: string[];
  next_best_validation_step: string;
  manuscript_safe_summary: string;
  reviewer_risk_flags: string[];
}

function primaryOutcome(ctx: DatasetContext, r: OutcomeResults): string {
  if (ctx.dataset_type === "neoantigen_prioritization") {
    return r.top_neoantigen
      ? `Top candidate: ${r.top_neoantigen.gene} — ${r.top_neoantigen.manuscript_label ?? "computationally nominated candidate"}.`
      : "Neoantigen prioritization completed; no Tier 1 candidate identified.";
  }
  if (ctx.evidence_type === "endpoint") {
    return r.fTTI_primary != null
      ? `Strong fTTI_primary = ${r.fTTI_primary.toFixed(2)} indicates molecular state separation between the uploaded groups. Because no ordered timepoint or phenotype lead-time is present, this supports endpoint state separation, not transition prediction.`
      : "Endpoint state separation analysis completed.";
  }
  if (ctx.evidence_type === "longitudinal_retrospective")
    return "fTTI changes across ordered timepoints, supporting retrospective trajectory structure. Without phenotype timing, early-warning claims are not supported.";
  if (ctx.evidence_type === "longitudinal_with_outcome") {
    if (typeof r.lead_time === "number" && r.lead_time > 0)
      return `fTTI threshold crossing precedes phenotype crossing by ${r.lead_time.toFixed(2)} time units. This supports an early-warning candidate result requiring prospective validation.`;
    return "Longitudinal with phenotype, but lead_time ≤ 0 — retrospective trajectory only.";
  }
  if (ctx.evidence_type === "prospective")
    return "Prospective evaluation against held-out outcomes; performance is descriptive of this cohort only.";
  return "Method-validation run on synthetic ground truth; biological claims do not transfer.";
}

function biological(ctx: DatasetContext, r: OutcomeResults): string {
  if (ctx.dataset_type === "neoantigen_prioritization" && r.top_neoantigen)
    return interpretNeoantigenCandidate(r.top_neoantigen);
  if (ctx.evidence_type === "endpoint")
    return "Group geometry differs in latent space; this is consistent with established state separation between sampled conditions.";
  if (
    ctx.evidence_type === "longitudinal_retrospective" ||
    ctx.evidence_type === "longitudinal_with_outcome"
  )
    return interpretLongitudinal(ctx, r.lead_time ?? null);
  if (ctx.evidence_type === "prospective")
    return "Held-out outcomes provide an opportunity to test temporal claims; effect size must be reported alongside confidence intervals.";
  return "Synthetic generators target known topology classes; no biological inference is implied.";
}

function statistical(ctx: DatasetContext, r: OutcomeResults): string {
  const bits: string[] = [];
  if (ctx.validity_status === "insufficient_groups") bits.push("Composite fTTI suppressed: <2 groups.");
  if (ctx.validity_status === "zN_only")
    bits.push(`Composite fTTI suppressed: smallest group n=${ctx.min_per_group} < 25. Only z_N reportable.`);
  if (r.fTTI_primary != null) bits.push(`fTTI_primary (VR-PH) = ${r.fTTI_primary.toFixed(3)}.`);
  if (r.fTTI_GCT != null) bits.push(`fTTI_GCT (legacy) = ${r.fTTI_GCT.toFixed(3)}.`);
  if (typeof r.auroc === "number") bits.push(`AUROC = ${r.auroc.toFixed(3)}.`);
  if (r.benchmark_classes != null && r.benchmark_classes < 2)
    bits.push("AUROC blocked — single-class benchmark.");
  return bits.length ? bits.join(" ") : "No composite statistics reportable under current validity gate.";
}

function limitations(ctx: DatasetContext, r: OutcomeResults): string[] {
  const out = [...ctx.warnings];
  out.push("fTTI threshold is proof-of-concept only; not validated for clinical stratification.");
  if (ctx.dataset_type === "neoantigen_prioritization" && !r.immunogenicity_validated)
    out.push("No immunogenicity validation: vaccine-target language is disallowed.");
  if (ctx.evidence_type === "endpoint")
    out.push("Cross-sectional design precludes any temporal or predictive interpretation.");
  if (ctx.evidence_type === "synthetic_ground_truth")
    out.push("Synthetic data; results do not transfer to biological cohorts.");
  return Array.from(new Set(out));
}

export function interpretOutcomes(
  context: DatasetContext,
  results: OutcomeResults = {},
): OutcomeInterpretation {
  const primary_outcome = primaryOutcome(context, results);
  const biological_interpretation = biological(context, results);
  const statistical_interpretation = statistical(context, results);
  const limits = limitations(context, results);
  const next_best_validation_step = recommendNextExperiment(context, {
    lead_time: results.lead_time ?? null,
    top_neoantigen: results.top_neoantigen?.gene ?? null,
  });

  const draft = [primary_outcome, biological_interpretation, statistical_interpretation].join(" ");
  const safety = evaluateExportSafety(draft, {
    evidence_type:
      context.evidence_type === "endpoint"
        ? "endpoint"
        : context.evidence_type === "prospective"
        ? "prospective"
        : "longitudinal",
    lead_time: results.lead_time ?? null,
    longitudinal_data:
      context.evidence_type === "longitudinal_retrospective" ||
      context.evidence_type === "longitudinal_with_outcome",
    immunogenicity_validated: results.immunogenicity_validated === true,
  });

  const reviewer_risk_flags: string[] = [];
  if (!safety.publicationReady) {
    for (const p of safety.audit.blockingPhrases)
      reviewer_risk_flags.push(`Blocked phrase: "${p}"`);
  }
  const { allowed, disallowed } = explainAllowedClaims({
    evidence_type: context.evidence_type === "endpoint" ? "endpoint" : context.evidence_type,
    lead_time: results.lead_time ?? null,
    longitudinal_data:
      context.evidence_type === "longitudinal_retrospective" ||
      context.evidence_type === "longitudinal_with_outcome",
    immunogenicity_validated: results.immunogenicity_validated === true,
  });
  reviewer_risk_flags.push(`Evidence type: ${explainEvidenceType(context.evidence_type)}`);
  reviewer_risk_flags.push(`Allowed claims: ${allowed.join(", ")}`);
  reviewer_risk_flags.push(`Disallowed claims: ${disallowed.join(", ")}`);

  // Benchmark guidance appended where appropriate.
  if (results.benchmark_classes != null)
    reviewer_risk_flags.push(interpretBenchmark(context));

  return {
    primary_outcome,
    biological_interpretation,
    statistical_interpretation,
    limitations: limits,
    next_best_validation_step,
    manuscript_safe_summary: safety.sanitized,
    reviewer_risk_flags,
  };
}
