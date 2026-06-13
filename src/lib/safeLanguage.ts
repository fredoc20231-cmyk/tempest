/**
 * Reviewer-safe language helper.
 * Centralizes the mapping from analysis context → permitted phrasing.
 * Never returns the word "prediction" unless prospective or
 * a positive lead_time has been demonstrated.
 */
export type AnalysisMode =
  | "endpoint"
  | "longitudinal-no-phenotype"
  | "longitudinal-with-phenotype"
  | "prospective";

export interface SafeLanguageInput {
  mode: AnalysisMode;
  /** Required for the "early-warning candidate" phrasing. */
  leadTime?: number | null;
}

export interface SafeLanguageResult {
  label: string;
  sentence: string;
  predictionAllowed: boolean;
}

export function safeLanguage(input: SafeLanguageInput): SafeLanguageResult {
  const { mode, leadTime } = input;
  if (mode === "endpoint") {
    return {
      label: "state separation",
      sentence: "This quantifies established state separation, not transition prediction.",
      predictionAllowed: false,
    };
  }
  if (mode === "longitudinal-no-phenotype") {
    return {
      label: "retrospective trajectory only",
      sentence: "Retrospective trajectory only; no phenotype outcome supplied, so early-warning claims are not made.",
      predictionAllowed: false,
    };
  }
  if (mode === "longitudinal-with-phenotype") {
    if (typeof leadTime === "number" && leadTime > 0) {
      return {
        label: "early-warning candidate",
        sentence: `Early-warning candidate: topology threshold crossed ${leadTime.toFixed(2)} time units before the phenotype crossing.`,
        predictionAllowed: true,
      };
    }
    return {
      label: "retrospective trajectory",
      sentence: "Retrospective trajectory with phenotype; lead_time ≤ 0, so this is not an early-warning candidate.",
      predictionAllowed: false,
    };
  }
  // prospective
  return {
    label: "prospective prediction test",
    sentence: "Prospective prediction test against user-supplied held-out outcomes.",
    predictionAllowed: true,
  };
}
