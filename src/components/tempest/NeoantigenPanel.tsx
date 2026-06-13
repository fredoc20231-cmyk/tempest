import { useMemo, useState } from "react";
import { tierNeoantigens, DEMO_NEOANTIGENS, validateRow, type NeoantigenInput, REQUIRED_FIELDS } from "@/lib/neoantigen/schema";
import { Shield, Upload, AlertTriangle } from "lucide-react";
import { EvidenceBadge } from "./EvidenceBadge";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
        if (obj.n_timepoints) obj.n_timepoints = parseInt(obj.n_timepoints);
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

  const tierCls = (t: 1 | 2 | 3, excluded?: boolean) =>
    excluded
      ? "bg-destructive/10 text-destructive"
      : t === 1
      ? "bg-chart-emerald/10 text-chart-emerald"
      : t === 2
      ? "bg-chart-amber/10 text-chart-amber"
      : "bg-muted text-muted-foreground";

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-chart-emerald" /> Neoantigen Tiering (Safeguarded)
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Required schema fields: {REQUIRED_FIELDS.join(", ")}. Germline candidates are excluded from Tier 1. MEIS1 with dbSNP rs239018671 is excluded entirely. Amz1 with confirmed RNA outranks Csprs when Csprs lacks expression confirmation.
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <EvidenceBadge type="endpoint-comparison" />
          <ProvenanceBadge value={source} />
        </div>
      </div>

      <div className="module-card flex items-center gap-3">
        <label className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md cursor-pointer hover:bg-primary/90">
          <Upload className="w-3.5 h-3.5" /> Upload CSV/TSV
          <input type="file" accept=".csv,.tsv" hidden onChange={handleFile} />
        </label>
        <p className="text-xs text-muted-foreground">
          {rows.length} candidate(s) · {rejected.length} rejected (missing required fields)
        </p>
      </div>

      {rejected.length > 0 && (
        <div className="border border-chart-amber/40 bg-chart-amber/5 rounded-md p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-chart-amber flex-shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/80">
            <strong>{rejected.length} row(s) rejected</strong> — missing: {Array.from(new Set(rejected.flatMap((r) => r.missing))).join(", ")}.
          </div>
        </div>
      )}

      <div className="module-card overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
              <th className="py-1.5 px-2">Tier</th>
              <th className="px-2">Gene</th>
              <th className="px-2">Mutation</th>
              <th className="px-2">Peptide</th>
              <th className="px-2">Allele</th>
              <th className="px-2">%Rank</th>
              <th className="px-2">Timepoints</th>
              <th className="px-2">Expression</th>
              <th className="px-2">Germline</th>
              <th className="px-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {scored.map((s, i) => (
              <tr key={i} className={`border-b border-border/50 ${i % 2 ? "bg-muted/20" : ""}`}>
                <td className="py-1.5 px-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tierCls(s.tier, s.excluded)}`}>
                    {s.excluded ? "EXCLUDED" : `T${s.tier}`}
                  </span>
                </td>
                <td className="px-2 font-mono font-semibold">{s.gene}</td>
                <td className="px-2 font-mono">{s.mutation}</td>
                <td className="px-2 font-mono">{s.peptide}</td>
                <td className="px-2 font-mono">{s.allele}</td>
                <td className="px-2 font-mono">{s.percentRank.toFixed(2)}</td>
                <td className="px-2 font-mono">{s.n_timepoints}</td>
                <td className="px-2">{s.expression_status}</td>
                <td className="px-2">{s.germline_status}</td>
                <td className="px-2 text-muted-foreground text-[11px]">{s.reasons.join("; ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
