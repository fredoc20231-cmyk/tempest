import { describe, it, expect, beforeEach } from "vitest";
import { inferDatasetContext } from "./dataIntelligenceEngine";
import { interpretOutcomes } from "./outcomeInterpreter";
import { askTempest, REFUSAL } from "./askTempest";
import {
  getSessionContext,
  rememberColumnMapping,
  rememberModuleResult,
  rememberUserOverride,
  resetSessionContext,
} from "./sessionLearning";

// jsdom-ish sessionStorage shim for vitest node env
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
  key() { return null; }
  get length() { return this.m.size; }
}
beforeEach(() => {
  (globalThis as any).window = { sessionStorage: new MemoryStorage() };
  resetSessionContext();
});

describe("DataIntelligenceEngine", () => {
  it("endpoint dataset → endpoint_comparison with state-separation guidance", () => {
    const ctx = inferDatasetContext({
      columns: ["sample_id", "condition", "tpm_geneA"],
      sample_rows: Array.from({ length: 60 }, (_, i) => ({
        sample_id: `s${i}`,
        condition: i < 30 ? "A" : "B",
        tpm_geneA: Math.random(),
      })),
    });
    expect(ctx.dataset_type).toBe("endpoint_comparison");
    expect(ctx.evidence_type).toBe("endpoint");
    expect(ctx.validity_status).toBe("full_fTTI_valid");
    const out = interpretOutcomes(ctx, { fTTI_primary: 5.2 });
    expect(out.primary_outcome).toMatch(/state separation/);
    expect(out.primary_outcome).not.toMatch(/predicts? resistance/i);
  });

  it("endpoint asking about prediction → blocked / disallowed", () => {
    const ctx = inferDatasetContext({
      columns: ["condition"],
      group_counts: { A: 30, B: 30 },
    });
    rememberColumnMapping(ctx.detected_columns, ctx);
    const ans = askTempest("Can I claim prediction here?");
    expect(ans.answer).toMatch(/disallowed/i);
    expect(ans.refused).toBe(false);
  });

  it("n < 25 per condition → zN_only validity", () => {
    const ctx = inferDatasetContext({
      columns: ["condition"],
      group_counts: { A: 12, B: 30 },
    });
    expect(ctx.validity_status).toBe("zN_only");
    expect(ctx.warnings.some((w) => /n=12/.test(w))).toBe(true);
  });

  it("longitudinal ≥3 timepoints without phenotype → retrospective trajectory", () => {
    const rows = [];
    for (let g of ["A", "B"]) {
      for (let t of ["D0", "D7", "D14"]) {
        for (let i = 0; i < 15; i++) rows.push({ condition: g, timepoint: t, sample_id: `s_${g}_${t}_${i}` });
      }
    }
    const ctx = inferDatasetContext({
      columns: ["sample_id", "condition", "timepoint"],
      sample_rows: rows,
    });
    expect(ctx.dataset_type).toBe("longitudinal_timecourse");
    expect(ctx.evidence_type).toBe("longitudinal_retrospective");
    const out = interpretOutcomes(ctx, {});
    expect(out.primary_outcome).toMatch(/retrospective trajectory/i);
  });

  it("longitudinal with phenotype and lead_time > 0 → early-warning candidate", () => {
    const rows = [];
    for (let g of ["A", "B"]) {
      for (let t of ["D0", "D7", "D14"]) {
        for (let i = 0; i < 15; i++)
          rows.push({ condition: g, timepoint: t, outcome: g === "A" ? 1 : 0, sample_id: `s_${g}_${t}_${i}` });
      }
    }
    const ctx = inferDatasetContext({
      columns: ["sample_id", "condition", "timepoint", "outcome"],
      sample_rows: rows,
    });
    expect(ctx.evidence_type).toBe("longitudinal_with_outcome");
    const out = interpretOutcomes(ctx, { lead_time: 2.5 });
    expect(out.primary_outcome).toMatch(/early-warning candidate/);
    expect(out.manuscript_safe_summary).toMatch(/early-warning candidate/);
  });

  it("neoantigen table detected from peptide/allele/percent_rank", () => {
    const ctx = inferDatasetContext({
      columns: ["gene", "peptide", "allele", "percent_rank"],
    });
    expect(ctx.omics_type).toBe("neoantigen");
    expect(ctx.dataset_type).toBe("neoantigen_prioritization");
    expect(ctx.recommended_modules).toContain("neoantigen");
  });

  it("single-class benchmark → AUROC blocked in interpretBenchmark", () => {
    const ctx = inferDatasetContext({
      columns: ["condition"],
      group_counts: { A: 50 },
    });
    expect(ctx.validity_status).toBe("insufficient_groups");
    const out = interpretOutcomes(ctx, { benchmark_classes: 1 });
    expect(
      out.reviewer_risk_flags.some((f) => /AUROC cannot be computed/i.test(f)),
    ).toBe(true);
  });
});

describe("AskTempest", () => {
  it("refuses unsupported claims", () => {
    rememberColumnMapping({
      condition_column: "condition",
      timepoint_column: null,
      phenotype_column: null,
      sample_id_column: "sample_id",
    });
    const ans = askTempest("Will my patient respond to therapy?");
    expect(ans.refused).toBe(true);
    expect(ans.answer.startsWith(REFUSAL)).toBe(true);
  });

  it("refuses when no session context exists", () => {
    const ans = askTempest("Can I claim prediction?");
    expect(ans.refused).toBe(true);
  });
});

describe("session memory + outcome interpreter", () => {
  it("stores user-selected columns", () => {
    rememberUserOverride("condition_column", "treatment_arm");
    const s = getSessionContext();
    expect(s.user_overrides.condition_column).toBe("treatment_arm");
  });

  it("stores module results", () => {
    rememberModuleResult("neoantigen", { top_candidate: { gene: "Amz1" } });
    const s = getSessionContext();
    expect(s.module_results[0].module).toBe("neoantigen");
  });

  it("outcome interpreter returns manuscript_safe_summary", () => {
    const ctx = inferDatasetContext({
      columns: ["condition"],
      group_counts: { A: 30, B: 30 },
    });
    const out = interpretOutcomes(ctx, { fTTI_primary: 4.1 });
    expect(typeof out.manuscript_safe_summary).toBe("string");
    expect(out.manuscript_safe_summary.length).toBeGreaterThan(0);
    // must not contain prohibited phrases that aren't auto-replaceable
    expect(out.manuscript_safe_summary).not.toMatch(/clinical-grade/i);
    expect(out.manuscript_safe_summary).not.toMatch(/validated threshold/i);
  });
});
