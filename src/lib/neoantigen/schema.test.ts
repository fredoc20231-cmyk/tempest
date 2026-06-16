import { describe, it, expect } from "vitest";
import {
  tierNeoantigens,
  scoreOne,
  validationPlanCSV,
  classifyBinder,
  type NeoantigenInput,
} from "./schema";

const base: NeoantigenInput = {
  gene: "Foo",
  mutation: "X1Y",
  peptide: "ABCDEFGHI",
  allele: "H-2-Db",
  percentRank: 0.3,
  n_timepoints: 3,
  expression_status: "confirmed",
  germline_status: "somatic",
  source: "TEST",
  variant_type: "snv",
};

describe("neoantigen safeguards", () => {
  it("MEIS1 rs239018671 is always EXCLUDED, never Tier 1", () => {
    const s = scoreOne({
      ...base,
      gene: "MEIS1",
      mutation: "F378X",
      dbSNP_id: "rs239018671",
      germline_status: "germline-risk",
    });
    expect(s.excluded).toBe(true);
    expect(s.tier).toBe(3);
    expect(s.status_label).toMatch(/EXCLUDED/);
    // lowercase + legacy dbSNP alias too
    const s2 = scoreOne({ ...base, gene: "meis1", dbSNP: "rs239018671" } as any);
    expect(s2.excluded).toBe(true);
  });

  it("germline-risk strong binder cannot be Tier 1", () => {
    const s = scoreOne({ ...base, germline_status: "germline-risk", percentRank: 0.2 });
    expect(s.tier).not.toBe(1);
  });

  for (const gs of ["germline", "dbSNP-overlap", "pending-tail-DNA"] as const) {
    it(`${gs} strong binder cannot be Tier 1`, () => {
      const s = scoreOne({ ...base, germline_status: gs, percentRank: 0.1 });
      expect(s.tier).not.toBe(1);
    });
  }

  it("missing peptide cannot be Tier 1", () => {
    const s = scoreOne({ ...base, peptide: "" });
    expect(s.tier).not.toBe(1);
  });

  it("Amz1 ranks above Csprs when Csprs expression is unconfirmed", () => {
    const rows: NeoantigenInput[] = [
      { ...base, gene: "Csprs", mutation: "Q208R", peptide: "RVNLPEFKL", percentRank: 0.41, n_timepoints: 2, expression_status: "unknown" },
      { ...base, gene: "Amz1", mutation: "E78Q", peptide: "QLFEYTRMV", percentRank: 0.32, n_timepoints: 4, expression_status: "confirmed" },
    ];
    const out = tierNeoantigens(rows);
    const amzIdx = out.findIndex((r) => r.gene.toLowerCase() === "amz1");
    const csprsIdx = out.findIndex((r) => r.gene.toLowerCase() === "csprs");
    expect(amzIdx).toBeLessThan(csprsIdx);
    expect(out[amzIdx].tier).toBe(1);
    expect(out[csprsIdx].tier).not.toBe(1);
  });

  it("fusion non-binder becomes transcript biomarker", () => {
    const s = scoreOne({ ...base, variant_type: "fusion", percentRank: 3.5 });
    expect(s.binder).toBe("non-binder");
    expect(s.status_label).toBe("TRANSCRIPT BIOMARKER");
    expect(s.manuscript_label).toMatch(/transcript-level biomarker/);
    expect(s.tier).toBe(3);
  });

  it("classifyBinder boundaries", () => {
    expect(classifyBinder(0.5)).toBe("strong");
    expect(classifyBinder(0.51)).toBe("weak");
    expect(classifyBinder(2.0)).toBe("weak");
    expect(classifyBinder(2.01)).toBe("non-binder");
  });

  it("validation export contains Sanger, qRT-PCR, ELISpot, tetramer", () => {
    const out = tierNeoantigens([base]);
    const csv = validationPlanCSV(out);
    expect(csv).toMatch(/Sanger tail DNA/);
    expect(csv).toMatch(/qRT-PCR expression/);
    expect(csv).toMatch(/ELISpot/);
    expect(csv).toMatch(/Tetramer/);
  });
});
