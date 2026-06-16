/**
 * Ask-TEMPEST grounded Q&A engine.
 *
 * Answers ONLY from:
 *   - uploaded dataset summary (session memory)
 *   - inferred DatasetContext
 *   - computed module results (session memory)
 *   - embedded TEMPEST knowledge base + safe-language rules
 *
 * Never invents results. If unsupported, returns the standard refusal.
 */
import {
  getSessionContext,
  type SessionContext,
} from "./sessionLearning";
import {
  explainAllowedClaims,
  explainEvidenceType,
  explainValidityFloor,
  interpretBenchmark,
  interpretLongitudinal,
  interpretNeoantigenCandidate,
  recommendModules,
  recommendNextExperiment,
  KNOWLEDGE_FACTS,
  type NeoantigenLike,
} from "./tempestKnowledgeBase";
import { auditClaim, sanitizeClaim } from "@/lib/audit/claimAudit";

export const REFUSAL = "This cannot be inferred from the uploaded data.";

export interface AskResponse {
  answer: string;
  grounded_in: string[];
  refused: boolean;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function findResult<T = any>(
  session: SessionContext,
  module: string,
  key?: string,
): T | undefined {
  const r = session.module_results.find((x) => x.module === module);
  if (!r) return undefined;
  if (!key) return r.summary as T;
  return r.summary?.[key] as T | undefined;
}

export function askTempest(
  question: string,
  session: SessionContext = getSessionContext(),
): AskResponse {
  const q = norm(question);
  const grounded: string[] = [];
  const ctx = session.context;

  // Always-available facts
  if (q.includes("threshold") || q.includes("clinical")) {
    grounded.push("knowledge_base.threshold_status", "knowledge_base.clinical_recommendation");
    return {
      answer: `${KNOWLEDGE_FACTS.threshold_status} ${KNOWLEDGE_FACTS.clinical_recommendation}`,
      grounded_in: grounded,
      refused: false,
    };
  }

  if (!ctx) {
    return {
      answer: `${REFUSAL} No dataset context is recorded in this session — upload a dataset first.`,
      grounded_in: ["session.context (missing)"],
      refused: true,
    };
  }

  // 1. "Can I claim prediction?"
  if (q.includes("predict") || q.includes("prediction")) {
    grounded.push("session.context.evidence_type", "knowledge_base.prediction_rule");
    const leadTime = (findResult<{ lead_time?: number | null }>(session, "longitudinal")?.lead_time ?? null);
    const claims = explainAllowedClaims({
      evidence_type: ctx.evidence_type === "endpoint" ? "endpoint" : ctx.evidence_type,
      lead_time: leadTime,
      longitudinal_data:
        ctx.evidence_type === "longitudinal_retrospective" ||
        ctx.evidence_type === "longitudinal_with_outcome",
    });
    const allowed = claims.allowed.includes("prospective prediction") || claims.allowed.includes("early-warning candidate");
    return {
      answer: allowed
        ? `Yes — under evidence_type='${ctx.evidence_type}'${leadTime != null ? ` with lead_time=${leadTime}` : ""}, "${claims.allowed.includes("prospective prediction") ? "prospective prediction" : "early-warning candidate"}" language is allowed.`
        : `No. Under evidence_type='${ctx.evidence_type}', prediction language is disallowed. Allowed: ${claims.allowed.join(", ")}.`,
      grounded_in: grounded,
      refused: false,
    };
  }

  // 2. "Is this endpoint or longitudinal?"
  if (q.includes("endpoint") || q.includes("longitudinal") || q.includes("design")) {
    grounded.push("session.context.dataset_type", "session.context.evidence_type");
    return {
      answer: `Dataset type: ${ctx.dataset_type}. ${explainEvidenceType(ctx.evidence_type)}`,
      grounded_in: grounded,
      refused: false,
    };
  }

  // 3. "Why is full fTTI blocked?"
  if (q.includes("ftti") || q.includes("blocked") || q.includes("validity")) {
    grounded.push("session.context.validity_status", "session.context.min_per_group");
    const n = ctx.min_per_group ?? 0;
    let reason = "";
    if (ctx.validity_status === "insufficient_groups")
      reason = "Fewer than 2 condition groups were detected — composite fTTI requires ≥2 groups.";
    else if (ctx.validity_status === "zN_only") reason = explainValidityFloor(n);
    else if (ctx.validity_status === "invalid_metadata")
      reason = "No recognizable condition/timepoint/omics columns — metadata is insufficient.";
    else reason = `Full fTTI is not blocked (validity_status=${ctx.validity_status}).`;
    return { answer: reason, grounded_in: grounded, refused: false };
  }

  // 4. "Which neoantigen should I validate first?"
  if (q.includes("neoantigen") || q.includes("validate first") || q.includes("vaccine")) {
    grounded.push("session.module_results.neoantigen");
    const top = findResult<NeoantigenLike>(session, "neoantigen", "top_candidate");
    if (!top)
      return {
        answer: `${REFUSAL} No neoantigen result is recorded in this session — run the Neoantigen module first.`,
        grounded_in: grounded,
        refused: true,
      };
    return {
      answer: interpretNeoantigenCandidate(top),
      grounded_in: grounded,
      refused: false,
    };
  }

  // 5. "What should I do next experimentally?"
  if (q.includes("next") || q.includes("experiment") || q.includes("recommend")) {
    grounded.push("session.context", "knowledge_base.recommendNextExperiment");
    const leadTime = findResult<{ lead_time?: number | null }>(session, "longitudinal")?.lead_time ?? null;
    return {
      answer: recommendNextExperiment(ctx, { lead_time: leadTime }),
      grounded_in: grounded,
      refused: false,
    };
  }

  // 6. Modules
  if (q.includes("module") || q.includes("which step")) {
    grounded.push("session.context.recommended_modules");
    return {
      answer: `Recommended modules: ${recommendModules(ctx).join(", ")}.`,
      grounded_in: grounded,
      refused: false,
    };
  }

  // 7. Benchmark / AUROC
  if (q.includes("benchmark") || q.includes("auroc")) {
    grounded.push("session.context", "knowledge_base.auroc_rule");
    return {
      answer: interpretBenchmark(ctx),
      grounded_in: grounded,
      refused: false,
    };
  }

  // 8. Lead time / early warning
  if (q.includes("lead time") || q.includes("early warning") || q.includes("warning")) {
    grounded.push("session.module_results.longitudinal");
    const leadTime = findResult<{ lead_time?: number | null }>(session, "longitudinal")?.lead_time ?? null;
    return {
      answer: interpretLongitudinal(ctx, leadTime),
      grounded_in: grounded,
      refused: false,
    };
  }

  // Refusal — but apply audit so any speculative phrasing surfaces.
  const sanitized = sanitizeClaim(question);
  const audit = auditClaim(sanitized);
  if (audit.findings.length > 0) {
    return {
      answer: `${REFUSAL} Question phrasing contained: ${audit.findings.map((f) => f.phrase).join(", ")}.`,
      grounded_in: ["claim_audit"],
      refused: true,
    };
  }
  return { answer: REFUSAL, grounded_in: ["session.context"], refused: true };
}

export const QUICK_QUESTIONS = [
  "Can I claim prediction?",
  "Is this endpoint or longitudinal?",
  "Why is full fTTI blocked?",
  "Which neoantigen should I validate first?",
  "What should I do next experimentally?",
];
