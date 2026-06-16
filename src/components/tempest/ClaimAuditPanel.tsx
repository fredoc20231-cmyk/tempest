import { useMemo, useState } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { EvidenceBadge } from "./EvidenceBadge";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { toast } from "sonner";
import {
  auditClaim,
  sanitizeClaim,
  evaluateExportSafety,
  DRAFT_AUDIT_WATERMARK,
  type AuditContext,
  type EvidenceTypeForAudit,
} from "@/lib/audit/claimAudit";

const SAMPLE = `Our framework predicts resistance from endpoint snapshots and yields a clinical-grade vaccine target.
Using a validated threshold, we issue a therapeutic recommendation.
This is a prospective prediction with early warning derived from transition dynamics.`;

const EVIDENCE_OPTIONS: { value: EvidenceTypeForAudit; label: string }[] = [
  { value: "endpoint", label: "endpoint" },
  { value: "longitudinal", label: "longitudinal" },
  { value: "prospective", label: "prospective" },
];

export default function ClaimAuditPanel() {
  const [text, setText] = useState(SAMPLE);
  const [evidence, setEvidence] = useState<EvidenceTypeForAudit>("endpoint");
  const [leadTime, setLeadTime] = useState<string>("0");
  const [longitudinal, setLongitudinal] = useState(false);
  const [immValidated, setImmValidated] = useState(false);

  const ctx: AuditContext = useMemo(
    () => ({
      evidence_type: evidence,
      lead_time: leadTime === "" ? null : parseFloat(leadTime),
      longitudinal_data: longitudinal,
      immunogenicity_validated: immValidated,
    }),
    [evidence, leadTime, longitudinal, immValidated],
  );

  const safety = useMemo(() => evaluateExportSafety(text, ctx), [text, ctx]);
  const rawAudit = useMemo(() => auditClaim(text, ctx), [text, ctx]);

  const apply = () => setText(sanitizeClaim(text, ctx));

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-chart-amber" /> Claim Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Scans report text, captions, AI summaries, and exports for prohibited or contextually
            risky phrasing. Offers safe replacements; blocks publication-ready export until
            unresolved phrases are addressed. Draft export remains allowed with watermark.
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <EvidenceBadge type="endpoint-comparison" />
          <ProvenanceBadge value="DEMO/SYNTHETIC" />
        </div>
      </div>

      <div className="module-card grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <label className="space-y-1">
          <span className="font-mono uppercase text-[10px] text-muted-foreground">evidence_type</span>
          <select
            value={evidence}
            onChange={(e) => setEvidence(e.target.value as EvidenceTypeForAudit)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
          >
            {EVIDENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="font-mono uppercase text-[10px] text-muted-foreground">lead_time</span>
          <input
            type="number"
            step="0.1"
            value={leadTime}
            onChange={(e) => setLeadTime(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-xs font-mono"
          />
        </label>
        <label className="flex items-center gap-2 mt-4">
          <input type="checkbox" checked={longitudinal} onChange={(e) => setLongitudinal(e.target.checked)} />
          <span className="text-xs">longitudinal_data</span>
        </label>
        <label className="flex items-center gap-2 mt-4">
          <input type="checkbox" checked={immValidated} onChange={(e) => setImmValidated(e.target.checked)} />
          <span className="text-xs">immunogenicity_validated</span>
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="module-card space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Source text</h2>
            <button onClick={() => copy(text)} className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <Copy className="w-3 h-3" /> copy
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full bg-background border border-border rounded p-2 text-xs font-mono"
          />
          <button
            onClick={apply}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90"
          >
            Apply safe replacements
          </button>
        </div>

        <div className="module-card space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Sanitized output</h2>
            <button onClick={() => copy(safety.sanitized)} className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <Copy className="w-3 h-3" /> copy
            </button>
          </div>
          <pre className="w-full bg-muted/30 border border-border rounded p-2 text-xs font-mono whitespace-pre-wrap min-h-[200px]">{safety.sanitized}</pre>
          {safety.publicationReady ? (
            <div className="flex items-center gap-2 text-chart-emerald text-xs">
              <CheckCircle2 className="w-4 h-4" /> Publication-ready (no prohibited phrasing remains).
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="w-4 h-4" /> Publication export blocked.
              </div>
              <div className="text-[11px] text-muted-foreground">
                Draft allowed with watermark: <span className="font-mono">"{DRAFT_AUDIT_WATERMARK}"</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="module-card overflow-x-auto">
        <h2 className="text-sm font-semibold mb-2">Findings ({rawAudit.findings.length})</h2>
        {rawAudit.findings.length === 0 ? (
          <p className="text-xs text-muted-foreground">No prohibited phrases detected under current context.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
                <th className="py-1.5 px-2">Phrase</th>
                <th className="px-2">Matched</th>
                <th className="px-2">Kind</th>
                <th className="px-2">Replacement</th>
                <th className="px-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rawAudit.findings.map((f, i) => (
                <tr key={i} className={`border-b border-border/50 ${i % 2 ? "bg-muted/20" : ""}`}>
                  <td className="px-2 py-1.5 font-mono">{f.phrase}</td>
                  <td className="px-2 font-mono">{f.matched}</td>
                  <td className="px-2">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        f.kind === "block" ? "bg-destructive/10 text-destructive" : "bg-chart-amber/10 text-chart-amber"
                      }`}
                    >
                      {f.kind.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-2 font-mono text-[11px]">{f.replacement ?? "—"}</td>
                  <td className="px-2 text-muted-foreground text-[11px]">{f.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
