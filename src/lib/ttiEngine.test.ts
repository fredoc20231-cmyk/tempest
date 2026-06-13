import { describe, it, expect } from "vitest";
import { computeTTI, GENERATORS } from "./ttiEngine";

describe("ttiEngine composite identities", () => {
  it("fTTI_primary === zB + zL_VR + zN and tti === zB + zL + zN", async () => {
    const { X, labels } = GENERATORS.bottleneck(80, 11);
    const S_mask = labels.map((l) => l === "S");
    const R_mask = labels.map((l) => l === "R");

    const res = await computeTTI(X, S_mask, R_mask, {
      k: 10,
      nullReps: 8,
      bsReps: 0,
      seed: 11,
    });

    const { zB, zN, zL, zL_VR } = res.z;

    expect(res.fTTI_primary).toBeCloseTo(zB + zL_VR + zN, 10);
    expect(res.tti).toBeCloseTo(zB + zL + zN, 10);
    expect(res.fTTI_GCT).toBeCloseTo(zB + zL + zN, 10);
    expect(res.z.zL_GCT).toBeCloseTo(zL, 10);
    expect(res.topology_primary).toBe("VR");
  });
});
