/**
 * Neoantigen schema, validation, and tiering safeguards.
 * Required fields enforced; germline candidates pushed out of Tier 1;
 * MEIS1 with dbSNP rs239018671 excluded entirely;
 * Amz1 with confirmed RNA outranks Csprs when Csprs lacks confirmation.
 */
export interface NeoantigenInput {
  gene: string;
  mutation: string;
  peptide: string;
  allele: string;
  percentRank: number;
  n_timepoints: number;
  expression_status: "confirmed" | "absent" | "unknown";
  germline_status: "somatic" | "germline" | "unknown";
  dbSNP?: string | null;
}

export interface NeoantigenScored extends NeoantigenInput {
  tier: 1 | 2 | 3;
  excluded?: boolean;
  reasons: string[];
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
];

export function validateRow(row: Partial<NeoantigenInput>): {
  ok: boolean;
  missing: string[];
} {
  const missing = REQUIRED_FIELDS.filter((f) => row[f] === undefined || row[f] === null || row[f] === "");
  return { ok: missing.length === 0, missing };
}

export function tierNeoantigens(rows: NeoantigenInput[]): NeoantigenScored[] {
  const scored: NeoantigenScored[] = rows.map((r) => {
    const reasons: string[] = [];

    // Hard exclusion: MEIS1 + dbSNP rs239018671
    if (r.gene === "MEIS1" && r.dbSNP === "rs239018671") {
      return { ...r, tier: 3, excluded: true, reasons: ["MEIS1 dbSNP rs239018671 — excluded as germline-risk variant"] };
    }

    // Germline → never Tier 1
    if (r.germline_status === "germline") {
      reasons.push("Germline status — restricted to Tier 3 (germline-risk)");
      return { ...r, tier: 3, reasons };
    }

    // Tiering by binding strength + expression
    let tier: 1 | 2 | 3 = 3;
    if (r.percentRank <= 0.5 && r.expression_status === "confirmed") tier = 1;
    else if (r.percentRank <= 2.0) tier = 2;
    else tier = 3;

    if (r.expression_status !== "confirmed") reasons.push("Expression not confirmed");
    if (r.n_timepoints < 2) reasons.push("Single-timepoint evidence only");

    return { ...r, tier, reasons };
  });

  // Apply Amz1 vs Csprs ordering rule
  const amz1 = scored.find((s) => s.gene.toLowerCase() === "amz1");
  const csprs = scored.find((s) => s.gene.toLowerCase() === "csprs");
  if (amz1 && csprs && amz1.expression_status === "confirmed" && csprs.expression_status !== "confirmed") {
    // ensure amz1 sorts above csprs
    amz1.reasons.push("Ranked above Csprs (confirmed RNA vs unconfirmed)");
    if (amz1.tier > 1) amz1.tier = 1;
    if (csprs.tier === 1) csprs.tier = 2;
  }

  return scored.sort((a, b) => {
    if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.percentRank - b.percentRank;
  });
}

export const DEMO_NEOANTIGENS: NeoantigenInput[] = [
  { gene: "Amz1", mutation: "E78Q", peptide: "QLFEYTRMV", allele: "H-2-Db", percentRank: 0.32, n_timepoints: 3, expression_status: "confirmed", germline_status: "somatic" },
  { gene: "Csprs", mutation: "Q208R", peptide: "RVNLPEFKL", allele: "H-2-Kb", percentRank: 0.41, n_timepoints: 2, expression_status: "unknown", germline_status: "somatic" },
  { gene: "MEIS1", mutation: "F378X", peptide: "TFFFXXMVLF", allele: "H-2-Db", percentRank: 0.28, n_timepoints: 4, expression_status: "confirmed", germline_status: "somatic", dbSNP: "rs239018671" },
  { gene: "Trp53", mutation: "R172H", peptide: "AAAGHILDF", allele: "H-2-Db", percentRank: 1.4, n_timepoints: 3, expression_status: "confirmed", germline_status: "somatic" },
  { gene: "BRCA2", mutation: "K3326*", peptide: "LSQLNKVEI", allele: "H-2-Kb", percentRank: 0.62, n_timepoints: 2, expression_status: "confirmed", germline_status: "germline" },
];
