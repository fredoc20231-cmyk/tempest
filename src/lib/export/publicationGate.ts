/**
 * Publication-ready export blocker.
 *
 * Required metadata for publication-ready export:
 *   dataset_accession, data_source, primary_data_available,
 *   code_available, computation_status ("COMPLETE" | "PENDING").
 *
 * If any required field is missing/falsy or computation_status === "PENDING",
 * publication-ready export is blocked. Draft export remains allowed but must
 * carry the watermark returned here.
 */
export interface PublicationMetadata {
  dataset_accession?: string | null;
  data_source?: string | null;
  primary_data_available?: boolean;
  code_available?: boolean;
  computation_status?: "COMPLETE" | "PENDING" | string;
}

export interface PublicationGateResult {
  publicationReady: boolean;
  blockers: string[];
  draftAllowed: true;
  draftWatermark: string;
}

export const DRAFT_WATERMARK = "DRAFT — not publication-ready.";

export function evaluatePublicationGate(meta: PublicationMetadata): PublicationGateResult {
  const blockers: string[] = [];
  if (!meta.dataset_accession || String(meta.dataset_accession).trim() === "") {
    blockers.push("dataset_accession missing");
  }
  if (!meta.data_source || String(meta.data_source).trim() === "") {
    blockers.push("data_source missing");
  }
  if (meta.primary_data_available !== true) {
    blockers.push("primary_data_available = false");
  }
  if (meta.code_available !== true) {
    blockers.push("code_available = false");
  }
  if (meta.computation_status !== "COMPLETE") {
    blockers.push(
      meta.computation_status === "PENDING"
        ? "computation_status = PENDING"
        : "computation_status not COMPLETE",
    );
  }
  return {
    publicationReady: blockers.length === 0,
    blockers,
    draftAllowed: true,
    draftWatermark: DRAFT_WATERMARK,
  };
}
