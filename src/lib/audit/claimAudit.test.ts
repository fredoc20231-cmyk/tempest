import { describe, it, expect } from "vitest";
import {
  auditClaim,
  sanitizeClaim,
  evaluateExportSafety,
  DRAFT_AUDIT_WATERMARK,
} from "./claimAudit";

describe("ClaimAudit", () => {
  it("endpoint report containing 'predicts resistance' is blocked from raw text", () => {
    const text = "Our model predicts resistance in the endpoint cohort.";
    const audit = auditClaim(text, { evidence_type: "endpoint" });
    expect(audit.findings.length).toBeGreaterThan(0);
    const f = audit.findings.find((x) => x.phrase === "predicts resistance")!;
    expect(f.kind).toBe("replace");
    expect(f.replacement).toBe("quantifies state separation");
    // After sanitization, publication-ready export must succeed.
    const safety = evaluateExportSafety(text, { evidence_type: "endpoint" });
    expect(safety.sanitized).toMatch(/quantifies state separation/);
    expect(safety.publicationReady).toBe(true);
  });

  it("'vaccine target' is replaced unless immunogenicity_validated = true", () => {
    const text = "MEIS1 F378X is a vaccine target.";
    const unsafe = sanitizeClaim(text, { immunogenicity_validated: false });
    expect(unsafe).toMatch(/computationally nominated candidate pending immunogenicity validation/);
    expect(unsafe).not.toMatch(/vaccine target/);
    const safe = sanitizeClaim(text, { immunogenicity_validated: true });
    expect(safe).toMatch(/vaccine target/);
  });

  it("'validated threshold' replaced with 'proof-of-concept threshold'", () => {
    const out = sanitizeClaim("Uses validated threshold for stratification.");
    expect(out).toMatch(/proof-of-concept threshold/);
    expect(out).not.toMatch(/validated threshold/);
  });

  it("'clinical-grade' replaced with 'research-use only'", () => {
    expect(sanitizeClaim("clinical-grade pipeline")).toMatch(/research-use only/);
    expect(sanitizeClaim("clinical grade pipeline")).toMatch(/research-use only/);
  });

  it("'therapeutic recommendation' replaced with 'hypothesis-generating observation'", () => {
    expect(sanitizeClaim("therapeutic recommendation issued")).toMatch(
      /hypothesis-generating observation/,
    );
  });

  it("publication export blocked if 'prospective prediction' phrase remains without prospective evidence", () => {
    const text = "This is a prospective prediction against held-out outcomes.";
    const safety = evaluateExportSafety(text, { evidence_type: "endpoint" });
    expect(safety.publicationReady).toBe(false);
    expect(safety.audit.blockingPhrases).toContain("prospective prediction");
    expect(safety.draftAllowed).toBe(true);
    expect(safety.draftWatermark).toBe(DRAFT_AUDIT_WATERMARK);
  });

  it("'prospective prediction' allowed under prospective evidence", () => {
    const safety = evaluateExportSafety("prospective prediction held-out test", {
      evidence_type: "prospective",
    });
    expect(safety.publicationReady).toBe(true);
  });

  it("'early warning' blocked when lead_time <= 0, allowed when lead_time > 0", () => {
    const blocked = evaluateExportSafety("early warning signal", {
      evidence_type: "longitudinal",
      lead_time: 0,
    });
    expect(blocked.publicationReady).toBe(false);
    expect(blocked.audit.blockingPhrases).toContain("early warning");

    const ok = evaluateExportSafety("early warning signal", {
      evidence_type: "longitudinal",
      lead_time: 2.5,
    });
    expect(ok.publicationReady).toBe(true);
  });

  it("'transition dynamics' blocked without longitudinal data", () => {
    const blocked = evaluateExportSafety("captures transition dynamics", {
      evidence_type: "endpoint",
    });
    expect(blocked.publicationReady).toBe(false);
    expect(blocked.audit.blockingPhrases).toContain("transition dynamics");

    const ok = evaluateExportSafety("captures transition dynamics", {
      longitudinal_data: true,
    });
    expect(ok.publicationReady).toBe(true);
  });

  it("'predicts resistance' becomes 'early-warning candidate' when lead_time > 0", () => {
    const safety = evaluateExportSafety("model predicts resistance", {
      evidence_type: "longitudinal",
      lead_time: 1.2,
    });
    expect(safety.sanitized).toMatch(/early-warning candidate/);
    expect(safety.publicationReady).toBe(true);
  });

  it("draft export is always allowed with watermark even when blocked", () => {
    const safety = evaluateExportSafety(
      "prospective prediction with clinical-grade vaccine target",
      { evidence_type: "endpoint" },
    );
    expect(safety.draftAllowed).toBe(true);
    expect(safety.draftWatermark).toBe(DRAFT_AUDIT_WATERMARK);
    expect(safety.publicationReady).toBe(false);
    // clinical-grade and vaccine target are auto-replaced; only prospective prediction blocks.
    expect(safety.sanitized).toMatch(/research-use only/);
    expect(safety.sanitized).toMatch(/computationally nominated candidate/);
    expect(safety.audit.blockingPhrases).toContain("prospective prediction");
  });
});
