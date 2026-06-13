import { describe, it, expect } from "vitest";
import {
  classifyBenchmark,
  computeBenchmarkAurocs,
  benchmarkToCsv,
} from "./benchmark";
import { safeLanguage } from "@/lib/safeLanguage";
import { evaluateLongitudinal } from "@/lib/longitudinal/leadTime";
import { evaluatePublicationGate } from "@/lib/export/publicationGate";

describe("benchmark classification + AUROC gating", () => {
  it("single-class benchmark blocks AUROC", () => {
    const type = classifyBenchmark({ labels: ["S", "S", "S", "S"] });
    expect(type).toBe("single-class geometry only");
    const out = computeBenchmarkAurocs(type, { fTTI: [1, 2, 3, 4] }, [1, 1, 1, 1]);
    expect(out[0].auroc).toBeNull();
    expect(out[0].reason).toMatch(/single-class/i);
  });

  it("binary benchmark allows AUROC", () => {
    const type = classifyBenchmark({ labels: ["S", "S", "R", "R"] });
    expect(type).toBe("binary classification benchmark");
    const out = computeBenchmarkAurocs(
      type,
      { fTTI: [0.1, 0.2, 0.9, 0.8] },
      [0, 0, 1, 1],
    );
    expect(out[0].auroc).toBeCloseTo(1.0, 6);
  });

  it("longitudinal benchmark requires ≥3 timepoints", () => {
    expect(
      classifyBenchmark({ labels: ["S", "R"], timepoints: [1, 2, 3, 4] }),
    ).toBe("longitudinal benchmark");
    expect(classifyBenchmark({ timepoints: [1, 2] })).not.toBe(
      "longitudinal benchmark",
    );
  });

  it("CSV export contains benchmark_type and AUROC column", () => {
    const csv = benchmarkToCsv(
      "binary classification benchmark",
      [{ metric: "fTTI", value: 6.2 }],
      [{ metric: "fTTI", auroc: 0.91 }],
    );
    expect(csv.split("\n")[0]).toBe("metric,value,auroc,benchmark_type,note");
    expect(csv).toMatch(/binary classification benchmark/);
    expect(csv).toMatch(/0\.9100/);
  });
});

describe("safe language", () => {
  it("endpoint never uses prediction language", () => {
    const r = safeLanguage({ mode: "endpoint" });
    expect(r.predictionAllowed).toBe(false);
    expect(r.label).toBe("state separation");
    expect(r.sentence.toLowerCase()).not.toMatch(/\bpredict/);
  });

  it("longitudinal without phenotype says retrospective trajectory", () => {
    const r = safeLanguage({ mode: "longitudinal-no-phenotype" });
    expect(r.label).toMatch(/retrospective trajectory/i);
    expect(r.predictionAllowed).toBe(false);
  });

  it("longitudinal with positive lead_time says early-warning candidate", () => {
    const r = safeLanguage({ mode: "longitudinal-with-phenotype", leadTime: 12.5 });
    expect(r.label).toBe("early-warning candidate");
    expect(r.predictionAllowed).toBe(true);
  });

  it("longitudinal with non-positive lead_time falls back to retrospective", () => {
    const r = safeLanguage({ mode: "longitudinal-with-phenotype", leadTime: 0 });
    expect(r.label).not.toBe("early-warning candidate");
    expect(r.predictionAllowed).toBe(false);
  });

  it("prospective uses prediction test phrasing", () => {
    const r = safeLanguage({ mode: "prospective" });
    expect(r.label).toBe("prospective prediction test");
    expect(r.predictionAllowed).toBe(true);
  });
});

describe("longitudinal gate", () => {
  it("requires ≥3 ordered timepoints", () => {
    const g = evaluateLongitudinal({ timepoints: [0, 1], fTTI: [1, 7] });
    expect(g.ok).toBe(false);
    expect(g.mode).toBe("endpoint");
  });

  it("without phenotype → retrospective trajectory only", () => {
    const g = evaluateLongitudinal({
      timepoints: [0, 1, 2, 3],
      fTTI: [1, 4, 7, 9],
    });
    expect(g.ok).toBe(true);
    expect(g.mode).toBe("longitudinal-no-phenotype");
    expect(g.thresholdCrossingTime).not.toBeNull();
    expect(g.earlyWarningCandidate).toBe(false);
  });

  it("with phenotype computes positive lead_time when topology leads", () => {
    const g = evaluateLongitudinal({
      timepoints: [0, 1, 2, 3, 4],
      fTTI: [0, 2, 7, 8, 9],
      phenotype: [0, 0, 0.1, 0.4, 0.8],
    });
    expect(g.mode).toBe("longitudinal-with-phenotype");
    expect(g.leadTime).not.toBeNull();
    expect(g.leadTime!).toBeGreaterThan(0);
    expect(g.earlyWarningCandidate).toBe(true);
  });
});

describe("publication-ready export gate", () => {
  const complete = {
    dataset_accession: "GSE123456",
    data_source: "GEO",
    primary_data_available: true,
    code_available: true,
    computation_status: "COMPLETE" as const,
  };

  it("allows publication-ready when all metadata complete", () => {
    const r = evaluatePublicationGate(complete);
    expect(r.publicationReady).toBe(true);
    expect(r.blockers).toHaveLength(0);
  });

  it("blocks when accession missing", () => {
    const r = evaluatePublicationGate({ ...complete, dataset_accession: "" });
    expect(r.publicationReady).toBe(false);
    expect(r.blockers.join(",")).toMatch(/accession/);
  });

  it("blocks when computation_status = PENDING", () => {
    const r = evaluatePublicationGate({ ...complete, computation_status: "PENDING" });
    expect(r.publicationReady).toBe(false);
    expect(r.blockers.join(",")).toMatch(/PENDING/);
    expect(r.draftAllowed).toBe(true);
    expect(r.draftWatermark).toMatch(/DRAFT/);
  });

  it("blocks when primary_data_available or code_available are false", () => {
    const r = evaluatePublicationGate({
      ...complete,
      primary_data_available: false,
      code_available: false,
    });
    expect(r.publicationReady).toBe(false);
    expect(r.blockers.length).toBeGreaterThanOrEqual(2);
  });
});
