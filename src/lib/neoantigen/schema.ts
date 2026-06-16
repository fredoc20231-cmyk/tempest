/**
 * Neoantigen schema, validation, tiering safeguards, and manuscript-safe language.
 *
 * Rules enforced:
 *  - Required fields gate (peptide missing => cannot be Tier 1).
 *  - Germline / germline-risk / dbSNP-overlap / pending-tail-DNA => excluded from Tier 1.
 *  - MEIS1 + dbSNP rs239018671 => hard EXCLUDED.
 *  - Amz1 ranks above Csprs when Amz1 RNA confirmed + recurrent (>=3 timepoints)
 *    and Csprs expression unconfirmed.
 *  - Fusion non-binder => transcript-level biomarker (not Tier 1).
 *  - Manuscript-safe language helpers: "computationally nominated candidate",
 *    no "vaccine target" unless somatic + RNA + immunogenicity validated.
 */

export type GermlineStatus =
  | "somatic"
  | "germline"
  | "germline-risk"
  | "dbSNP-overlap"
  | "pending-tail-DNA"
  | "unknown";

export type ExpressionStatus = "confirmed" | "absent" | "unknown";
export type ValidationStatus =
  | "none"
  | "sanger-pending"
  | "sanger-confirmed"
  | "qrt-pcr-confirmed"
  | "elispot-positive"
  | "tetramer-positive"
  | "in-vivo-validated";

export type BinderClass = "strong" | "weak" | "non-binder";

export interface NeoantigenInput {
  gene: string;
  mutation: string;
  peptide: string;
  allele: string;
  percentRank: number;
  n_timepoints: number;
  expression_status: ExpressionStatus;
  germline_status: GermlineStatus;
  source?: string;
  RNA_TPM?: number | null;
  validation_status?: ValidationStatus;
  dbSNP_id?: string | null;
  /** legacy alias for dbSNP_id */
  dbSNP?: string | null;
  variant_type?: "snv" | "indel" | "fusion";
  chromosome?: string;
}

export interface NeoantigenScored extends NeoantigenInput {
  tier: 1 | 2 | 3;
  excluded?: boolean;
  binder: BinderClass;
  reasons: string[];
  status_label: string;
  manuscript_label: string;
  score: number;
}

export const REQUIRED_FIELDS: (keyof NeoantigenInput)[] = [
  "gene",
  "mutation",
  "peptide",
  "allele",
  "percentRank",
  "n_timepoints",
  "expression_status",
  "germline_status",
  "source",
];

export function validateRow(row: Partial<NeoantigenInput>): {
  ok: boolean;
  missing: string[];
} {
  const missing = REQUIRED_FIELDS.filter(
    (f) => row[f] === undefined || row[f] === null || row[f] === "",
  );
  return { ok: missing.length === 0, missing };
}

export function classifyBinder(percentRank: number): BinderClass {
  if (percentRank <= 0.5) return "strong";
  if (percentRank <= 2.0) return "weak";
  return "non-binder";
}

const GERMLINE_RISK_STATUSES: GermlineStatus[] = [
  "germline",
  "germline-risk",
  "dbSNP-overlap",
  "pending-tail-DNA",
];

function isSexChromosome(chr?: string): boolean {
  if (!chr) return false;
  const c = chr.toUpperCase().replace(/^CHR/, "");
  return c === "X" || c === "Y";
}

function manuscriptLabel(s: {
  gene: string;
  binder: BinderClass;
  expression_status: ExpressionStatus;
  germline_status: GermlineStatus;
  variant_type?: "snv" | "indel" | "fusion";
  validation_status?: ValidationStatus;
}): string {
  const gene = s.gene.toLowerCase();
  if (gene === "csprs") return "expression-gated strong binder";
  if (gene === "amz1") return "lead computational candidate pending immunogenicity validation";
  if (s.variant_type === "fusion" && s.binder === "non-binder")
    return "transcript-level biomarker (MHC binding not validated)";
  if (
    s.germline_status === "somatic" &&
    s.expression_status === "confirmed" &&
    (s.validation_status === "elispot-positive" ||
      s.validation_status === "tetramer-positive" ||
      s.validation_status === "in-vivo-validated")
  )
    return "validated vaccine target";
  return "computationally nominated candidate";
}

export function scoreOne(r: NeoantigenInput): NeoantigenScored {
  const reasons: string[] = [];
  const dbSnp = r.dbSNP_id ?? r.dbSNP ?? null;
  const binder = classifyBinder(r.percentRank);

  // Hard exclusion: MEIS1 rs239018671 (any casing).
  if (r.gene.toLowerCase() === "meis1" && dbSnp === "rs239018671") {
    return {
      ...r,
      dbSNP_id: dbSnp,
      tier: 3,
      excluded: true,
      binder,
      score: -Infinity,
      reasons: ["MEIS1 dbSNP rs239018671 — germline-risk variant"],
      status_label: "EXCLUDED — germline rs239018671",
      manuscript_label: "excluded germline-risk variant",
    };
  }

  // Missing peptide => cannot be Tier 1.
  const missingPeptide = !r.peptide || r.peptide.trim() === "";
  if (missingPeptide) reasons.push("Missing peptide — cannot be Tier 1");

  // Germline-risk family => excluded from Tier 1.
  const germlineRisk = GERMLINE_RISK_STATUSES.includes(r.germline_status);
  if (germlineRisk) reasons.push(`${r.germline_status} — excluded from Tier 1`);

  // Sex-chromosome artifact risk.
  const sexChrRisk = isSexChromosome(r.chromosome);
  if (sexChrRisk) reasons.push("Sex-chromosome artifact risk");

  // Binder class notes.
  if (binder === "strong") reasons.push("Strong binder (%rank ≤ 0.5)");
  else if (binder === "weak") reasons.push("Weak binder (0.5 < %rank ≤ 2.0)");
  else reasons.push("Non-binder (%rank > 2.0)");

  // Expression / recurrence.
  const expressionConfirmed = r.expression_status === "confirmed";
  if (!expressionConfirmed) reasons.push("Expression unconfirmed (−)");
  else reasons.push("RNA expression confirmed (+)");
  const recurrent = r.n_timepoints >= 3;
  if (r.n_timepoints <= 1) reasons.push("Single-timepoint evidence only (−)");
  else if (recurrent) reasons.push(`Recurrent across ${r.n_timepoints} timepoints (+)`);

  // Somatic confirmation.
  const somaticConfirmed = r.germline_status === "somatic";
  if (somaticConfirmed) reasons.push("Somatic status confirmed (+)");

  // Fusion non-binder penalty.
  const fusionNonBinder = r.variant_type === "fusion" && binder === "non-binder";
  if (fusionNonBinder) reasons.push("Fusion non-binder — demoted to transcript biomarker");

  // Composite scoring.
  let score = 0;
  if (binder === "strong") score += 3;
  else if (binder === "weak") score += 1;
  if (expressionConfirmed) score += 2;
  if (recurrent) score += 2;
  else if (r.n_timepoints === 2) score += 1;
  if (somaticConfirmed) score += 1;
  if (!expressionConfirmed) score -= 1;
  if (r.n_timepoints <= 1) score -= 1;
  if (fusionNonBinder) score -= 3;
  if (sexChrRisk) score -= 1;

  // Tier assignment.
  let tier: 1 | 2 | 3;
  const tier1Eligible =
    !missingPeptide &&
    !germlineRisk &&
    binder === "strong" &&
    expressionConfirmed &&
    !fusionNonBinder;
  if (tier1Eligible) tier = 1;
  else if (binder === "strong" || binder === "weak") tier = 2;
  else tier = 3;

  let status_label = tier === 1 ? "TIER 1" : tier === 2 ? "TIER 2" : "TIER 3";
  if (fusionNonBinder) status_label = "TRANSCRIPT BIOMARKER";

  const manuscript_label = manuscriptLabel({
    gene: r.gene,
    binder,
    expression_status: r.expression_status,
    germline_status: r.germline_status,
    variant_type: r.variant_type,
    validation_status: r.validation_status,
  });

  return {
    ...r,
    dbSNP_id: dbSnp,
    tier,
    binder,
    reasons,
    score,
    status_label,
    manuscript_label,
  };
}

export function tierNeoantigens(rows: NeoantigenInput[]): NeoantigenScored[] {
  const scored = rows.map(scoreOne);

  // Amz1 vs Csprs ordering: when Amz1 RNA confirmed + recurrent (>=3) and Csprs unconfirmed.
  const amz1 = scored.find((s) => s.gene.toLowerCase() === "amz1");
  const csprs = scored.find((s) => s.gene.toLowerCase() === "csprs");
  if (
    amz1 &&
    csprs &&
    !amz1.excluded &&
    amz1.expression_status === "confirmed" &&
    amz1.n_timepoints >= 3 &&
    csprs.expression_status !== "confirmed"
  ) {
    amz1.reasons.push("Ranked above Csprs (Amz1 RNA confirmed + recurrent; Csprs expression unconfirmed)");
    csprs.reasons.push("Demoted below Amz1 pending expression confirmation");
    amz1.score += 5;
    if (csprs.tier === 1) csprs.tier = 2;
    // Ensure ordering by bumping Amz1 score above any Csprs score.
    if (csprs.score >= amz1.score) amz1.score = csprs.score + 1;
  }

  return scored.sort((a, b) => {
    if (!!a.excluded !== !!b.excluded) return a.excluded ? 1 : -1;
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (b.score !== a.score) return b.score - a.score;
    return a.percentRank - b.percentRank;
  });
}

/* -------------------------------------------------------------------------- */
/* Validation roadmap export                                                  */
/* -------------------------------------------------------------------------- */

export interface ValidationStep {
  step: number;
  assay: string;
  purpose: string;
  prerequisite: string;
  required_for_tier1: boolean;
}

export const VALIDATION_ROADMAP: ValidationStep[] = [
  { step: 1, assay: "Sanger tail DNA", purpose: "Confirm somatic vs germline origin", prerequisite: "Variant call from tumor WES/WGS", required_for_tier1: true },
  { step: 2, assay: "qRT-PCR expression", purpose: "Confirm allele-specific transcript expression", prerequisite: "Sanger somatic confirmation", required_for_tier1: true },
  { step: 3, assay: "Peptide synthesis", purpose: "Synthesize mutant peptide for downstream assays", prerequisite: "Somatic + expression confirmed", required_for_tier1: true },
  { step: 4, assay: "ELISpot", purpose: "Functional T-cell IFN-γ response", prerequisite: "Peptide synthesized", required_for_tier1: false },
  { step: 5, assay: "Tetramer staining", purpose: "Quantify antigen-specific CD8+ T cells", prerequisite: "ELISpot positive", required_for_tier1: false },
  { step: 6, assay: "In vivo validation (optional)", purpose: "Tumor protection / vaccination challenge", prerequisite: "ELISpot + tetramer positive", required_for_tier1: false },
];

export function validationPlanCSV(scored: NeoantigenScored[]): string {
  const header = [
    "candidate_id",
    "gene",
    "mutation",
    "peptide",
    "tier",
    "manuscript_label",
    "step",
    "assay",
    "purpose",
    "prerequisite",
    "required_for_tier1",
  ];
  const lines = [header.join(",")];
  const active = scored.filter((s) => !s.excluded);
  for (const s of active) {
    const id = `${s.gene}_${s.mutation}`.replace(/[^A-Za-z0-9_\-]/g, "_");
    for (const v of VALIDATION_ROADMAP) {
      lines.push(
        [
          id,
          s.gene,
          s.mutation,
          s.peptide,
          s.tier,
          JSON.stringify(s.manuscript_label),
          v.step,
          JSON.stringify(v.assay),
          JSON.stringify(v.purpose),
          JSON.stringify(v.prerequisite),
          v.required_for_tier1,
        ].join(","),
      );
    }
  }
  return lines.join("\n");
}

export function neoantigenTableCSV(scored: NeoantigenScored[]): string {
  const header = [
    "gene",
    "mutation",
    "peptide",
    "allele",
    "percent_rank",
    "binder",
    "n_timepoints",
    "expression_status",
    "RNA_TPM",
    "germline_status",
    "dbSNP_id",
    "validation_status",
    "variant_type",
    "source",
    "tier",
    "status_label",
    "manuscript_label",
    "score",
    "reasons",
  ];
  const lines = [header.join(",")];
  for (const s of scored) {
    lines.push(
      [
        s.gene,
        s.mutation,
        s.peptide,
        s.allele,
        s.percentRank,
        s.binder,
        s.n_timepoints,
        s.expression_status,
        s.RNA_TPM ?? "",
        s.germline_status,
        s.dbSNP_id ?? "",
        s.validation_status ?? "",
        s.variant_type ?? "",
        JSON.stringify(s.source ?? ""),
        s.tier,
        JSON.stringify(s.status_label),
        JSON.stringify(s.manuscript_label),
        s.score,
        JSON.stringify(s.reasons.join("; ")),
      ].join(","),
    );
  }
  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/* Demo data — reflects March 2026 catalog (Amz1 Tier 1, Csprs expression-gated) */
/* -------------------------------------------------------------------------- */
export const DEMO_NEOANTIGENS: NeoantigenInput[] = [
  {
    gene: "Amz1",
    mutation: "E78Q",
    peptide: "QLFEYTRMV",
    allele: "H-2-Db",
    percentRank: 0.32,
    n_timepoints: 4,
    expression_status: "confirmed",
    germline_status: "somatic",
    RNA_TPM: 14.2,
    validation_status: "qrt-pcr-confirmed",
    source: "DEMO/SYNTHETIC",
    variant_type: "snv",
  },
  {
    gene: "Csprs",
    mutation: "Q208R",
    peptide: "RVNLPEFKL",
    allele: "H-2-Kb",
    percentRank: 0.41,
    n_timepoints: 2,
    expression_status: "unknown",
    germline_status: "somatic",
    RNA_TPM: null,
    validation_status: "none",
    source: "DEMO/SYNTHETIC",
    variant_type: "snv",
  },
  {
    gene: "MEIS1",
    mutation: "F378X",
    peptide: "TFFFXXMVLF",
    allele: "H-2-Db",
    percentRank: 0.28,
    n_timepoints: 4,
    expression_status: "confirmed",
    germline_status: "germline-risk",
    dbSNP_id: "rs239018671",
    validation_status: "sanger-pending",
    source: "DEMO/SYNTHETIC",
    variant_type: "snv",
  },
  {
    gene: "Trp53",
    mutation: "R172H",
    peptide: "AAAGHILDF",
    allele: "H-2-Db",
    percentRank: 1.4,
    n_timepoints: 3,
    expression_status: "confirmed",
    germline_status: "somatic",
    RNA_TPM: 8.9,
    source: "DEMO/SYNTHETIC",
    variant_type: "snv",
  },
  {
    gene: "BRCA2",
    mutation: "K3326*",
    peptide: "LSQLNKVEI",
    allele: "H-2-Kb",
    percentRank: 0.62,
    n_timepoints: 2,
    expression_status: "confirmed",
    germline_status: "germline",
    source: "DEMO/SYNTHETIC",
    variant_type: "snv",
  },
  {
    gene: "FUS-DDIT3",
    mutation: "fusion",
    peptide: "MAEFPGRWG",
    allele: "H-2-Db",
    percentRank: 3.8,
    n_timepoints: 2,
    expression_status: "confirmed",
    germline_status: "somatic",
    source: "DEMO/SYNTHETIC",
    variant_type: "fusion",
  },
];
