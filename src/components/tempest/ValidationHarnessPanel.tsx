import { useEffect, useMemo, useState } from "react";
import { Layers, AlertTriangle, Lock, ShieldCheck, Trash2, Plus, Beaker, FlaskConical, BookCheck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { EvidenceBadge } from "./EvidenceBadge";
import { ProvenanceBadge } from "./ProvenanceBadge";
import {
  aggregateMultiCohort,
  type CohortTrajectory,
  type MultiCohortReport,
} from "@/lib/validation/multiCohort";
import { walkForwardCalibrate, type WalkForwardReport } from "@/lib/validation/walkForward";
import { runExtendedBenchmarks, type ExtendedBenchmarkResult } from "@/lib/validation/extendedBenchmarks";
import {
  sealPrediction, listSealedPredictions, deleteSealedPrediction, scoreSealedPrediction,
  type SealedPredictionRow, type SealedPredictionInput, type OutcomePayload,
} from "@/lib/validation/sealedPrediction";
import { buildDemoCohorts } from "@/lib/validation/demoCohorts";
import { useTempest } from "@/contexts/TempestContext";
import { toast } from "sonner";

type Tab = "multi" | "walk" | "bench" | "prospect";

const TABS: { id: Tab; label: string; icon: typeof Layers }[] = [
  { id: "multi",    label: "Multi-cohort",         icon: Layers },
  { id: "walk",     label: "Walk-forward CV",      icon: ShieldCheck },
  { id: "bench",    label: "Extended benchmark",   icon: Beaker },
  { id: "prospect", label: "Prospective harness",  icon: Lock },
];

const DEFAULT_THRESHOLD = 6.0;

// ──────────────────────────────────────────────────────────────────────────
// CSV → CohortTrajectory[]
// Format: cohort_label,timepoint,fTTI[,phenotype_t,phenotype_positive]
function parseCohortsCsv(text: string): { cohorts: CohortTrajectory[]; error?: string } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { cohorts: [], error: "Empty CSV." };
  const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
  const need = ["cohort_label", "timepoint", "ftti"];
  for (const c of need) if (!header.includes(c)) return { cohorts: [], error: `Missing column: ${c}` };
  const idx = (k: string) => header.indexOf(k);
  const byLabel = new Map<string, { t: number[]; f: number[]; pT?: number; pPos?: boolean }>();
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",");
    const label = cells[idx("cohort_label")]?.trim();
    const t = Number(cells[idx("timepoint")]);
    const f = Number(cells[idx("ftti")]);
    if (!label || !Number.isFinite(t) || !Number.isFinite(f)) continue;
    if (!byLabel.has(label)) byLabel.set(label, { t: [], f: [] });
    const entry = byLabel.get(label)!;
    entry.t.push(t); entry.f.push(f);
    const pIdx = header.indexOf("phenotype_t"), posIdx = header.indexOf("phenotype_positive");
    if (pIdx >= 0 && Number.isFinite(Number(cells[pIdx]))) entry.pT = Number(cells[pIdx]);
    if (posIdx >= 0 && cells[posIdx]?.trim()) entry.pPos = ["1", "true", "yes"].includes(cells[posIdx].trim().toLowerCase());
  }
  const cohorts: CohortTrajectory[] = [];
  for (const [label, v] of byLabel.entries()) {
    const order = v.t.map((_, i) => i).sort((a, b) => v.t[a] - v.t[b]);
    cohorts.push({
      label,
      timepoints: order.map((i) => v.t[i]),
      fTTI: order.map((i) => v.f[i]),
      phenotype: v.pT != null && v.pPos != null ? { t: v.pT, positive: v.pPos } : null,
      provenance: "USER-UPLOADED",
    });
  }
  return { cohorts };
}

// ──────────────────────────────────────────────────────────────────────────
function CohortsControls({
  cohorts, setCohorts, threshold, setThreshold, allowDemo,
}: {
  cohorts: CohortTrajectory[];
  setCohorts: (c: CohortTrajectory[]) => void;
  threshold: number;
  setThreshold: (n: number) => void;
  allowDemo: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 p-3 border border-border rounded-md bg-card">
      <div className="flex flex-col">
        <label className="text-[10px] font-mono uppercase text-muted-foreground">Ψ* threshold</label>
        <input
          type="number" step={0.1} value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value) || 0)}
          className="w-24 h-8 px-2 text-sm font-mono border border-border rounded bg-background"
        />
      </div>
      <label className="flex flex-col">
        <span className="text-[10px] font-mono uppercase text-muted-foreground">Upload cohorts CSV</span>
        <input
          type="file" accept=".csv,.tsv,text/csv"
          onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const text = await f.text();
            const { cohorts: parsed, error } = parseCohortsCsv(text);
            if (error) { toast.error(error); return; }
            if (!parsed.length) { toast.error("No cohorts parsed."); return; }
            setCohorts([...cohorts.filter((c) => c.provenance === "USER-UPLOADED" && !parsed.some((p) => p.label === c.label)), ...parsed]);
            toast.success(`Loaded ${parsed.length} cohort(s).`);
          }}
          className="text-xs"
        />
      </label>
      {allowDemo && (
        <button
          onClick={() => setCohorts([...cohorts, ...buildDemoCohorts().filter((d) => !cohorts.some((c) => c.label === d.label))])}
          className="h-8 px-3 text-xs border border-chart-amber/40 text-chart-amber rounded hover:bg-chart-amber/10"
        >+ Load DEMO cohorts (clearly badged)</button>
      )}
      {cohorts.length > 0 && (
        <button
          onClick={() => setCohorts([])}
          className="h-8 px-3 text-xs border border-border rounded hover:bg-muted text-muted-foreground"
        >Clear</button>
      )}
      <p className="text-[10px] font-mono text-muted-foreground basis-full">
        CSV columns: <code>cohort_label,timepoint,fTTI[,phenotype_t,phenotype_positive]</code>
      </p>
    </div>
  );
}

function HonestyBanner() {
  return (
    <div className="border border-chart-amber/40 bg-chart-amber/5 rounded-md p-3 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-chart-amber flex-shrink-0 mt-0.5" />
      <p className="text-xs text-foreground/80">
        No data is fabricated. Panels stay empty until you upload real cohorts. DEMO trajectories are clearly badged <span className="font-mono">DEMO/SYNTHETIC</span> and are for UI clarification only — they are <strong>not</strong> evidence and must not be cited.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function MultiCohortTab({ cohorts, threshold, report }: {
  cohorts: CohortTrajectory[]; threshold: number; report: MultiCohortReport | null;
}) {
  const chartData = useMemo(() => {
    if (!cohorts.length) return [];
    const allT = Array.from(new Set(cohorts.flatMap((c) => c.timepoints))).sort((a, b) => a - b);
    return allT.map((t) => {
      const row: any = { t };
      cohorts.forEach((c) => {
        const i = c.timepoints.indexOf(t);
        if (i >= 0) row[c.label] = c.fTTI[i];
      });
      return row;
    });
  }, [cohorts]);
  const colors = ["hsl(var(--primary))", "hsl(var(--chart-amber))", "hsl(var(--chart-emerald))", "hsl(var(--chart-cyan))", "hsl(var(--destructive))", "#a855f7", "#f97316", "#22d3ee"];
  if (!cohorts.length) {
    return <div className="module-card text-sm text-muted-foreground">No cohorts loaded. Upload a CSV or load DEMO cohorts to populate this panel.</div>;
  }
  return (
    <div className="space-y-4">
      <div className="module-card">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
            <YAxis tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <ReferenceLine y={threshold} stroke="hsl(var(--destructive))" strokeDasharray="4 2" label={{ value: `Ψ*=${threshold}`, position: "right", fontSize: 10 }} />
            {cohorts.map((c, i) => (
              <Line key={c.label} type="monotone" dataKey={c.label} stroke={colors[i % colors.length]} dot={false} strokeWidth={1.5} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {report && (
        <div className="module-card">
          <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2">Per-cohort summary</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
                <th className="py-1.5">Cohort</th><th>n_TP</th><th>max fTTI</th><th>cross t</th><th>phenotype t</th><th>lead time</th><th>provenance</th>
              </tr>
            </thead>
            <tbody>
              {report.cohorts.map((s, i) => (
                <tr key={s.label} className="border-b border-border/50">
                  <td className="py-1.5 font-mono">{s.label}</td>
                  <td className="font-mono">{s.n_timepoints}</td>
                  <td className="font-mono">{s.max_fTTI.toFixed(2)}</td>
                  <td className="font-mono">{s.cross_t != null ? s.cross_t.toFixed(2) : "—"}</td>
                  <td className="font-mono">{cohorts[i].phenotype?.t.toFixed(2) ?? "—"}</td>
                  <td className="font-mono">{s.lead_time != null ? s.lead_time.toFixed(2) : "—"}</td>
                  <td><ProvenanceBadge value={s.provenance as any} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
            <KV k="n cohorts" v={report.n_cohorts} />
            <KV k="with phenotype" v={report.n_with_phenotype} />
            <KV k="pooled AUROC" v={report.pooled_AUROC != null ? report.pooled_AUROC.toFixed(3) : "—"} />
            <KV k="median lead time" v={report.median_lead_time != null ? report.median_lead_time.toFixed(2) : "—"} />
          </div>
          {report.ci_lead_time && (
            <p className="mt-2 text-[10px] font-mono text-muted-foreground">
              lead-time 95% CI: [{report.ci_lead_time[0].toFixed(2)}, {report.ci_lead_time[1].toFixed(2)}]
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v: any }) {
  return (
    <div className="border border-border rounded p-2">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{k}</div>
      <div className="text-sm font-mono text-foreground">{String(v)}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function WalkForwardTab({ cohorts }: { cohorts: CohortTrajectory[] }) {
  const report: WalkForwardReport = useMemo(() => walkForwardCalibrate(cohorts), [cohorts]);
  if (!cohorts.length) {
    return <div className="module-card text-sm text-muted-foreground">Load cohorts on the Multi-cohort tab first.</div>;
  }
  return (
    <div className="space-y-4">
      <div className="module-card">
        <p className="text-xs text-muted-foreground">{report.message}</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-xs">
          <KV k="eligible" v={report.n_eligible} />
          <KV k="median Ψ*" v={Number.isFinite(report.threshold_median) ? report.threshold_median.toFixed(3) : "—"} />
          <KV k="sensitivity" v={report.sensitivity != null ? report.sensitivity.toFixed(3) : "—"} />
          <KV k="specificity" v={report.specificity != null ? report.specificity.toFixed(3) : "—"} />
          <KV k="accuracy" v={report.accuracy != null ? report.accuracy.toFixed(3) : "—"} />
        </div>
        {report.threshold_ci && (
          <p className="mt-2 text-[10px] font-mono text-muted-foreground">
            Ψ* 95% CI across folds: [{report.threshold_ci[0].toFixed(3)}, {report.threshold_ci[1].toFixed(3)}]
          </p>
        )}
      </div>
      {report.folds.length > 0 && (
        <div className="module-card">
          <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2">Per-fold result</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
                <th className="py-1.5">Held out</th><th>Ψ* (train)</th><th>Predicted</th><th>Actual</th><th>Correct</th>
              </tr>
            </thead>
            <tbody>
              {report.folds.map((f) => (
                <tr key={f.held_out} className="border-b border-border/50">
                  <td className="py-1.5 font-mono">{f.held_out}</td>
                  <td className="font-mono">{f.threshold.toFixed(3)}</td>
                  <td className="font-mono">{f.predicted_positive ? "positive" : "negative"}</td>
                  <td className="font-mono">{f.actual_positive == null ? "—" : f.actual_positive ? "positive" : "negative"}</td>
                  <td className="font-mono">{f.correct == null ? "—" : f.correct ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function ExtendedBenchmarkTab({ cohorts }: { cohorts: CohortTrajectory[] }) {
  const results: ExtendedBenchmarkResult[] = useMemo(() => {
    if (!cohorts.length) return [];
    // build a sample matrix where each (cohort × timepoint) is one "sample"
    // features = [fTTI]; supplement with timepoint as a second feature for variance
    const X: number[][] = [];
    const y: (0 | 1)[] = [];
    const t: number[] = [];
    cohorts.forEach((c) => {
      c.timepoints.forEach((tt, i) => {
        X.push([c.fTTI[i], tt]);
        t.push(tt);
        if (c.phenotype) y.push(c.phenotype.positive ? 1 : 0);
        else y.push(0);
      });
    });
    return runExtendedBenchmarks({ X, y: cohorts.every((c) => c.phenotype) ? y : undefined, t });
  }, [cohorts]);

  if (!cohorts.length) {
    return <div className="module-card text-sm text-muted-foreground">Load cohorts on the Multi-cohort tab first.</div>;
  }
  return (
    <div className="space-y-4">
      <div className="border border-border bg-muted/30 rounded-md p-3 text-[11px] text-foreground/80">
        These are <strong>in-browser approximations</strong> of PHATE / Monocle / CellRank / Waddington-OT — not the reference implementations. Use as orientation only; reference-implementation comparisons must be run offline.
      </div>
      <div className="module-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
              <th className="py-1.5">Method</th><th>Full name</th><th>Score</th><th>Note</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.method} className="border-b border-border/50">
                <td className="py-1.5 font-mono">{r.method}</td>
                <td>{r.full_name}</td>
                <td className="font-mono">{Number.isFinite(r.score) ? r.score.toFixed(4) : "—"}</td>
                <td className="text-[11px] text-muted-foreground">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function ProspectiveTab() {
  const [rows, setRows] = useState<SealedPredictionRow[]>([]);
  const [form, setForm] = useState<SealedPredictionInput>({
    cohort_label: "",
    pre_transition_timepoints: [],
    pre_transition_fTTI: [],
    threshold: DEFAULT_THRESHOLD,
    predicted_transition_window: [10, 14],
    predicted_attractor: "resistant",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const refresh = async () => { try { setRows(await listSealedPredictions()); } catch (e: any) { toast.error(e.message); } };
  useEffect(() => { refresh(); }, []);

  const onSeal = async () => {
    if (!form.cohort_label) { toast.error("cohort_label required"); return; }
    setLoading(true);
    try { await sealPrediction(form); toast.success("Prediction sealed."); await refresh(); }
    catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="module-card">
        <h3 className="text-xs font-mono uppercase text-muted-foreground mb-3 flex items-center gap-2">
          <Lock className="w-3 h-3" /> Seal a prospective prediction (hashed at seal-time)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <Field label="cohort_label">
            <input value={form.cohort_label} onChange={(e) => setForm({ ...form, cohort_label: e.target.value })}
              className="w-full h-8 px-2 text-sm font-mono border border-border rounded bg-background" />
          </Field>
          <Field label="predicted_attractor">
            <input value={form.predicted_attractor} onChange={(e) => setForm({ ...form, predicted_attractor: e.target.value })}
              className="w-full h-8 px-2 text-sm font-mono border border-border rounded bg-background" />
          </Field>
          <Field label="window low (t)">
            <input type="number" value={form.predicted_transition_window[0]}
              onChange={(e) => setForm({ ...form, predicted_transition_window: [Number(e.target.value), form.predicted_transition_window[1]] })}
              className="w-full h-8 px-2 text-sm font-mono border border-border rounded bg-background" />
          </Field>
          <Field label="window high (t)">
            <input type="number" value={form.predicted_transition_window[1]}
              onChange={(e) => setForm({ ...form, predicted_transition_window: [form.predicted_transition_window[0], Number(e.target.value)] })}
              className="w-full h-8 px-2 text-sm font-mono border border-border rounded bg-background" />
          </Field>
          <Field label="threshold Ψ* used">
            <input type="number" step={0.1} value={form.threshold}
              onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
              className="w-full h-8 px-2 text-sm font-mono border border-border rounded bg-background" />
          </Field>
          <Field label="notes">
            <input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full h-8 px-2 text-sm font-mono border border-border rounded bg-background" />
          </Field>
        </div>
        <button onClick={onSeal} disabled={loading}
          className="mt-3 h-8 px-3 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Seal prediction
        </button>
      </div>

      <div className="module-card">
        <h3 className="text-xs font-mono uppercase text-muted-foreground mb-3">Sealed predictions</h3>
        {rows.length === 0 && <p className="text-xs text-muted-foreground">No sealed predictions yet.</p>}
        <div className="space-y-3">
          {rows.map((r) => <SealedRow key={r.id} row={r} onChange={refresh} />)}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SealedRow({ row, onChange }: { row: SealedPredictionRow; onChange: () => void }) {
  const [outcome, setOutcome] = useState<OutcomePayload>({
    observed_transition_t: row.outcome_payload?.observed_transition_t ?? null,
    observed_attractor: row.outcome_payload?.observed_attractor ?? null,
    notes: row.outcome_payload?.notes ?? "",
  });
  const submit = async () => {
    try { await scoreSealedPrediction(row, outcome); toast.success("Outcome scored."); onChange(); }
    catch (e: any) { toast.error(e.message); }
  };
  const del = async () => {
    if (!confirm(`Delete sealed prediction for ${row.cohort_label}?`)) return;
    try { await deleteSealedPrediction(row.id); onChange(); } catch (e: any) { toast.error(e.message); }
  };
  const v = row.scoring_result?.verdict;
  const verdictColor =
    v === "correct" ? "text-chart-emerald" :
    v === "partial" ? "text-chart-amber" :
    v === "incorrect" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="border border-border rounded-md p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-mono">{row.cohort_label}</p>
          <p className="text-[10px] font-mono text-muted-foreground">sealed {new Date(row.sealed_at).toLocaleString()}</p>
          <p className="text-[10px] font-mono text-muted-foreground break-all">hash: {row.sealed_hash.slice(0, 24)}…</p>
          <p className="text-[11px] text-foreground/80 mt-1">
            window=[{row.sealed_payload.predicted_transition_window[0]}, {row.sealed_payload.predicted_transition_window[1]}], attractor=<code>{row.sealed_payload.predicted_attractor}</code>, Ψ*={row.sealed_payload.threshold}
          </p>
        </div>
        <button onClick={del} className="text-muted-foreground hover:text-destructive" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
        <Field label="observed_transition_t">
          <input type="number"
            value={outcome.observed_transition_t ?? ""}
            onChange={(e) => setOutcome({ ...outcome, observed_transition_t: e.target.value === "" ? null : Number(e.target.value) })}
            className="w-full h-8 px-2 text-sm font-mono border border-border rounded bg-background" />
        </Field>
        <Field label="observed_attractor">
          <input value={outcome.observed_attractor ?? ""}
            onChange={(e) => setOutcome({ ...outcome, observed_attractor: e.target.value || null })}
            className="w-full h-8 px-2 text-sm font-mono border border-border rounded bg-background" />
        </Field>
        <Field label="notes">
          <input value={outcome.notes ?? ""} onChange={(e) => setOutcome({ ...outcome, notes: e.target.value })}
            className="w-full h-8 px-2 text-sm font-mono border border-border rounded bg-background" />
        </Field>
      </div>
      <button onClick={submit}
        className="mt-2 h-7 px-3 text-[11px] border border-border rounded hover:bg-muted flex items-center gap-1">
        <BookCheck className="w-3 h-3" /> Score outcome
      </button>

      {row.scoring_result && (
        <div className="mt-3 border-t border-border pt-2 text-[11px] font-mono">
          <div className={`uppercase ${verdictColor}`}>verdict: {row.scoring_result.verdict}</div>
          <div className="text-muted-foreground">
            hash_verified={String(row.scoring_result.hash_verified)} ·
            window_hit={String(row.scoring_result.window_hit)} ·
            attractor_match={String(row.scoring_result.attractor_match)} ·
            lead_time={row.scoring_result.lead_time != null ? row.scoring_result.lead_time.toFixed(2) : "—"}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
export default function ValidationHarnessPanel() {
  const [tab, setTab] = useState<Tab>("multi");
  const [cohorts, setCohorts] = useState<CohortTrajectory[]>([]);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const { activeCohort } = useTempest();

  const report = useMemo(
    () => (cohorts.length ? aggregateMultiCohort(cohorts, threshold) : null),
    [cohorts, threshold],
  );

  const anyDemo = cohorts.some((c) => c.provenance === "DEMO/SYNTHETIC");

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" /> Validation Harness
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Closes the four reviewer weaknesses by structure (not by fabricating data): (1) multi-cohort longitudinal aggregation, (2) walk-forward Ψ* calibration with LOOCV, (3) extended benchmarks against PHATE / Monocle / CellRank / WOT proxies, (4) sealed prospective-prediction harness with hash verification.
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <EvidenceBadge type={tab === "prospect" ? "prospective-prediction" : "longitudinal-trajectory"} />
          <ProvenanceBadge value={anyDemo ? "DEMO/SYNTHETIC" : cohorts.length ? "USER-UPLOADED" : "PENDING VERIFICATION"} />
        </div>
      </div>

      <HonestyBanner />

      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-mono uppercase tracking-wide border-b-2 -mb-px flex items-center gap-2 ${
                isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab !== "prospect" && (
        <CohortsControls cohorts={cohorts} setCohorts={setCohorts} threshold={threshold} setThreshold={setThreshold} allowDemo />
      )}

      {tab === "multi"    && <MultiCohortTab cohorts={cohorts} threshold={threshold} report={report} />}
      {tab === "walk"     && <WalkForwardTab cohorts={cohorts} />}
      {tab === "bench"    && <ExtendedBenchmarkTab cohorts={cohorts} />}
      {tab === "prospect" && <ProspectiveTab />}

      {activeCohort && tab === "multi" && (
        <p className="text-[10px] font-mono text-muted-foreground">
          Active cohort in TEMPEST context: <span className="text-foreground">{activeCohort.name}</span> — not auto-imported; upload its longitudinal CSV above to include it.
        </p>
      )}
    </div>
  );
}
