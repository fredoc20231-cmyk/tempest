/**
 * Claim audit — scans reports, captions, AI summaries, and exports for
 * prohibited or risky phrasing and offers safe replacements.
 *
 * Two categories of finding:
 *  - "replace": phrase has a safe rewrite (vaccine target, validated threshold,
 *    clinical-grade, therapeutic recommendation, predicts resistance).
 *  - "block":   phrase is contextually disallowed and has no auto-rewrite
 *    (prospective prediction without prospective evidence, early warning
 *    without positive lead_time, transition dynamics without longitudinal data).
 *
 * sanitize() applies replacements; auditClaim() returns findings on the
 * sanitized text — if any "block" phrase survives (or any "replace" phrase
 * the caller chose not to apply), publication-ready export is denied.
 */

export type EvidenceTypeForAudit =
  | "endpoint"
  | "endpoint-comparison"
  | "longitudinal"
  | "longitudinal-trajectory"
  | "prospective"
  | "prospective-prediction"
  | "synthetic-ground-truth"
  | "unknown";

export interface AuditContext {
  evidence_type?: EvidenceTypeForAudit;
  lead_time?: number | null;
  longitudinal_data?: boolean;
  immunogenicity_validated?: boolean;
}

export type FindingKind = "replace" | "block";

export interface ClaimFinding {
  phrase: string;
  matched: string;
  kind: FindingKind;
  reason: string;
  replacement?: string;
  index: number;
}

export interface ClaimAuditResult {
  findings: ClaimFinding[];
  blocked: boolean;
  blockingPhrases: string[];
  replacementsAvailable: number;
}

export const DRAFT_AUDIT_WATERMARK = "DRAFT — claims require verification.";

const isProspective = (e?: EvidenceTypeForAudit) =>
  e === "prospective" || e === "prospective-prediction";
const isLongitudinal = (e?: EvidenceTypeForAudit) =>
  e === "longitudinal" || e === "longitudinal-trajectory" || e === "prospective" || e === "prospective-prediction";

interface RuleSpec {
  phrase: string;
  pattern: RegExp;
  resolve: (ctx: AuditContext) => { kind: FindingKind; replacement?: string; reason: string };
}

const RULES: RuleSpec[] = [
  {
    phrase: "predicts resistance",
    pattern: /predicts?\s+resistance/gi,
    resolve: (ctx) => {
      const earlyWarningAllowed =
        isLongitudinal(ctx.evidence_type) && typeof ctx.lead_time === "number" && ctx.lead_time > 0;
      return {
        kind: "replace",
        replacement: earlyWarningAllowed ? "early-warning candidate" : "quantifies state separation",
        reason: earlyWarningAllowed
          ? "Replaced with 'early-warning candidate' (lead_time > 0)."
          : "Resistance prediction not supported; replaced with 'quantifies state separation'.",
      };
    },
  },
  {
    phrase: "clinical-grade",
    pattern: /clinical[-\s]grade/gi,
    resolve: () => ({
      kind: "replace",
      replacement: "research-use only",
      reason: "Platform is research-use only; clinical-grade language is prohibited.",
    }),
  },
  {
    phrase: "validated threshold",
    pattern: /validated\s+threshold/gi,
    resolve: () => ({
      kind: "replace",
      replacement: "proof-of-concept threshold",
      reason: "fTTI threshold is proof-of-concept; not validated for clinical stratification.",
    }),
  },
  {
    phrase: "vaccine target",
    pattern: /vaccine\s+target/gi,
    resolve: (ctx) =>
      ctx.immunogenicity_validated
        ? {
            kind: "replace",
            replacement: "vaccine target",
            reason: "Allowed: immunogenicity_validated = true.",
          }
        : {
            kind: "replace",
            replacement: "computationally nominated candidate pending immunogenicity validation",
            reason: "Vaccine-target claim requires immunogenicity validation (ELISpot/tetramer/in-vivo).",
          },
  },
  {
    phrase: "therapeutic recommendation",
    pattern: /therapeutic\s+recommendation/gi,
    resolve: () => ({
      kind: "replace",
      replacement: "hypothesis-generating observation",
      reason: "Therapeutic recommendations are out of scope for a research-use platform.",
    }),
  },
  {
    phrase: "prospective prediction",
    pattern: /prospective\s+prediction/gi,
    resolve: (ctx) =>
      isProspective(ctx.evidence_type)
        ? { kind: "replace", replacement: "prospective prediction", reason: "Allowed under prospective evidence." }
        : { kind: "block", reason: "Prospective prediction requires evidence_type = prospective." },
  },
  {
    phrase: "early warning",
    pattern: /early[-\s]warning/gi,
    resolve: (ctx) => {
      const ok = typeof ctx.lead_time === "number" && ctx.lead_time > 0;
      return ok
        ? { kind: "replace", replacement: "early-warning", reason: "Allowed: lead_time > 0." }
        : { kind: "block", reason: "Early-warning language requires lead_time > 0." };
    },
  },
  {
    phrase: "transition dynamics",
    pattern: /transition\s+dynamics/gi,
    resolve: (ctx) =>
      ctx.longitudinal_data || isLongitudinal(ctx.evidence_type)
        ? { kind: "replace", replacement: "transition dynamics", reason: "Allowed: longitudinal data present." }
        : { kind: "block", reason: "Transition dynamics requires longitudinal data." },
  },
];

/** Scan text for prohibited phrasing under the supplied context. */
export function auditClaim(text: string, ctx: AuditContext = {}): ClaimAuditResult {
  const findings: ClaimFinding[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      const decision = rule.resolve(ctx);
      // "replace" with replacement === matched text → contextually allowed, skip.
      const allowed =
        decision.kind === "replace" &&
        decision.replacement &&
        decision.replacement.toLowerCase() === m[0].toLowerCase();
      if (allowed) continue;
      findings.push({
        phrase: rule.phrase,
        matched: m[0],
        kind: decision.kind,
        reason: decision.reason,
        replacement: decision.kind === "replace" ? decision.replacement : undefined,
        index: m.index,
      });
    }
  }
  const blockingPhrases = findings.filter((f) => f.kind === "block").map((f) => f.phrase);
  return {
    findings,
    blocked: blockingPhrases.length > 0,
    blockingPhrases: Array.from(new Set(blockingPhrases)),
    replacementsAvailable: findings.filter((f) => f.kind === "replace").length,
  };
}

/** Apply all auto-replacements; leaves "block" phrases untouched. */
export function sanitizeClaim(text: string, ctx: AuditContext = {}): string {
  let out = text;
  for (const rule of RULES) {
    out = out.replace(rule.pattern, (matched) => {
      const decision = rule.resolve(ctx);
      if (decision.kind === "replace" && decision.replacement) return decision.replacement;
      return matched; // block phrases pass through; gate will flag them
    });
  }
  return out;
}

export interface ExportSafetyResult {
  sanitized: string;
  audit: ClaimAuditResult;
  publicationReady: boolean;
  draftAllowed: true;
  draftWatermark: string;
}

/**
 * Sanitize then re-audit. publicationReady = no prohibited phrases remain.
 * Draft export remains allowed and must carry the watermark.
 */
export function evaluateExportSafety(
  text: string,
  ctx: AuditContext = {},
): ExportSafetyResult {
  const sanitized = sanitizeClaim(text, ctx);
  const audit = auditClaim(sanitized, ctx);
  return {
    sanitized,
    audit,
    publicationReady: audit.findings.length === 0,
    draftAllowed: true,
    draftWatermark: DRAFT_AUDIT_WATERMARK,
  };
}
