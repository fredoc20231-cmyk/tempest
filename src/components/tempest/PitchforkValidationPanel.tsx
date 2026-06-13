import { useMemo, useState } from "react";
import { runPitchforkValidation, type PitchforkResult } from "@/lib/synthetic/pitchfork";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Play, FlaskConical } from "lucide-react";
import { EvidenceBadge } from "./EvidenceBadge";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { DISCLAIMER_FTTI } from "@/lib/scopeConfig";

export default function PitchforkValidationPanel() {
  const [result, setResult] = useState<PitchforkResult | null>(() => runPitchforkValidation());
  const [running, setRunning] = useState(false);
  const [n, setN] = useState(60);
  const [sigma, setSigma] = useState(0.25);

  const data = useMemo(
    () => result?.points.map((p) => ({ r: p.r.toFixed(2), fTTI: p.fTTI, daDist: p.daDist, fiedler: p.fiedler })) ?? [],
    [result],
  );

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      setResult(runPitchforkValidation({ n, sigma, seed: 42 }));
      setRunning(false);
    }, 50);
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-chart-magenta" /> Pitchfork Validation (Synthetic)
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Simulate <code className="font-mono">dx/dt = r·x − x³ + σ·η(t)</code> across an r-grid; true bifurcation at r = 0. AUROC quantifies how well each metric separates pre- vs post-bifurcation states.
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <EvidenceBadge type="synthetic-ground-truth" />
          <ProvenanceBadge value="DEMO/SYNTHETIC" />
        </div>
      </div>

      <div className="module-card flex flex-wrap items-end gap-4">
        <label className="text-xs font-mono text-muted-foreground">
          n per r
          <input
            type="number"
            min={20}
            max={400}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value) || 60)}
            className="block mt-1 w-24 bg-secondary border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground"
          />
        </label>
        <label className="text-xs font-mono text-muted-foreground">
          σ (noise)
          <input
            type="number"
            min={0.05}
            max={1}
            step={0.05}
            value={sigma}
            onChange={(e) => setSigma(parseFloat(e.target.value) || 0.25)}
            className="block mt-1 w-24 bg-secondary border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground"
          />
        </label>
        <Button onClick={run} disabled={running} className="font-mono text-xs">
          <Play className="w-3.5 h-3.5 mr-1.5" /> {running ? "Simulating…" : "Re-run"}
        </Button>
      </div>

      <div className="module-card">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2">Metric vs r (true bifurcation at r = 0)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="r" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
            <YAxis tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine x="0.00" stroke="hsl(var(--chart-rose))" strokeDasharray="4 4" label={{ value: "r = 0", fontSize: 10, fill: "hsl(var(--chart-rose))" }} />
            <Line type="monotone" dataKey="fTTI" stroke="hsl(var(--primary))" strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="daDist" stroke="hsl(var(--chart-amber))" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="fiedler" stroke="hsl(var(--chart-emerald))" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="module-card">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-3">AUROC vs ground truth (r &gt; 0)</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "fTTI (composite)", v: result?.auroc.fTTI, color: "text-primary" },
            { label: "DA-dist", v: result?.auroc.daDist, color: "text-chart-amber" },
            { label: "Fiedler λ2", v: result?.auroc.fiedler, color: "text-chart-emerald" },
          ].map((m) => (
            <div key={m.label} className="bg-secondary/40 rounded-md p-3 text-center">
              <p className="text-[10px] font-mono text-muted-foreground uppercase">{m.label}</p>
              <p className={`text-2xl font-mono font-bold mt-1 ${m.color}`}>{m.v?.toFixed(3) ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground italic border-t border-border pt-3">{DISCLAIMER_FTTI}</p>
    </div>
  );
}
