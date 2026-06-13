/**
 * Sample-size validity gate for fTTI composite.
 * n < 25 per condition → disable z_B, z_L_*, composite fTTI.
 * Only z_N, cross/within ratio, and Fiedler λ2 remain valid.
 */
export type ValidityChannel =
  | "z_N"
  | "cross_within"
  | "fiedler"
  | "z_B"
  | "z_L_VR"
  | "z_L_GCT"
  | "fTTI";

export interface ValidityReport {
  ok: boolean;
  nPerCondition: number;
  threshold: number;
  allowed: ValidityChannel[];
  blocked: ValidityChannel[];
  warning?: string;
}

export const N_STAR = 25;

export function assessValidity(nPerCondition: number): ValidityReport {
  const ok = nPerCondition >= N_STAR;
  if (ok) {
    return {
      ok: true,
      nPerCondition,
      threshold: N_STAR,
      allowed: ["z_N", "cross_within", "fiedler", "z_B", "z_L_VR", "z_L_GCT", "fTTI"],
      blocked: [],
    };
  }
  return {
    ok: false,
    nPerCondition,
    threshold: N_STAR,
    allowed: ["z_N", "cross_within", "fiedler"],
    blocked: ["z_B", "z_L_VR", "z_L_GCT", "fTTI"],
    warning: `z_B and z_L are invalid because n < ${N_STAR} per condition (n=${nPerCondition}). Only z_N, cross/within ratio, and Fiedler λ2 are reported.`,
  };
}
