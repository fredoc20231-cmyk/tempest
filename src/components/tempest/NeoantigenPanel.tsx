import { useMemo, useState } from "react";
import {
  tierNeoantigens,
  DEMO_NEOANTIGENS,
  validateRow,
  validationPlanCSV,
  neoantigenTableCSV,
  VALIDATION_ROADMAP,
  type NeoantigenInput,
  REQUIRED_FIELDS,
} from "@/lib/neoantigen/schema";
import { Shield, Upload, AlertTriangle, Download, FlaskConical } from "lucide-react";
import { EvidenceBadge } from "./EvidenceBadge";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { toast } from "sonner";

function downloadText(filename: string, body: string, mime = "text/csv") {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function NeoantigenPanel() {
  const [rows, setRows] = useState<NeoantigenInput[]>(DEMO_NEOANTIGENS);
  const [source, setSource] = useState<"DEMO/SYNTHETIC" | "USER-UPLOADED">("DEMO/SYNTHETIC");
  const [rejected, setRejected] = useState<{ row: any; missing: string[] }[]>([]);

  const scored = useMemo(() => tierNeoantigens(rows), [rows]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const sep = file.name.endsWith(".tsv") ? "\t" : ",";
      const lines = text.trim().split("\n");
      const headers = lines[0].split(sep).map((h) => h.trim());
      const accepted: NeoantigenInput[] = [];
      const rej: { row: any; missing: string[] }[] = [];
      for (const line of lines.slice(1)) {
        const cells = line.split(sep);
        const obj: any = {};
        headers.forEach((h, i) => (obj[h] = cells[i]?.trim()));
        if (obj.percentRank) obj.percentRank = parseFloat(obj.percentRank);
        if (obj.percent_rank && !obj.percentRank) obj.percentRank = parseFloat(obj.percent_rank);
        if (obj.n_timepoints) obj.n_timepoints = parseInt(obj.n_timepoints);
        if (obj.RNA_TPM) obj.RNA_TPM = parseFloat(obj.RNA_TPM);
        if (!obj.source) obj.source = "USER-UPLOADED";
        const v = validateRow(obj);
        if (v.ok) accepted.push(obj as NeoantigenInput);
        else rej.push({ row: obj, missing: v.missing });
      }
      setRows(accepted);
      setRejected(rej);
      setSource("USER-UPLOADED");
      toast.success(`Loaded ${accepted.length} candidates · ${rej.length} rejected`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse neoantigen file.");
    }
  };

  const tierCls = (t: 1 | 2 | 3, excluded?: boolean, label?: string) =>
    excluded
      ? "bg-destructive/10 text-destructive"
      : label === "TRANSCRIPT BIOMARKER"
      ? "bg-chart-amber/10 text-chart-amber"
      : t === 1
      ? "bg-chart-emerald/10 text-chart-emerald"
      : t === 2
      ? "bg-chart-amber/10 text-chart-amber"
      : "bg-muted text-muted-foreground";

  const binderCls = (b: string) =>
    b === "strong"
      ? "text-chart-emerald"
      : b === "weak"
      ? "text-chart-amber"
      : "text-muted-foreground";

  const tier1Count = scored.filter((s) => s.tier === 1 && !s.excluded).length;
  const excludedCount = scored.filter((s) => s.excluded).length;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-chart-emerald" /> Neoantigen Tiering (Safeguarded)
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Manuscript-safe nomenclature. Required schema: {REQUIRED_FIELDS.join(", ")}.
            Germline / germline-risk / dbSNP-overlap / pending-tail-DNA candidates are excluded
            from Tier 1. MEIS1 + dbSNP rs239018671 is hard-excluded. Amz1 with confirmed RNA and
            ≥3-timepoint recurrence outranks Csprs when Csprs expression is unconfirmed.
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <EvidenceBadge type="endpoint-comparison" />
          <ProvenanceBadge value={source} />
        </div>
      </div>

      <div className="module-card flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md cursor-pointer hover:bg-primary/90">
          <Upload className="w-3.5 h-3.5" /> Upload CSV/TSV
          <input type="file" accept=".csv,.tsv" hidden onChange={handleFile} />
        </label>
        <button
          onClick={() => downloadText("neoantigen_candidates.csv", neoantigenTableCSV(scored))}
          className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-secondary/80"
        >
          <Download className="w-3.5 h-3.5" /> Candidates CSV
        </button>
        <button
          onClick={() => downloadText("neoantigen_validation_plan.csv", validationPlanCSV(scored))}
          className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-secondary/80"
        >
          <FlaskConical className="w-3.5 h-3.5" /> Validation plan CSV
        </button>
        <p className="text-xs text-muted-foreground ml-auto">
          {scored.length} total · {tier1Count} Tier 1 · {excludedCount} excluded · {rejected.length} rejected
        </p>
      </div>

      {rejected.length > 0 && (
        <div className="border border-chart-amber/40 bg-chart-amber/5 rounded-md p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-chart-amber flex-shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/80">
            <strong>{rejected.length} row(s) rejected</strong> — missing:{" "}
            {Array.from(new Set(rejected.flatMap((r) => r.missing))).join(", ")}.
          </div>
        </div>
      )}

      <div className="module-card overflow-x-auto">
        <table className="w-full text-xs min-w-[1100px]">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
              <th className="py-1.5 px-2">Status</th>
              <th className="px-2">Gene</th>
              <th className="px-2">Mutation</th>
              <th className="px-2">Peptide</th>
              <th className="px-2">Allele</th>
              <th className="px-2">%Rank</th>
              <th className="px-2">Binder</th>
              <th className="px-2">Timepoints</th>
              <th className="px-2">Expression</th>
              <th className="px-2">RNA TPM</th>
              <th className="px-2">Germline</th>
              <th className="px-2">dbSNP</th>
              <th className="px-2">Validation</th>
              <th className="px-2">Source</th>
              <th className="px-2">Manuscript label</th>
              <th className="px-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {scored.map((s, i) => (
              <tr key={i} className={`border-b border-border/50 ${i % 2 ? "bg-muted/20" : ""}`}>
                <td className="py-1.5 px-2">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tierCls(s.tier, s.excluded, s.status_label)}`}
                  >
                    {s.status_label}
                  </span>
                </td>
                <td className="px-2 font-mono font-semibold">{s.gene}</td>
                <td className="px-2 font-mono">{s.mutation}</td>
                <td className="px-2 font-mono">{s.peptide || <span className="text-destructive">—</span>}</td>
                <td className="px-2 font-mono">{s.allele}</td>
                <td className="px-2 font-mono">{s.percentRank.toFixed(2)}</td>
                <td className={`px-2 font-mono ${binderCls(s.binder)}`}>{s.binder}</td>
                <td className="px-2 font-mono">{s.n_timepoints}</td>
                <td className="px-2">{s.expression_status}</td>
                <td className="px-2 font-mono">{s.RNA_TPM ?? "—"}</td>
                <td className="px-2">{s.germline_status}</td>
                <td className="px-2 font-mono text-[11px]">{s.dbSNP_id ?? s.dbSNP ?? "—"}</td>
                <td className="px-2 text-[11px]">{s.validation_status ?? "none"}</td>
                <td className="px-2 text-[11px] text-muted-foreground">{s.source ?? "—"}</td>
                <td className="px-2 text-[11px] italic">{s.manuscript_label}</td>
                <td className="px-2 text-muted-foreground text-[11px]">{s.reasons.join("; ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="module-card">
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" /> Validation roadmap
        </h2>
        <ol className="text-xs text-foreground/80 space-y-1 list-decimal list-inside">
          {VALIDATION_ROADMAP.map((v) => (
            <li key={v.step}>
              <span className="font-semibold">{v.assay}</span> — {v.purpose}{" "}
              <span className="text-muted-foreground">(prereq: {v.prerequisite}{v.required_for_tier1 ? "; required for Tier 1" : ""})</span>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-muted-foreground mt-2 italic">
          Peptide synthesis only proceeds after somatic + expression confirmation. All Tier 1
          labels denote "computationally nominated candidate"; "validated vaccine target" requires
          somatic + RNA + immunogenicity (ELISpot/tetramer/in-vivo) confirmation.
        </p>
      </div>
    </div>
  );
}
