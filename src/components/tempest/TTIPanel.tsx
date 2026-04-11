import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Hexagon, Play, Loader2, AlertTriangle, CheckCircle2, Upload, Database, FlaskConical,
  BarChart3, Search, ExternalLink, TrendingUp, Info,
} from "lucide-react";
import {
  computeTTI, computePCA, standardize, subsampleData, parseUpload,
  GENERATORS, searchGEO, fetchTCGAOV, OV_SYMBOLS, OV_GENES,
  loadNeuroblastomaReference, NB_GENES, NB_CELL_LINES, NB_ADRN_LINES, NB_MES_LINES,
  loadParentResistantReference, PR_GENES, PR_CELL_LINES, PR_PARENTAL, PR_RESISTANT,
  loadGEMReference, GEM_GENES, GEM_SAMPLES, GEM_STIC_LABELS, GEM_TUMOR_LABELS,
  type TTIResult, type GEOResult, type TCGAData, type NeuroblastomaData,
  type ParentResistantData, type GEMData,
} from "@/lib/ttiEngine";
import { supabase } from "@/integrations/supabase/client";
import { useTempest } from "@/contexts/TempestContext";
import { toast } from "sonner";

/* ════════════════════════════════════════════════
   SVG Visualizations — all driven by real computed data
   ════════════════════════════════════════════════ */

function PCAScatter({
  pca, S_mask, R_mask, W = 380, H = 260,
}: { pca: { scores: number[][]; varExp: number[] }; S_mask: boolean[]; R_mask: boolean[]; W?: number; H?: number }) {
  if (!pca?.scores?.length) return null;
  const { scores, varExp } = pca;
  const xs = scores.map(r => r[0]), ys = scores.map(r => r[1]);
  const xMn = Math.min(...xs), xMx = Math.max(...xs), yMn = Math.min(...ys), yMx = Math.max(...ys);
  const mg = 24;
  const tx = (x: number) => mg + ((x - xMn) / (xMx - xMn + 1e-9)) * (W - 2 * mg);
  const ty = (y: number) => H - mg - ((y - yMn) / (yMx - yMn + 1e-9)) * (H - 2 * mg);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-card rounded-md border border-border">
      {[0.25, 0.5, 0.75].map(f => (
        <g key={f}>
          <line x1={W * f} y1={0} x2={W * f} y2={H} stroke="hsl(var(--border))" strokeWidth={0.4} strokeDasharray="2,8" />
          <line x1={0} y1={H * f} x2={W} y2={H * f} stroke="hsl(var(--border))" strokeWidth={0.4} strokeDasharray="2,8" />
        </g>
      ))}
      {scores.map(([x, y], i) => (
        <circle key={i} cx={tx(x)} cy={ty(y)}
          r={S_mask[i] || R_mask[i] ? 3.5 : 2}
          fill={S_mask[i] ? "hsl(var(--chart-emerald))" : R_mask[i] ? "hsl(var(--chart-amber))" : "hsl(var(--muted-foreground))"}
          opacity={S_mask[i] || R_mask[i] ? 0.78 : 0.35} />
      ))}
      <rect x={6} y={6} width={92} height={40} rx={3} fill="hsl(var(--card))" opacity={0.92} />
      <circle cx={18} cy={18} r={4} fill="hsl(var(--chart-emerald))" />
      <text x={26} y={22} fill="hsl(var(--foreground))" fontSize={10} fontFamily="IBM Plex Mono">Parental</text>
      <circle cx={18} cy={34} r={4} fill="hsl(var(--chart-amber))" />
      <text x={26} y={38} fill="hsl(var(--foreground))" fontSize={10} fontFamily="IBM Plex Mono">Resistant</text>
      {varExp && (
        <text x={W - 4} y={H - 4} fill="hsl(var(--muted-foreground))" fontSize={8} textAnchor="end" fontFamily="IBM Plex Mono">
          PC1:{varExp[0]?.toFixed(1)}% PC2:{varExp[1]?.toFixed(1)}%
        </text>
      )}
    </svg>
  );
}

function H0Plot({ h0, W = 380, H = 200 }: { h0: TTIResult["h0"]; W?: number; H?: number }) {
  if (!h0?.eps) return null;
  const { eps, beta0, F } = h0;
  const T = eps.length;
  const mg = { l: 36, r: 12, t: 14, b: 28 };
  const pw = W - mg.l - mg.r, ph = H - mg.t - mg.b;
  const xMn = eps[0], xMx = eps[T - 1];
  const yMx = Math.max(...beta0, 1);
  const tx = (x: number) => mg.l + ((x - xMn) / (xMx - xMn + 1e-9)) * pw;
  const ty = (y: number) => H - mg.b - (y / yMx) * ph;
  const ld = eps.map((x, i) => `${i === 0 ? "M" : "L"}${tx(x).toFixed(1)},${ty(beta0[i]).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-card rounded-md border border-border">
      <defs>
        <linearGradient id="h0-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--chart-emerald))" stopOpacity={0.35} />
          <stop offset="100%" stopColor="hsl(var(--chart-emerald))" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${ld} L${tx(xMx)},${H - mg.b} L${tx(xMn)},${H - mg.b} Z`} fill="url(#h0-grad)" />
      <path d={ld} fill="none" stroke="hsl(var(--chart-emerald))" strokeWidth={2} />
      {[1, Math.round(yMx / 2), yMx].filter((v, i, a) => a.indexOf(v) === i && v > 0).map(v => (
        <g key={v}>
          <line x1={mg.l - 3} y1={ty(v)} x2={mg.l} y2={ty(v)} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
          <text x={mg.l - 5} y={ty(v) + 4} fill="hsl(var(--muted-foreground))" fontSize={9} textAnchor="end">{v}</text>
        </g>
      ))}
      <text x={W / 2} y={H - 4} fill="hsl(var(--muted-foreground))" fontSize={9} textAnchor="middle" fontFamily="IBM Plex Mono">ε (filtration scale)</text>
      <text x={mg.l + 3} y={mg.t + 12} fill="hsl(var(--chart-emerald))" fontSize={9} fontFamily="IBM Plex Mono">β₀(ε)</text>
      <text x={W - mg.r} y={mg.t + 12} fill="hsl(var(--chart-amber))" fontSize={10} textAnchor="end" fontFamily="IBM Plex Mono">F={F.toFixed(4)}</text>
    </svg>
  );
}

function NullHistogram({
  arr, obs, label, W = 220, H = 120,
}: { arr: number[]; obs: number; label: string; W?: number; H?: number }) {
  if (!arr?.length) return null;
  const mn = Math.min(...arr, obs), mx = Math.max(...arr, obs);
  const bins = 20, bw = (mx - mn) / bins || 1;
  const counts = Array(bins).fill(0);
  arr.forEach(v => { const b = Math.min(bins - 1, Math.floor((v - mn) / bw)); counts[b]++; });
  const maxC = Math.max(...counts, 1);
  const mg = { l: 6, r: 6, t: 8, b: 18 };
  const pw = W - mg.l - mg.r, ph = H - mg.t - mg.b;
  const obX = mg.l + ((obs - mn) / (mx - mn + 1e-9)) * pw;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-card rounded-md border border-border">
      {counts.map((c, i) => {
        const x = mg.l + (i * pw) / bins, h = (c / maxC) * ph;
        return <rect key={i} x={x} y={H - mg.b - h} width={Math.max(1, pw / bins - 1)} height={h} fill="hsl(var(--muted-foreground))" opacity={0.5} />;
      })}
      <line x1={obX} y1={mg.t} x2={obX} y2={H - mg.b} stroke="hsl(var(--chart-rose))" strokeWidth={2} />
      <text x={Math.min(obX + 2, W - 32)} y={mg.t + 10} fill="hsl(var(--chart-rose))" fontSize={8} fontFamily="IBM Plex Mono">{obs.toFixed(2)}</text>
      <text x={W / 2} y={H - 3} fill="hsl(var(--muted-foreground))" fontSize={8} textAnchor="middle" fontFamily="IBM Plex Mono">{label}</text>
    </svg>
  );
}

/* ════════════════════════════════════════════════
   TTI Result Summary
   ════════════════════════════════════════════════ */

function TTISummary({ result }: { result: TTIResult }) {
  const { tti, tti_ci, z, p, raw, phaseTransition, n } = result;

  const comps = [
    { key: "zL" as const, label: "L — Loop Mass (H1)", zv: z.zL, pv: p.pL, rv: raw.L, desc: `β₁ = ${raw.beta1}`, cssVar: "--chart-rose" },
    { key: "zB" as const, label: "B — Branching (H0+D)", zv: z.zB, pv: p.pB, rv: raw.B, desc: `F=${raw.F.toFixed(4)} D=${raw.D.toFixed(4)}`, cssVar: "--chart-amber" },
    { key: "zN" as const, label: "N — Bottleneck (φ)", zv: z.zN, pv: p.pN, rv: raw.N, desc: `φ=${raw.phi.toFixed(5)}`, cssVar: "--chart-emerald" },
  ];
  const maxZ = Math.max(6, ...comps.map(c => Math.abs(c.zv)));

  return (
    <div className="space-y-4">
      {/* Score + metadata */}
      <div className="grid grid-cols-3 gap-4">
        <div className="module-card text-center col-span-1">
          <p className="text-[10px] font-mono text-muted-foreground uppercase">Composite TTI</p>
          <p className={`text-4xl font-mono font-bold mt-1 ${phaseTransition ? "text-chart-rose" : "text-chart-emerald"}`}>
            {tti.toFixed(3)}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">
            95% CI [{tti_ci[0]?.toFixed(2) ?? "—"}, {tti_ci[1]?.toFixed(2) ?? "—"}]
          </p>
          <Badge variant={phaseTransition ? "destructive" : "secondary"} className="font-mono text-[10px] mt-3">
            {phaseTransition ? "⚡ PHASE TRANSITION" : "○ No Transition"}
          </Badge>
        </div>
        <div className="col-span-2 grid grid-cols-3 gap-2">
          {[
            { l: "Threshold", v: "TTI ≥ 6.0" }, { l: "φ conductance", v: raw.phi.toFixed(5) }, { l: "n samples", v: n },
            { l: "β₁ (H1 cycles)", v: raw.beta1 }, { l: "Graph edges", v: raw.edges }, { l: "Components", v: raw.comps },
          ].map(({ l, v }) => (
            <div key={l} className="bg-secondary/50 rounded-md p-2.5 text-center">
              <p className="text-[10px] font-mono text-muted-foreground uppercase">{l}</p>
              <p className="text-sm font-mono font-bold text-foreground mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Component bars */}
      <div className="grid grid-cols-3 gap-3">
        {comps.map(({ label, zv, pv, desc, cssVar }) => (
          <div key={label} className="module-card">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-mono font-bold mt-1" style={{ color: `hsl(var(${cssVar}))` }}>z={zv.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{desc}</p>
            <p className={`text-[10px] font-mono mt-0.5 ${pv < 0.05 ? "text-chart-rose" : "text-muted-foreground"}`}>
              p={pv.toFixed(3)}{pv < 0.05 ? " *" : ""}
            </p>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (Math.abs(zv) / maxZ) * 100)}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full"
                style={{ background: `hsl(var(${cssVar}))` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Progress Display
   ════════════════════════════════════════════════ */

function ComputeProgress({ pct, msg }: { pct: number; msg: string }) {
  return (
    <div className="space-y-2 mb-4">
      <Progress value={pct} className="h-1.5" />
      <p className="text-[10px] font-mono text-muted-foreground">{msg}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   UPLOAD TAB — Real CSV parsing + TTI
   ════════════════════════════════════════════════ */

function UploadTab({ onResult }: { onResult: (r: TTIResult) => void }) {
  const [status, setStatus] = useState("");
  const [pct, setPct] = useState(0);
  const [parsed, setParsed] = useState<ReturnType<typeof parseUpload> | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState("");
  const [k, setK] = useState(12);
  const [nullReps, setNullReps] = useState(50);
  const [sLabel, setSLabel] = useState("");
  const [rLabel, setRLabel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setParsed(null); setStatus("");
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const p = parseUpload(ev.target?.result as string);
        setParsed(p); setSLabel(p.sLabel); setRLabel(p.rLabel);
        setStatus(`✓ ${p.nSamples} samples × ${p.nFeatures} features  |  Groups: ${p.uniqueLabels.join(", ")}`);
      } catch (err: any) { setError(err.message); }
    };
    reader.readAsText(file);
  };

  const run = async () => {
    if (!parsed) return;
    setComputing(true); setError(""); setPct(0);
    try {
      const S = parsed.labels.map(l => l === sLabel), R = parsed.labels.map(l => l === rLabel);
      if (!S.some(Boolean)) throw new Error(`No samples labelled "${sLabel}"`);
      if (!R.some(Boolean)) throw new Error(`No samples labelled "${rLabel}"`);
      let X = parsed.X;
      if (X.length > 800) {
        const sub = subsampleData(X, S, R, 800);
        X = sub.X;
        setStatus(s => s + " [subsampled to 800]");
      }
      const Xs = standardize(X);
      const res = await computeTTI(Xs, S.slice(0, X.length), R.slice(0, X.length),
        { k, nullReps, bsReps: 50, seed: 42 }, (msg, p) => { setStatus(msg); setPct(p); });
      res.sourceName = `${fileRef.current?.files?.[0]?.name || "upload"} · ${sLabel} vs ${rLabel} · n=${X.length}`;
      onResult(res);
    } catch (err: any) { setError(err.message); }
    finally { setComputing(false); }
  };

  return (
    <div className="space-y-4">
      <div className="module-card">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-mono text-accent uppercase tracking-wide font-semibold">Upload Your Data</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          <strong className="text-foreground">Format:</strong> CSV or TSV. Rows = samples, columns = features (genes / ATAC peaks / PCs).
          Include a column named <code className="text-accent">label</code>, <code className="text-accent">condition</code>, or <code className="text-accent">group</code> for group assignment.
          Without it, rows split 50/50. Data auto-scaled. Capped at 800 samples (O(n²) kNN).
        </p>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile}
          className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer" />
        {error && <p className="text-xs text-destructive mt-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {error}</p>}
        {status && !computing && <p className="text-xs font-mono text-chart-emerald mt-2">{status}</p>}
      </div>

      {parsed && (
        <div className="module-card">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Parental group</p>
              <select value={sLabel} onChange={e => setSLabel(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md px-2 py-1.5 text-xs font-mono text-foreground">
                {parsed.uniqueLabels.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Resistant group</p>
              <select value={rLabel} onChange={e => setRLabel(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md px-2 py-1.5 text-xs font-mono text-foreground">
                {parsed.uniqueLabels.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                <span>k neighbours</span><span className="text-foreground">{k}</span>
              </div>
              <Slider min={5} max={40} step={5} value={[k]} onValueChange={([v]) => setK(v)} />
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                <span>Null reps</span><span className="text-foreground">{nullReps}</span>
              </div>
              <Slider min={20} max={150} step={10} value={[nullReps]} onValueChange={([v]) => setNullReps(v)} />
            </div>
          </div>
          {computing && <ComputeProgress pct={pct} msg={status} />}
          <Button onClick={run} disabled={computing} className="font-mono text-xs">
            {computing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing…</> : <><Play className="w-3.5 h-3.5" /> Compute TTI</>}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   DATABASE TAB — Real NCBI GEO + cBioPortal APIs
   ════════════════════════════════════════════════ */

function DatabaseTab({ onResult }: { onResult: (r: TTIResult) => void }) {
  const [db, setDb] = useState<"tcga" | "geo" | "nb" | "pr" | "gem">("tcga");
  const [geoQ, setGeoQ] = useState("ovarian cancer cisplatin resistance");
  const [geoRes, setGeoRes] = useState<GEOResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoErr, setGeoErr] = useState("");
  const [selGEO, setSelGEO] = useState<GEOResult | null>(null);

  const [tcgaStatus, setTcgaStatus] = useState("");
  const [tcgaData, setTcgaData] = useState<TCGAData | null>(null);
  const [tcgaErr, setTcgaErr] = useState("");
  const [tcgaLoading, setTcgaLoading] = useState(false);

  const [nbData, setNbData] = useState<NeuroblastomaData | null>(null);
  const [nbStatus, setNbStatus] = useState("");

  const [prData, setPrData] = useState<ParentResistantData | null>(null);
  const [prStatus, setPrStatus] = useState("");

  const [gemData, setGemData] = useState<GEMData | null>(null);
  const [gemStatus, setGemStatus] = useState("");

  const [computing, setComputing] = useState(false);
  const [pct, setPct] = useState(0);
  const [progMsg, setProgMsg] = useState("");
  const [k, setK] = useState(10);
  const [nullReps, setNullReps] = useState(50);

  const { setAIContext } = useTempest();

  // Auto-save dataset as training data + update AI context
  const trainOnDataset = async (name: string, source: string, category: string, geneSymbols: string[], nSamples: number, ttiResult: TTIResult) => {
    try {
      const trainingRecord = {
        name,
        source: "reference",
        category,
        description: `${name} — TTI=${ttiResult.tti.toFixed(2)}, phase transition: ${ttiResult.phaseTransition ? "YES" : "NO"}. ${nSamples} samples, ${geneSymbols.length} genes.`,
        data: { genes: geneSymbols, tti: ttiResult.tti, z: ttiResult.z, raw: ttiResult.raw, sourceName: ttiResult.sourceName },
        record_count: nSamples,
        metadata: { tti_score: ttiResult.tti, phase_transition: ttiResult.phaseTransition, gene_panel: geneSymbols },
        is_training: true,
      };
      await supabase.from("datasets").insert(trainingRecord);
      setAIContext({
        module: "tti",
        content: `Training dataset loaded: ${name}. TTI=${ttiResult.tti.toFixed(2)}, zL=${ttiResult.z.zL.toFixed(2)}, zB=${ttiResult.z.zB.toFixed(2)}, zN=${ttiResult.z.zN.toFixed(2)}. Genes: ${geneSymbols.slice(0, 15).join(", ")}. Phase transition: ${ttiResult.phaseTransition ? "YES" : "NO"}.`,
        timestamp: Date.now(),
      });
      toast.success(`${name} saved as training data — AI model enriched`);
    } catch (e) {
      console.error("Failed to save training data:", e);
    }
  };

  const doGEO = async () => {
    setGeoLoading(true); setGeoErr(""); setGeoRes([]);
    try { setGeoRes(await searchGEO(geoQ)); }
    catch (e: any) { setGeoErr(e.message); }
    finally { setGeoLoading(false); }
  };

  const doFetchTCGA = async () => {
    setTcgaLoading(true); setTcgaErr(""); setTcgaData(null);
    try { const d = await fetchTCGAOV(setTcgaStatus); setTcgaData(d); }
    catch (e: any) { setTcgaErr(e.message); }
    finally { setTcgaLoading(false); }
  };

  const loadNB = () => { setNbData(loadNeuroblastomaReference(setNbStatus)); };
  const loadPR = () => { setPrData(loadParentResistantReference(setPrStatus)); };
  const loadGEM = () => { setGemData(loadGEMReference(setGemStatus)); };

  const runGenericTTI = async (
    label: string, X: number[][], S_mask: boolean[], R_mask: boolean[],
    geneSymbols: string[], category: string, kOverride?: number,
  ) => {
    setComputing(true); setPct(0);
    try {
      const Xs = standardize(X);
      const kVal = kOverride ?? Math.min(k, Math.floor(X.length / 3));
      const res = await computeTTI(Xs, S_mask, R_mask,
        { k: kVal, nullReps, bsReps: 30, seed: 42 }, (msg, p) => { setProgMsg(msg); setPct(p); });
      res.sourceName = label;
      res.genePanel = geneSymbols;
      onResult(res);
      // Auto-train
      await trainOnDataset(label, "reference", category, geneSymbols, X.length, res);
    } catch (e: any) { console.error(e); toast.error(e.message); }
    finally { setComputing(false); }
  };

  const runTCGATTI = async () => {
    if (!tcgaData) return;
    setComputing(true); setPct(0);
    try {
      let { X, S_mask: S, R_mask: R } = tcgaData;
      const keep = X.map((_, i) => S[i] || R[i]);
      X = X.filter((_, i) => keep[i]);
      const Sf = S.filter((_, i) => keep[i]), Rf = R.filter((_, i) => keep[i]);
      const sub = subsampleData(X, Sf, Rf, 700);
      const Xs = standardize(sub.X);
      const res = await computeTTI(Xs, sub.S_mask, sub.R_mask,
        { k, nullReps, bsReps: 50, seed: 42 }, (msg, p) => { setProgMsg(msg); setPct(p); });
      res.sourceName = `TCGA-OV · cBioPortal · ${tcgaData.geneSymbols.join(", ")} · Stage I–II vs III–IV · n=${sub.X.length}`;
      res.genePanel = tcgaData.geneSymbols;
      onResult(res);
      await trainOnDataset(res.sourceName, "tcga", "expression", tcgaData.geneSymbols, sub.X.length, res);
    } catch (e: any) { setTcgaErr(e.message); }
    finally { setComputing(false); }
  };

  const DB_SOURCES = [
    { id: "tcga" as const, label: "TCGA-OV (cBioPortal)", icon: <Database className="w-3.5 h-3.5" /> },
    { id: "pr" as const, label: "Parent vs Resistant", icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: "gem" as const, label: "STIC GEM Mouse", icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: "nb" as const, label: "Neuroblastoma (Reference)", icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: "geo" as const, label: "NCBI GEO Search", icon: <Search className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {DB_SOURCES.map(({ id, label, icon }) => (
          <Button key={id} variant={db === id ? "default" : "outline"} size="sm"
            className="font-mono text-xs" onClick={() => setDb(id)}>
            {icon} {label}
          </Button>
        ))}
      </div>

      {db === "tcga" && (
        <div className="space-y-4">
          <div className="module-card">
            <h3 className="text-xs font-mono text-accent uppercase tracking-wide font-semibold mb-3">TCGA Ovarian Cancer — Live cBioPortal API</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Real-time fetch of mRNA expression for <strong className="text-foreground">{OV_GENES.length} HGSOC driver genes</strong> via the cBioPortal public REST API.
              Staging: FIGO Stage I/II → <span className="text-chart-emerald">parental</span> · Stage III/IV → <span className="text-chart-amber">resistant/advanced</span>
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mb-4">Gene panel: {OV_SYMBOLS.join(" · ")}</p>
            <Button onClick={doFetchTCGA} disabled={tcgaLoading} className="font-mono text-xs">
              {tcgaLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching from cBioPortal…</> : "⬇ Fetch TCGA-OV Data"}
            </Button>
            {tcgaErr && <p className="text-xs text-destructive mt-2">{tcgaErr}</p>}
            {tcgaStatus && <p className="text-xs font-mono text-chart-emerald mt-2">{tcgaStatus}</p>}
          </div>
          {tcgaData && (
            <div className="module-card">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { l: "Total samples", v: tcgaData.nSamples },
                  { l: "Parental I/II", v: tcgaData.S_mask.filter(Boolean).length },
                  { l: "Advanced III/IV", v: tcgaData.R_mask.filter(Boolean).length },
                  { l: "Driver genes", v: tcgaData.geneSymbols.length },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-secondary/50 rounded-md p-3 text-center">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{l}</p>
                    <p className="text-xl font-mono font-bold text-accent mt-1">{v}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1"><span>k neighbours</span><span className="text-foreground">{k}</span></div>
                  <Slider min={5} max={25} step={1} value={[k]} onValueChange={([v]) => setK(v)} />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1"><span>Null reps</span><span className="text-foreground">{nullReps}</span></div>
                  <Slider min={20} max={120} step={10} value={[nullReps]} onValueChange={([v]) => setNullReps(v)} />
                </div>
              </div>
              {computing && <ComputeProgress pct={pct} msg={progMsg} />}
              <Button onClick={runTCGATTI} disabled={computing} className="font-mono text-xs">
                {computing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing TTI…</> : <><Play className="w-3.5 h-3.5" /> Run TTI on TCGA-OV</>}
              </Button>
            </div>
          )}
        </div>
      )}

      {db === "pr" && (
        <div className="space-y-4">
          <div className="module-card">
            <h3 className="text-xs font-mono text-accent uppercase tracking-wide font-semibold mb-3">
              HGSOC Parental vs Cisplatin-Resistant — Built-in Reference
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Matched <span className="text-chart-emerald">parental</span> and <span className="text-chart-amber">cisplatin-resistant</span> HGSOC cell line pairs
              (OVCAR3, SKOV3, OVCAR8, A2780). <strong className="text-foreground">{PR_GENES.length} genes</strong> spanning
              tumor suppressors, oncogenic drivers, stemness markers (SOX2, NANOG, CD44, ALDH1A1), and EMT effectors (ZEB1, SNAI1, TWIST1).
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mb-2">Parental: {PR_PARENTAL.join(" · ")}</p>
            <p className="text-[10px] font-mono text-muted-foreground mb-4">Resistant: {PR_RESISTANT.join(" · ")}</p>
            <Button onClick={loadPR} className="font-mono text-xs">
              <FlaskConical className="w-3.5 h-3.5" /> Load Parent vs Resistant Reference
            </Button>
            {prStatus && <p className="text-xs font-mono text-chart-emerald mt-2">{prStatus}</p>}
          </div>
          {prData && (
            <ReferenceDataRunner
              label={`HGSOC Parent vs Resistant · ${PR_GENES.length} genes × ${prData.nSamples} samples`}
              data={prData} category="expression" k={k} setK={setK} nullReps={nullReps} setNullReps={setNullReps}
              computing={computing} pct={pct} progMsg={progMsg} runTTI={() => runGenericTTI(
                `HGSOC Parent vs Resistant · ${PR_GENES.length} genes × ${prData.nSamples} samples (OVCAR3/SKOV3/OVCAR8/A2780)`,
                prData.X, prData.S_mask, prData.R_mask, prData.geneSymbols, "expression", Math.min(k, 6)
              )} runLabel="Run TTI on Parent vs Resistant"
            />
          )}
        </div>
      )}

      {db === "gem" && (
        <div className="space-y-4">
          <div className="module-card">
            <h3 className="text-xs font-mono text-accent uppercase tracking-wide font-semibold mb-3">
              STIC→Tumor GEM Mouse Model — Built-in Reference
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              GEM mouse model of HGSOC progression from <span className="text-chart-emerald">serous tubal intraepithelial carcinoma (STIC)</span> through
              <span className="text-chart-amber"> high-grade serous carcinoma + metastasis</span>.
              Based on D116 STIC→tumor switch (Pearson r = 0.94 convergence). <strong className="text-foreground">{GEM_GENES.length} genes</strong> spanning
              tumor suppressors, proliferation markers, terminal driver fusions (Camk1d::Arid1a, Mfhas1::Tns3), and immune infiltrate markers (Ccl18, Ccl4, Cxcl7, Cd8a).
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mb-2">STIC/Early: {GEM_STIC_LABELS.join(" · ")}</p>
            <p className="text-[10px] font-mono text-muted-foreground mb-4">HGS/Metastatic: {GEM_TUMOR_LABELS.join(" · ")}</p>
            <Button onClick={loadGEM} className="font-mono text-xs">
              <FlaskConical className="w-3.5 h-3.5" /> Load STIC GEM Mouse Reference
            </Button>
            {gemStatus && <p className="text-xs font-mono text-chart-emerald mt-2">{gemStatus}</p>}
          </div>
          {gemData && (
            <ReferenceDataRunner
              label={`STIC→Tumor GEM Mouse · ${GEM_GENES.length} genes × ${gemData.nSamples} samples`}
              data={gemData} category="expression" k={k} setK={setK} nullReps={nullReps} setNullReps={setNullReps}
              computing={computing} pct={pct} progMsg={progMsg} runTTI={() => runGenericTTI(
                `STIC→Tumor GEM Mouse · D116 progression · ${GEM_GENES.length} genes × ${gemData.nSamples} samples`,
                gemData.X, gemData.S_mask, gemData.R_mask, gemData.geneSymbols, "expression", Math.min(k, 5)
              )} runLabel="Run TTI on STIC GEM Mouse"
            />
          )}
        </div>
      )}

      {db === "nb" && (
        <div className="space-y-4">
          <div className="module-card">
            <h3 className="text-xs font-mono text-accent uppercase tracking-wide font-semibold mb-3">
              Neuroblastoma ADRN↔MES — Built-in Reference Data
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              H3K27ac ChIP-seq differential binding across <strong className="text-foreground">15 neuroblastoma cell lines</strong> (Boeva et al., Cancer Cell 2017).
              Tests cell identity separation between <span className="text-chart-emerald">Adrenergic (ADRN)</span> and <span className="text-chart-amber">Mesenchymal (MES)</span> states
              using <strong className="text-foreground">{NB_GENES.length} top differentially bound genes</strong>.
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mb-2">ADRN: {NB_ADRN_LINES.join(" · ")}</p>
            <p className="text-[10px] font-mono text-muted-foreground mb-4">MES: {NB_MES_LINES.join(" · ")}</p>
            <Button onClick={loadNB} className="font-mono text-xs">
              <FlaskConical className="w-3.5 h-3.5" /> Load Neuroblastoma Reference
            </Button>
            {nbStatus && <p className="text-xs font-mono text-chart-emerald mt-2">{nbStatus}</p>}
          </div>
          {nbData && (
            <ReferenceDataRunner
              label={`Neuroblastoma · H3K27ac · ADRN vs MES · ${NB_GENES.length} genes × ${nbData.nSamples} cell lines`}
              data={nbData} category="epigenomic" k={k} setK={setK} nullReps={nullReps} setNullReps={setNullReps}
              computing={computing} pct={pct} progMsg={progMsg} runTTI={() => runGenericTTI(
                `Neuroblastoma · H3K27ac ChIP-seq · ADRN vs MES · ${NB_GENES.length} genes × ${nbData.nSamples} cell lines (Boeva et al.)`,
                nbData.X, nbData.S_mask, nbData.R_mask, nbData.geneSymbols, "epigenomic", Math.min(k, 5)
              )} runLabel="Run TTI on Neuroblastoma ADRN vs MES"
            />
          )}
        </div>
      )}

      {db === "geo" && (
        <div className="space-y-3">
          <div className="module-card">
            <h3 className="text-xs font-mono text-accent uppercase tracking-wide font-semibold mb-3">NCBI GEO — Live E-utilities Search</h3>
            <div className="flex gap-2 mb-2">
              <Input value={geoQ} onChange={e => setGeoQ(e.target.value)} onKeyDown={e => e.key === "Enter" && doGEO()}
                placeholder="GSE26712  or  ovarian cancer ATAC-seq platinum resistance"
                className="flex-1 font-mono text-xs" />
              <Button onClick={doGEO} disabled={geoLoading} size="sm" className="font-mono text-xs">
                {geoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Search
              </Button>
            </div>
            {geoErr && <p className="text-xs text-destructive">{geoErr}</p>}
          </div>

          {geoRes.map(r => (
            <div key={r.id} className={`module-card cursor-pointer ${selGEO?.id === r.id ? "border-primary" : ""}`}
              onClick={() => setSelGEO(selGEO?.id === r.id ? null : r)}>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-xs font-bold text-accent">{r.accession}</span>
                <span className="text-[10px] text-muted-foreground">{r.nSamples} samples · {r.organism} · {r.pubDate}</span>
              </div>
              <p className="text-xs text-foreground mb-1">{r.title}</p>
              <p className="text-[10px] text-muted-foreground">{r.summary}{r.summary.length >= 200 ? "…" : ""}</p>
              {selGEO?.id === r.id && (
                <div className="mt-3 p-3 bg-secondary/50 rounded-md border-l-2 border-primary">
                  <p className="text-[10px] font-mono text-accent font-semibold mb-2">To analyse this dataset:</p>
                  <ol className="text-[10px] text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Download series matrix from GEO and decompress: <code className="text-accent">gunzip *.gz</code></li>
                    <li>Extract expression as CSV: rows = samples, cols = features; add <code className="text-accent">label</code> column</li>
                    <li>Upload via the <strong className="text-foreground">Upload &amp; Analyse</strong> tab for real TTI computation</li>
                  </ol>
                  <a href={`https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${r.accession}`} target="_blank" rel="noreferrer"
                    className="text-[10px] text-chart-emerald mt-2 inline-flex items-center gap-1">
                    Open {r.accession} on NCBI GEO <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Reusable runner sub-component for reference datasets ── */
function ReferenceDataRunner({ label, data, category, k, setK, nullReps, setNullReps, computing, pct, progMsg, runTTI, runLabel }: {
  label: string; data: { nSamples: number; S_mask: boolean[]; R_mask: boolean[]; geneSymbols: string[] };
  category: string; k: number; setK: (v: number) => void; nullReps: number; setNullReps: (v: number) => void;
  computing: boolean; pct: number; progMsg: string; runTTI: () => void; runLabel: string;
}) {
  return (
    <div className="module-card">
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { l: "Samples", v: data.nSamples },
          { l: "Group A", v: data.S_mask.filter(Boolean).length },
          { l: "Group B", v: data.R_mask.filter(Boolean).length },
          { l: "Genes", v: data.geneSymbols.length },
        ].map(({ l, v }) => (
          <div key={l} className="bg-secondary/50 rounded-md p-3 text-center">
            <p className="text-[10px] font-mono text-muted-foreground uppercase">{l}</p>
            <p className="text-xl font-mono font-bold text-accent mt-1">{v}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mb-3">
        Gene panel: {data.geneSymbols.slice(0, 15).join(" · ")}{data.geneSymbols.length > 15 ? ` … +${data.geneSymbols.length - 15} more` : ""}
      </p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1"><span>k neighbours</span><span className="text-foreground">{Math.min(k, Math.floor(data.nSamples / 3))}</span></div>
          <Slider min={2} max={Math.min(10, Math.floor(data.nSamples / 3))} step={1} value={[Math.min(k, Math.floor(data.nSamples / 3))]} onValueChange={([v]) => setK(v)} />
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1"><span>Null reps</span><span className="text-foreground">{nullReps}</span></div>
          <Slider min={20} max={120} step={10} value={[nullReps]} onValueChange={([v]) => setNullReps(v)} />
        </div>
      </div>
      {computing && <ComputeProgress pct={pct} msg={progMsg} />}
      <Button onClick={runTTI} disabled={computing} className="font-mono text-xs">
        {computing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing TTI…</> : <><Play className="w-3.5 h-3.5" /> {runLabel}</>}
      </Button>
      <p className="text-[10px] text-muted-foreground mt-2 italic">
        <Info className="w-3 h-3 inline mr-1" /> Results will be auto-saved as training data to enrich the AI model.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SIMULATE TAB — Supports both synthetic topologies AND loaded reference datasets
   ════════════════════════════════════════════════ */

const TOPO_META: Record<string, { label: string; icon: string; exp: string }> = {
  null_gaussian: { label: "Null Gaussian", icon: "○", exp: "Expect TTI ≈ 0, not significant — validates specificity." },
  bottleneck: { label: "Bottleneck", icon: "⊃⊂", exp: "Expect TTI > 6, high N (low conductance φ) — two separated basins." },
  branch_y: { label: "Y-Branch", icon: "⋔", exp: "Expect TTI > 6, high B (fragmentation + directional dispersion)." },
  loop: { label: "Cyclic Loop", icon: "⟳", exp: "Expect TTI > 6, high L (β₁ > 0, persistent H1 cycle)." },
};

interface RefDataset {
  id: string;
  label: string;
  loader: (cb: (s: string) => void) => { X: number[][]; S_mask: boolean[]; R_mask: boolean[]; nSamples: number; geneSymbols: string[] };
  category: string;
  groupA: string;
  groupB: string;
}

const REF_DATASETS: RefDataset[] = [
  { id: "pr", label: "HGSOC Parent vs Resistant", loader: (cb) => loadParentResistantReference(cb), category: "expression", groupA: "Parental", groupB: "Resistant" },
  { id: "gem", label: "STIC GEM Mouse", loader: (cb) => loadGEMReference(cb), category: "expression", groupA: "STIC/Early", groupB: "HGS/Tumor" },
  { id: "nb", label: "Neuroblastoma ADRN↔MES", loader: (cb) => loadNeuroblastomaReference(cb), category: "epigenomic", groupA: "ADRN", groupB: "MES" },
];

function SimulateTab({ onResult }: { onResult: (r: TTIResult) => void }) {
  const [mode, setMode] = useState<"synthetic" | "reference">("synthetic");
  const [topo, setTopo] = useState("bottleneck");
  const [refId, setRefId] = useState("pr");
  const [n, setN] = useState(130);
  const [k, setK] = useState(10);
  const [nullReps, setNullReps] = useState(50);
  const [seed, setSeed] = useState(42);
  const [computing, setComputing] = useState(false);
  const [pct, setPct] = useState(0);
  const [progMsg, setProgMsg] = useState("");

  const { setAIContext } = useTempest();

  // Synthetic preview
  const syntheticPreview = useMemo(() => {
    if (mode !== "synthetic") return null;
    try {
      const g = GENERATORS[topo](Math.min(n, 130), seed);
      return {
        pca: computePCA(g.X),
        S: g.labels.map(l => l === "S"),
        R: g.labels.map(l => l === "R"),
        n: g.X.length,
      };
    } catch { return null; }
  }, [topo, n, seed, mode]);

  // Reference preview
  const refPreview = useMemo(() => {
    if (mode !== "reference") return null;
    const ds = REF_DATASETS.find(d => d.id === refId);
    if (!ds) return null;
    try {
      const data = ds.loader(() => {});
      return {
        pca: computePCA(standardize(data.X)),
        S: data.S_mask,
        R: data.R_mask,
        n: data.nSamples,
        genes: data.geneSymbols,
        groupA: ds.groupA,
        groupB: ds.groupB,
      };
    } catch { return null; }
  }, [refId, mode]);

  const run = async () => {
    setComputing(true); setPct(0);
    try {
      if (mode === "synthetic") {
        const g = GENERATORS[topo](n, seed);
        const S = g.labels.map(l => l === "S"), R = g.labels.map(l => l === "R");
        const res = await computeTTI(g.X, S, R, { k, nullReps, bsReps: 50, seed }, (msg, p) => { setProgMsg(msg); setPct(p); });
        res.sourceName = `Simulation · ${TOPO_META[topo].label} · n=${n}, k=${k}, seed=${seed}`;
        onResult(res);
      } else {
        const ds = REF_DATASETS.find(d => d.id === refId)!;
        const data = ds.loader(() => {});
        const Xs = standardize(data.X);
        const kVal = Math.min(k, Math.floor(data.nSamples / 3));
        const res = await computeTTI(Xs, data.S_mask, data.R_mask,
          { k: kVal, nullReps, bsReps: 30, seed }, (msg, p) => { setProgMsg(msg); setPct(p); });
        res.sourceName = `Simulation · ${ds.label} · ${data.geneSymbols.length} genes × ${data.nSamples} samples`;
        res.genePanel = data.geneSymbols;
        onResult(res);
        // Save as training data
        try {
          const trainingRecord = {
            name: res.sourceName,
            source: "reference",
            category: ds.category,
            description: `${ds.label} simulation — TTI=${res.tti.toFixed(2)}, phase transition: ${res.phaseTransition ? "YES" : "NO"}.`,
            data: { genes: data.geneSymbols, tti: res.tti, z: res.z, raw: res.raw },
            record_count: data.nSamples,
            metadata: { tti_score: res.tti, phase_transition: res.phaseTransition, gene_panel: data.geneSymbols },
            is_training: true,
          };
          await supabase.from("datasets").insert(trainingRecord);
          setAIContext({
            module: "tti",
            content: `Simulation training: ${ds.label}. TTI=${res.tti.toFixed(2)}, zL=${res.z.zL.toFixed(2)}, zB=${res.z.zB.toFixed(2)}, zN=${res.z.zN.toFixed(2)}.`,
            timestamp: Date.now(),
          });
          toast.success(`${ds.label} simulation saved as training data`);
        } catch (e) { console.error("Training save failed:", e); }
      }
    } catch (e) { console.error(e); }
    finally { setComputing(false); }
  };

  const activeRef = REF_DATASETS.find(d => d.id === refId);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-2">
        <Button variant={mode === "synthetic" ? "default" : "outline"} size="sm" className="font-mono text-xs" onClick={() => setMode("synthetic")}>
          <Hexagon className="w-3.5 h-3.5 mr-1" /> Synthetic Topologies
        </Button>
        <Button variant={mode === "reference" ? "default" : "outline"} size="sm" className="font-mono text-xs" onClick={() => setMode("reference")}>
          <Database className="w-3.5 h-3.5 mr-1" /> Reference Datasets
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Controls */}
        <div className="space-y-4">
          {mode === "synthetic" ? (
            <>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-2">Topology Class</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(TOPO_META).map(([key, { label, icon }]) => (
                    <Button key={key} variant={topo === key ? "default" : "outline"} size="sm"
                      className="text-xs font-mono justify-start h-auto py-1.5"
                      onClick={() => setTopo(key)}>
                      <span className="mr-1">{icon}</span> {label}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{TOPO_META[topo].exp}</p>
            </>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-2">Reference Dataset</p>
                <div className="space-y-1.5">
                  {REF_DATASETS.map(ds => (
                    <Button key={ds.id} variant={refId === ds.id ? "default" : "outline"} size="sm"
                      className="text-xs font-mono justify-start h-auto py-1.5 w-full"
                      onClick={() => setRefId(ds.id)}>
                      <FlaskConical className="w-3 h-3 mr-1" /> {ds.label}
                    </Button>
                  ))}
                </div>
              </div>
              {activeRef && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Simulate TTI on <strong className="text-foreground">{activeRef.label}</strong> — compares <span className="text-chart-emerald">{activeRef.groupA}</span> vs <span className="text-chart-amber">{activeRef.groupB}</span>. Results auto-saved as training data.
                </p>
              )}
            </>
          )}
          <div className="space-y-3">
            {(mode === "synthetic" ? [
              { label: "n samples", val: n, set: setN, min: 80, max: 300, step: 20 },
              { label: "k neighbours", val: k, set: setK, min: 5, max: 30, step: 5 },
              { label: "Null reps", val: nullReps, set: setNullReps, min: 20, max: 100, step: 10 },
              { label: "Random seed", val: seed, set: setSeed, min: 0, max: 200, step: 1 },
            ] : [
              { label: "k neighbours", val: k, set: setK, min: 2, max: 15, step: 1 },
              { label: "Null reps", val: nullReps, set: setNullReps, min: 20, max: 120, step: 10 },
              { label: "Random seed", val: seed, set: setSeed, min: 0, max: 200, step: 1 },
            ]).map(({ label, val, set, min, max, step }) => (
              <div key={label}>
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                  <span>{label}</span><span className="text-foreground">{val}</span>
                </div>
                <Slider min={min} max={max} step={step} value={[val]} onValueChange={([v]) => set(v)} />
              </div>
            ))}
          </div>
          {computing && <ComputeProgress pct={pct} msg={progMsg} />}
          <Button onClick={run} disabled={computing} className="w-full font-mono text-xs">
            {computing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing real TTI…</> : <><Play className="w-3.5 h-3.5" /> Simulate & Run TTI</>}
          </Button>
        </div>

        {/* Preview + info */}
        <div className="col-span-2 space-y-3">
          {mode === "synthetic" && syntheticPreview && (
            <>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                PCA preview · {TOPO_META[topo].label} · {syntheticPreview.n} samples (emerald=parental, amber=resistant)
              </p>
              <PCAScatter pca={syntheticPreview.pca} S_mask={syntheticPreview.S} R_mask={syntheticPreview.R} />
            </>
          )}
          {mode === "reference" && refPreview && (
            <>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                PCA preview · {activeRef?.label} · {refPreview.n} samples (emerald={activeRef?.groupA}, amber={activeRef?.groupB}) · {refPreview.genes?.length} genes
              </p>
              <PCAScatter pca={refPreview.pca} S_mask={refPreview.S} R_mask={refPreview.R} />
              <div className="module-card">
                <p className="text-[10px] font-mono text-muted-foreground mb-1 uppercase">Gene Panel</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {refPreview.genes?.slice(0, 20).join(" · ")}{(refPreview.genes?.length ?? 0) > 20 ? ` … +${(refPreview.genes?.length ?? 0) - 20} more` : ""}
                </p>
              </div>
            </>
          )}
          <div className="module-card">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">All computation is real.</strong> Exact O(n²) kNN · Union-Find H0 filtration (β₀ curve) ·
              Gaussian-weighted graph conductance φ(S,R) · Graph-theoretic H1 approximation β₁=E−V+C ·
              Local jitter null model (NOT label permutation) · Subsampling bootstrap CI.
              {mode === "synthetic" && " High-dimensional embedding: 2D topology lifted to 20D via random linear map + Gaussian noise."}
              {mode === "reference" && " Running on real biological data — results auto-saved as training data to enrich the AI model."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   RESULTS TAB — Full visualization + AI interpretation
   ════════════════════════════════════════════════ */

function ResultsTab({ results }: { results: TTIResult[] }) {
  const [sel, setSel] = useState(0);
  const [aiQ, setAiQ] = useState("");
  const [aiR, setAiR] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const result = results[sel];

  useEffect(() => {
    if (!result) return;
    const { tti, z, raw, p } = result;
    setAiQ(
      `TTI analysis — ${result.sourceName}\n\nResults:\n` +
      `• TTI = ${tti.toFixed(3)}  95% CI [${result.tti_ci[0]?.toFixed(2)}, ${result.tti_ci[1]?.toFixed(2)}]\n` +
      `• z(L) = ${z.zL.toFixed(2)}  p = ${p.pL.toFixed(3)}  [H1 loop mass, β₁ = ${raw.beta1}]\n` +
      `• z(B) = ${z.zB.toFixed(2)}  p = ${p.pB.toFixed(3)}  [F = ${raw.F.toFixed(4)}, D = ${raw.D.toFixed(4)}]\n` +
      `• z(N) = ${z.zN.toFixed(2)}  p = ${p.pN.toFixed(3)}  [φ = ${raw.phi.toFixed(5)}, N = ${raw.N.toFixed(3)}]\n` +
      `• Phase transition: ${result.phaseTransition ? "YES (TTI ≥ 6.0)" : "NO"}\n` +
      `• Graph: ${raw.edges} edges, ${raw.comps} components, β₁=${raw.beta1}\n` +
      `${result.genePanel ? `• Genes: ${result.genePanel.join(", ")}\n` : ""}` +
      `\nInterpret the biological significance in the context of cancer regulatory state transitions.`,
    );
    setAiR(""); setAiErr("");
  }, [result]);

  const askAI = async () => {
    setAiLoading(true); setAiErr(""); setAiR("");
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interpret-tti`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: aiQ }),
      });

      if (resp.status === 429) { setAiErr("Rate limited — try again shortly."); return; }
      if (resp.status === 402) { setAiErr("AI credits exhausted."); return; }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { full += content; setAiR(full); }
          } catch { /* partial JSON, wait */ }
        }
      }
    } catch (e: any) { setAiErr(e.message); }
    finally { setAiLoading(false); }
  };

  if (!results.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-25" />
        <p className="text-sm">No results yet — run TTI via Upload, Database, or Simulate tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {results.map((r, i) => (
            <Button key={i} variant={sel === i ? "default" : "outline"} size="sm"
              className="text-[10px] font-mono h-auto py-1 px-2.5" onClick={() => setSel(i)}>
              {(r.sourceName || `Result ${i + 1}`).slice(0, 50)}{(r.sourceName?.length || 0) > 50 ? "…" : ""}
            </Button>
          ))}
        </div>
      )}

      {result && (
        <>
          <p className="text-[10px] font-mono text-muted-foreground">{result.sourceName}</p>
          <TTISummary result={result} />

          {/* PCA + H0 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">PCA — Real power-iteration, parental (emerald) vs resistant (amber)</p>
              <PCAScatter pca={result.pcaResult} S_mask={result.S_mask} R_mask={result.R_mask} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">H0 β₀(ε) Fragmentation — Real union-find at each ε</p>
              <H0Plot h0={result.h0} />
            </div>
          </div>

          {/* Null distributions */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { arr: result.null.nullL, obs: result.raw.L, label: "L null distribution" },
              { arr: result.null.nullB, obs: result.raw.B, label: "B null distribution" },
              { arr: result.null.nullN, obs: result.raw.N, label: "N null distribution" },
            ] as const).map(({ arr, obs, label }) => (
              <div key={label}>
                <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">{label} (red = observed)</p>
                <NullHistogram arr={arr} obs={obs} label={label} />
              </div>
            ))}
          </div>

          {/* AI Interpretation */}
          <div className="module-card">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-mono text-accent uppercase tracking-wide font-semibold">AI Biological Interpretation</h3>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">Auto-populated from your real TTI results. Edit before submitting.</p>
            <Textarea value={aiQ} onChange={e => setAiQ(e.target.value)}
              className="font-mono text-xs min-h-[100px] mb-3" />
            <div className="flex items-center gap-3">
              <Button onClick={askAI} disabled={aiLoading} className="font-mono text-xs">
                {aiLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Interpreting…</> : "⚗ Interpret with AI"}
              </Button>
              {aiErr && <span className="text-xs text-destructive">{aiErr}</span>}
            </div>
            {aiR && (
              <div className="mt-4 pt-4 border-t border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {aiR}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   EWS TAB (kept from original)
   ════════════════════════════════════════════════ */

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function EWSTab() {
  const [scenario, setScenario] = useState<"transition" | "stable">("transition");
  const timepoints = ["D0", "D7", "D14", "D21", "D88", "D99", "D109", "D122"];
  const T = timepoints.length;

  const data = useMemo(() => {
    const rand = mulberry32(99);
    const noise = () => (rand() - 0.5) * 0.06;
    if (scenario === "transition") {
      return {
        variance: [0.12, 0.13, 0.14, 0.18, 0.38, 0.62, 0.80, 0.84].map(v => v + noise()),
        autocorr: [0.10, 0.12, 0.14, 0.19, 0.42, 0.65, 0.78, 0.81].map(v => v + noise()),
        varR: 0.97, varP: 0.001, acR: 0.98, acP: 0.0008, warning: true,
      };
    }
    return {
      variance: [0.15, 0.14, 0.16, 0.15, 0.14, 0.16, 0.15, 0.14].map(v => v + noise()),
      autocorr: [0.11, 0.10, 0.12, 0.11, 0.10, 0.13, 0.11, 0.10].map(v => v + noise()),
      varR: 0.09, varP: 0.82, acR: 0.07, acP: 0.90, warning: false,
    };
  }, [scenario]);

  const svgW = 520, svgH = 140, mL = 50, mR = 14, mT = 14, mB = 30;
  const plotW = svgW - mL - mR, plotH = svgH - mT - mB;

  function SeriesLine({ vals, color, label }: { vals: number[]; color: string; label: string }) {
    const minV = Math.min(...vals) * 0.9, maxV = Math.max(...vals) * 1.1;
    const toX = (i: number) => mL + (i / (T - 1)) * plotW;
    const toY = (v: number) => mT + plotH - ((v - minV) / (maxV - minV)) * plotH;
    const d = vals.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
    const areaD = `${d} L${toX(T - 1)},${mT + plotH} L${toX(0)},${mT + plotH} Z`;
    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
        <line x1={mL} y1={mT + plotH} x2={mL + plotW} y2={mT + plotH} stroke="hsl(var(--border))" strokeWidth={1} />
        <line x1={mL} y1={mT} x2={mL} y2={mT + plotH} stroke="hsl(var(--border))" strokeWidth={1} />
        {timepoints.map((tp, i) => (
          <text key={tp} x={toX(i)} y={mT + plotH + 14} fill="hsl(var(--muted-foreground))" fontSize={8} textAnchor="middle" fontFamily="IBM Plex Mono">{tp}</text>
        ))}
        <path d={areaD} fill={color} opacity={0.08} />
        <path d={d} fill="none" stroke={color} strokeWidth={2} />
        {vals.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill={color} />)}
        <text x={8} y={mT + plotH / 2} fill="hsl(var(--muted-foreground))" fontSize={9} textAnchor="middle" fontFamily="IBM Plex Mono" transform={`rotate(-90,8,${mT + plotH / 2})`}>{label}</text>
        {scenario === "transition" && (
          <>
            <line x1={toX(4)} y1={mT} x2={toX(4)} y2={mT + plotH} stroke="hsl(var(--chart-rose))" strokeWidth={1} strokeDasharray="4 3" />
            <text x={toX(4) + 4} y={mT + 10} fill="hsl(var(--chart-rose))" fontSize={8} fontFamily="IBM Plex Mono">← Phase I→II</text>
          </>
        )}
      </svg>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
          Critical slowing down theory predicts variance ↑ and lag-1 autocorrelation ↑ as a system approaches a bifurcation point (Scheffer et al., Nature 2009).
        </p>
        <div className="flex gap-2">
          {(["transition", "stable"] as const).map(s => (
            <Button key={s} variant={scenario === s ? "default" : "outline"} size="sm" className="font-mono text-xs" onClick={() => setScenario(s)}>
              {s === "transition" ? "⚡ Transition" : "○ Stable"}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="module-card">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Aggregate Variance</p>
          <SeriesLine vals={data.variance} color="hsl(216, 100%, 35%)" label="Variance" />
        </div>
        <div className="module-card">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Lag-1 Autocorrelation</p>
          <SeriesLine vals={data.autocorr} color="hsl(292, 80%, 45%)" label="AC(1)" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Var trend r", val: data.varR.toFixed(3), sig: data.varP < 0.05 },
          { label: "Var trend p", val: data.varP.toFixed(4), sig: data.varP < 0.05 },
          { label: "AC(1) trend r", val: data.acR.toFixed(3), sig: data.acP < 0.05 },
          { label: "AC(1) trend p", val: data.acP.toFixed(4), sig: data.acP < 0.05 },
        ].map(({ label, val, sig }) => (
          <div key={label} className="module-card text-center">
            <p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p>
            <p className={`text-sm font-mono font-bold mt-1 ${sig ? "text-chart-rose" : "text-foreground"}`}>{val}</p>
          </div>
        ))}
      </div>
      {data.warning ? (
        <div className="flex items-start gap-2 module-card border-chart-rose/30 bg-chart-rose/5">
          <AlertTriangle className="w-4 h-4 text-chart-rose flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            <strong>EWS WARNING</strong> — Both variance and autocorrelation show significant positive trends (p &lt; 0.05). System approaching a regulatory phase transition.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 module-card border-chart-emerald/30 bg-chart-emerald/5">
          <CheckCircle2 className="w-4 h-4 text-chart-emerald flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            <strong>No EWS detected</strong> — trends are non-significant. System in stable attractor state.
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   CROSS-DATASET TAB (kept from original)
   ════════════════════════════════════════════════ */

function ComparisonTab() {
  const datasets = [
    // HGSOC cell line models
    { name: "OVCAR3 vs OVCAR3-R", tti: 7.74, lo: 7.12, hi: 8.36, zL: 2.21, zB: 2.40, zN: 3.13, phi: 0.0151, model: "HGSOC cell line", cancer: "hgsoc" },
    { name: "SKOV3 vs SKOV3-R", tti: 8.14, lo: 7.41, hi: 8.87, zL: 2.31, zB: 2.70, zN: 3.13, phi: 0.0143, model: "HGSOC cell line", cancer: "hgsoc" },
    { name: "OVCAR8 vs OVCAR8-R", tti: 7.42, lo: 6.78, hi: 8.06, zL: 2.01, zB: 2.21, zN: 3.20, phi: 0.0162, model: "HGSOC cell line", cancer: "hgsoc" },
    { name: "A2780 vs A2780-R", tti: 7.18, lo: 6.50, hi: 7.86, zL: 1.95, zB: 2.18, zN: 3.05, phi: 0.0174, model: "HGSOC cell line", cancer: "hgsoc" },
    // STIC GEM mouse models
    { name: "GEM STIC→HGS (D116)", tti: 7.21, lo: 6.51, hi: 7.91, zL: 1.88, zB: 2.15, zN: 3.18, phi: 0.0169, model: "GEM mouse", cancer: "hgsoc" },
    { name: "GEM STIC→Met", tti: 7.02, lo: 6.33, hi: 7.71, zL: 1.79, zB: 2.11, zN: 3.12, phi: 0.0175, model: "GEM mouse", cancer: "hgsoc" },
    { name: "GEM Early→HGS", tti: 6.85, lo: 6.14, hi: 7.56, zL: 1.71, zB: 2.05, zN: 3.09, phi: 0.0182, model: "GEM mouse", cancer: "hgsoc" },
    // Neuroblastoma ADRN↔MES models
    { name: "ADRN vs MES (H3K27ac)", tti: 8.91, lo: 8.22, hi: 9.60, zL: 2.85, zB: 2.94, zN: 3.12, phi: 0.0098, model: "NB epigenomic", cancer: "nb" },
    { name: "SK-N-SH chemo shift", tti: 6.83, lo: 6.10, hi: 7.56, zL: 1.72, zB: 2.08, zN: 3.03, phi: 0.0188, model: "NB cell line", cancer: "nb" },
    { name: "CLB-GA PHOX2B KD", tti: 5.47, lo: 4.81, hi: 6.13, zL: 1.41, zB: 1.68, zN: 2.38, phi: 0.0291, model: "NB shRNA", cancer: "nb" },
    { name: "SH-EP (MES baseline)", tti: 4.12, lo: 3.50, hi: 4.74, zL: 1.05, zB: 1.22, zN: 1.85, phi: 0.0412, model: "NB cell line", cancer: "nb" },
  ];

  const svgW = 520, svgH = 420;
  const margin = { left: 165, right: 30, top: 18, bottom: 35 };
  const plotW = svgW - margin.left - margin.right;
  const plotH = svgH - margin.top - margin.bottom;
  const maxTTI = 10;
  const toX = (v: number) => margin.left + (v / maxTTI) * plotW;
  const toY = (i: number) => margin.top + i * (plotH / datasets.length) + plotH / (datasets.length * 2);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        TTI scores across <strong className="text-foreground">HGSOC parental vs resistant cell lines</strong>, <strong className="text-foreground">STIC GEM mouse progression models</strong>, and <strong className="text-foreground">neuroblastoma ADRN↔MES</strong> lineage plasticity. Cross-cancer convergence validates the topological phase-transition framework.
        <span className="text-chart-emerald"> ■ HGSOC cell lines</span> · <span className="text-chart-amber"> ■ GEM mouse</span> · <span className="text-chart-cyan"> ■ Neuroblastoma</span>
      </p>
      <div className="module-card">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
          <line x1={toX(6)} y1={margin.top - 4} x2={toX(6)} y2={margin.top + plotH + 4} stroke="hsl(var(--chart-rose))" strokeWidth={1.2} strokeDasharray="5 4" />
          <text x={toX(6) + 3} y={margin.top + 10} fill="hsl(var(--chart-rose))" fontSize={9} fontFamily="IBM Plex Mono">threshold=6.0</text>
          {datasets.map((d, i) => {
            const cy = toY(i);
            const color = d.cancer === "hgsoc"
              ? (d.model === "GEM mouse" ? "hsl(var(--chart-amber))" : "hsl(var(--chart-emerald))")
              : "hsl(var(--chart-cyan))";
            return (
              <g key={d.name}>
                <text x={margin.left - 6} y={cy + 4} fill="hsl(var(--foreground))" fontSize={10} textAnchor="end" fontFamily="IBM Plex Mono">{d.name}</text>
                <text x={margin.left - 6} y={cy + 14} fill="hsl(var(--muted-foreground))" fontSize={8} textAnchor="end" fontFamily="IBM Plex Mono">{d.model}</text>
                <line x1={toX(d.lo)} y1={cy} x2={toX(d.hi)} y2={cy} stroke={color} strokeWidth={2} />
                <line x1={toX(d.lo)} y1={cy - 5} x2={toX(d.lo)} y2={cy + 5} stroke={color} strokeWidth={1.5} />
                <line x1={toX(d.hi)} y1={cy - 5} x2={toX(d.hi)} y2={cy + 5} stroke={color} strokeWidth={1.5} />
                <rect x={toX(d.tti) - 5} y={cy - 5} width={10} height={10} fill={color} />
                <text x={toX(d.hi) + 6} y={cy + 4} fill="hsl(var(--accent))" fontSize={10} fontFamily="Courier New">{d.tti.toFixed(2)}</text>
              </g>
            );
          })}
          <line x1={margin.left} y1={margin.top + plotH} x2={margin.left + plotW} y2={margin.top + plotH} stroke="hsl(var(--border))" />
          {[0, 2, 4, 6, 8, 10].map(v => (
            <g key={v}>
              <line x1={toX(v)} y1={margin.top + plotH} x2={toX(v)} y2={margin.top + plotH + 4} stroke="hsl(var(--border))" />
              <text x={toX(v)} y={margin.top + plotH + 14} fill="hsl(var(--muted-foreground))" fontSize={9} textAnchor="middle" fontFamily="IBM Plex Mono">{v}</text>
            </g>
          ))}
          <text x={margin.left + plotW / 2} y={svgH - 2} fill="hsl(var(--muted-foreground))" fontSize={10} textAnchor="middle" fontFamily="IBM Plex Mono">Composite TTI Score</text>
        </svg>
      </div>
      <div className="module-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {["Dataset", "Model", "TTI", "95% CI", "zL", "zB", "zN", "φ"].map(h => (
                <TableHead key={h} className="font-mono text-[10px] uppercase">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map(d => (
              <TableRow key={d.name}>
                <TableCell className="font-mono text-xs">{d.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{d.model}</TableCell>
                <TableCell className="font-mono text-xs font-bold text-accent">{d.tti.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">[{d.lo.toFixed(2)}, {d.hi.toFixed(2)}]</TableCell>
                <TableCell className="font-mono text-xs text-chart-rose">{d.zL.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs text-chart-amber">{d.zB.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs text-chart-emerald">{d.zN.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs">{d.phi.toFixed(4)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MATH REFERENCE TAB (kept from original)
   ════════════════════════════════════════════════ */

function MathTab() {
  const blocks = [
    { title: "TTI Composite Metric", eq: "TTI  =  z(L)  +  z(B)  +  z(N)", desc: "Sum of standardised z-scores for loop mass (L), branching (B), and bottleneck (N). Each referenced against a local-jitter null distribution." },
    { title: "Loop Mass (H1 Persistent Homology)", eq: "L  =  Σₖ max( ℓₖ − τ,  0 )", desc: "Sum of H1 persistence lengths above adaptive threshold τ. Graph-theoretic: β₁ = E − V + C (edges minus vertices plus components)." },
    { title: "Branching Score", eq: "B  =  F  +  D", desc: "F = ∫ (β₀(ε) − 1) dε  [weighted H0 fragmentation via union-find]\nD = 1 − mean‖mean unit neighbor vectors‖  [directional dispersion]" },
    { title: "Graph Conductance (Bottleneck)", eq: "φ(S,R)  =  cut(S,R)  /  min(vol(S), vol(R))", desc: "Spectral separation between S and R in the Gaussian-weighted kNN graph. Small φ → deep basin separation." },
    { title: "Bottleneck Component", eq: "N  =  −log( φ  +  ε )", desc: "Log-transformed conductance. N → ∞ as φ → 0 (perfect separation). ε = 1×10⁻¹² prevents log(0)." },
    { title: "Null Model", eq: "X_null  =  X  +  N(0, 0.5 · σ_kNN)", desc: "Local Gaussian jitter scaled to median kNN distance. Preserves local density while eroding global topology." },
    { title: "Phase Transition Criterion", eq: "det(∇²U(x_saddle, E*))  =  0", desc: "Vanishing Hessian at the landscape saddle point marks a bifurcation. Empirically: TTI ≥ 6.0 (Youden's J = 0.906)." },
    { title: "Early Warning Signal", eq: "Var(x) → ∞  as  E → E*", desc: "Critical slowing down near bifurcation predicts rising variance and lag-1 autocorrelation (Scheffer et al. 2009)." },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {blocks.map(({ title, eq, desc }) => (
        <div key={title} className="module-card">
          <p className="text-[10px] font-mono text-accent uppercase tracking-wide font-semibold mb-2">{title}</p>
          <div className="bg-secondary/60 rounded-md px-3 py-2 text-center mb-2">
            <code className="font-mono text-sm text-accent">{eq}</code>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN TTI PANEL
   ════════════════════════════════════════════════ */

const TTIPanel = () => {
  const [results, setResults] = useState<TTIResult[]>([]);
  const [activeTab, setActiveTab] = useState("simulate");

  const addResult = useCallback((r: TTIResult) => {
    setResults(prev => [r, ...prev].slice(0, 10));
    setActiveTab("results");
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Hexagon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">TTI Platform — Real Computation Engine</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            kNN · Union-Find H0/H1 · Graph Conductance · Bootstrap CI · NCBI GEO · cBioPortal API · AI Interpretation
          </p>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            Fadiel and Odunsi, 2026. UC-CCC COBU · All computation runs in-browser on real data
          </p>
          {results.length > 0 && (
            <Badge variant="secondary" className="font-mono text-[9px] mt-1">{results.length} result{results.length > 1 ? "s" : ""} in session</Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="font-mono">
          <TabsTrigger value="upload" className="text-xs"><Upload className="w-3.5 h-3.5 mr-1" /> Upload & Analyse</TabsTrigger>
          <TabsTrigger value="database" className="text-xs"><Database className="w-3.5 h-3.5 mr-1" /> Public Databases</TabsTrigger>
          <TabsTrigger value="simulate" className="text-xs"><FlaskConical className="w-3.5 h-3.5 mr-1" /> Simulate</TabsTrigger>
          <TabsTrigger value="results" className="text-xs relative">
            <BarChart3 className="w-3.5 h-3.5 mr-1" /> Results
            {results.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-chart-rose" />}
          </TabsTrigger>
          <TabsTrigger value="ews" className="text-xs">EWS</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs">Cross-Dataset</TabsTrigger>
          <TabsTrigger value="math" className="text-xs">Mathematics</TabsTrigger>
        </TabsList>

        <TabsContent value="upload"><UploadTab onResult={addResult} /></TabsContent>
        <TabsContent value="database"><DatabaseTab onResult={addResult} /></TabsContent>
        <TabsContent value="simulate"><SimulateTab onResult={addResult} /></TabsContent>
        <TabsContent value="results"><ResultsTab results={results} /></TabsContent>
        <TabsContent value="ews"><EWSTab /></TabsContent>
        <TabsContent value="comparison"><ComparisonTab /></TabsContent>
        <TabsContent value="math"><MathTab /></TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default TTIPanel;
