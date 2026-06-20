/**
 * Prospective prediction harness: seal a prediction made on pre-transition
 * data, store hash + payload in DB, and later score it against user-supplied
 * outcomes. Hash guarantees the prediction was not edited after the outcome
 * became known.
 */
import { supabase } from "@/integrations/supabase/client";

export interface SealedPredictionInput {
  cohort_label: string;
  pre_transition_timepoints: number[];        // training window (before any transition)
  pre_transition_fTTI: number[];
  threshold: number;                          // Ψ* used at seal time
  predicted_transition_window: [number, number]; // future t-window in which transition is predicted
  predicted_attractor: string;                // e.g. "resistant" | "responsive"
  notes?: string;
}

export interface SealedPredictionRow {
  id: string;
  cohort_label: string;
  sealed_payload: SealedPredictionInput;
  sealed_hash: string;
  sealed_at: string;
  outcome_payload: OutcomePayload | null;
  scored_at: string | null;
  scoring_result: ScoringResult | null;
}

export interface OutcomePayload {
  observed_transition_t: number | null;       // null = no transition observed
  observed_attractor: string | null;
  notes?: string;
}

export interface ScoringResult {
  hash_verified: boolean;
  window_hit: boolean | null;
  attractor_match: boolean | null;
  lead_time: number | null;
  verdict: "correct" | "partial" | "incorrect" | "indeterminate";
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sealPrediction(input: SealedPredictionInput): Promise<SealedPredictionRow> {
  const canonical = JSON.stringify(input, Object.keys(input).sort());
  const hash = await sha256(canonical);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sign in to seal a prediction.");
  const { data, error } = await supabase
    .from("sealed_predictions")
    .insert({
      user_id: u.user.id,
      cohort_label: input.cohort_label,
      sealed_payload: input as any,
      sealed_hash: hash,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as SealedPredictionRow;
}

export async function listSealedPredictions(): Promise<SealedPredictionRow[]> {
  const { data, error } = await supabase
    .from("sealed_predictions")
    .select("*")
    .order("sealed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SealedPredictionRow[];
}

export async function deleteSealedPrediction(id: string): Promise<void> {
  const { error } = await supabase.from("sealed_predictions").delete().eq("id", id);
  if (error) throw error;
}

export async function scoreSealedPrediction(
  row: SealedPredictionRow,
  outcome: OutcomePayload,
): Promise<SealedPredictionRow> {
  const canonical = JSON.stringify(row.sealed_payload, Object.keys(row.sealed_payload).sort());
  const recomputed = await sha256(canonical);
  const hash_verified = recomputed === row.sealed_hash;

  const [lo, hi] = row.sealed_payload.predicted_transition_window;
  const obsT = outcome.observed_transition_t;
  const window_hit = obsT == null ? null : obsT >= lo && obsT <= hi;
  const attractor_match =
    outcome.observed_attractor == null
      ? null
      : outcome.observed_attractor === row.sealed_payload.predicted_attractor;
  const lead_time = obsT == null ? null : obsT - (lo + hi) / 2;

  let verdict: ScoringResult["verdict"] = "indeterminate";
  if (!hash_verified) verdict = "indeterminate";
  else if (window_hit === true && attractor_match === true) verdict = "correct";
  else if (window_hit === false && attractor_match === false) verdict = "incorrect";
  else if (window_hit === true || attractor_match === true) verdict = "partial";
  else if (window_hit === false || attractor_match === false) verdict = "incorrect";

  const scoring_result: ScoringResult = {
    hash_verified, window_hit, attractor_match, lead_time, verdict,
  };

  const { data, error } = await supabase
    .from("sealed_predictions")
    .update({
      outcome_payload: outcome as any,
      scoring_result: scoring_result as any,
      scored_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as SealedPredictionRow;
}
