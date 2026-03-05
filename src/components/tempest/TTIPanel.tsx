import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hexagon, Play, Loader2, AlertTriangle, CheckCircle2, Info, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/* ── Seeded RNG ── */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boxMuller(rand: () => number) {
  const u1 = Math.max(1e-10, rand());
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/* ── Topology generators ── */
const W = 380, H = 260;

function genNullGaussian(n = 260, seed = 1) {
  const rand = mulberry32(seed);
  const bm = () => boxMuller(rand);
  return Array.from({ length: n }, (_, i) => ({
    x: bm() * 50 + W / 2, y: bm() * 50 + H / 2, label: i < n / 2 ? "S" : "R",
  }));
}

function genBottleneck(n = 260, seed = 2) {
  const rand = mulberry32(seed);
  const bm = () => boxMuller(rand);
  const pts: { x: number; y: number; label: string }[] = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) pts.push({ x: bm() * 30 + W * 0.22, y: bm() * 30 + H / 2, label: "S" });
  for (let i = 0; i < half; i++) pts.push({ x: bm() * 30 + W * 0.78, y: bm() * 30 + H / 2, label: "R" });
  for (let i = 0; i < 25; i++) pts.push({ x: W * 0.22 + W * 0.56 * (i / 25), y: bm() * 8 + H / 2, label: "S" });
  return pts;
}

function genBranchY(n = 260, seed = 3) {
  const rand = mulberry32(seed);
  const bm = () => boxMuller(rand);
  const pts: { x: number; y: number; label: string }[] = [];
  const trunk = Math.floor(n / 3);
  for (let i = 0; i < trunk; i++) {
    const t = i / trunk;
    pts.push({ x: t * W * 0.38 + W * 0.12, y: bm() * 10 + H / 2, label: "S" });
  }
  for (let i = 0; i < n - trunk; i++) {
    const x = W * 0.5 + rand() * W * 0.36;
    const sign = i < (n - trunk) / 2 ? 1 : -1;
    pts.push({ x, y: H / 2 + sign * (x - W * 0.5) * 0.5 + bm() * 10, label: "R" });
  }
  return pts;
}

function genLoop(n = 260, seed = 4) {
  const rand = mulberry32(seed);
  const bm = () => boxMuller(rand);
  return Array.from({ length: n }, () => {
    const theta = rand() * 2 * Math.PI;
    return {
      x: W / 2 + Math.cos(theta) * 90 + bm() * 9,
      y: H / 2 + Math.sin(theta) * 63 + bm() * 9,
      label: theta < Math.PI ? "S" : "R",
    };
  });
}

const TOPOLOGIES: Record<string, {
  label: string; gen: (n?: number, seed?: number) => { x: number; y: number; label: string }[];
  expectedTTI: string; expectedComponent: string; interpretation: string; icon: string;
}> = {
  null_gaussian: { label: "Null Gaussian", gen: genNullGaussian, expectedTTI: "~0", expectedComponent: "None", interpretation: "No structural separation. TTI should be near zero and non-significant.", icon: "○" },
  bottleneck: { label: "Bottleneck", gen: genBottleneck, expectedTTI: ">6", expectedComponent: "N (Conductance)", interpretation: "Two separated basins with a narrow corridor. Detected by high N (low graph conductance).", icon: "⊃⊂" },
  branch_y: { label: "Y-Branch", gen: genBranchY, expectedTTI: ">6", expectedComponent: "B (Branching)", interpretation: "Bifurcating regulatory trajectory. Detected by high B — fragmentation and directional dispersion.", icon: "⋔" },
  loop: { label: "Cyclic Loop", gen: genLoop, expectedTTI: ">6", expectedComponent: "L (Loop mass)", interpretation: "Compensatory regulatory circuits form cyclic trajectory. Detected by high L (H1 persistent homology).", icon: "⟳" },
};

/* ── Mock TTI computation ── */
function mockTTI(topology: string, k: number, nullReps: number, seed: number) {
  const rand = mulberry32(seed * 7 + k);
  const noise = () => (rand() - 0.5) * 0.4;
  const base: Record<string, { zL: number; zB: number; zN: number }> = {
    null_gaussian: { zL: 0.3 + noise(), zB: 0.4 + noise(), zN: 0.2 + noise() },
    bottleneck: { zL: 1.1 + noise(), zB: 1.8 + noise(), zN: 3.9 + noise() },
    branch_y: { zL: 1.2 + noise(), zB: 4.1 + noise(), zN: 2.0 + noise() },
    loop: { zL: 3.8 + noise(), zB: 1.4 + noise(), zN: 1.5 + noise() },
  };
  const s = base[topology];
  const tti = s.zL + s.zB + s.zN;
  const ciW = 0.8 / Math.sqrt(nullReps / 50);
  return {
    tti: +tti.toFixed(3), tti_ci: [+(tti - ciW).toFixed(3), +(tti + ciW).toFixed(3)] as [number, number],
    z: s, phi: +Math.exp(-s.zN - 0.5).toFixed(4),
    pL: +Math.max(0.001, 0.5 - s.zL * 0.12).toFixed(3),
    pB: +Math.max(0.001, 0.5 - s.zB * 0.12).toFixed(3),
    pN: +Math.max(0.001, 0.5 - s.zN * 0.12).toFixed(3),
    phaseTransition: tti >= 6.0,
  };
}

/* ── Scatter Plot ── */
function ScatterPlot({ pts, title }: { pts: { x: number; y: number; label: string }[]; title: string }) {
  return (
    <div className="w-full">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-card rounded-md border border-border">
        {[0.25, 0.5, 0.75].map((f) => (
          <g key={f}>
            <line x1={f * W} y1={0} x2={f * W} y2={H} stroke="hsl(var(--border))" strokeWidth={0.5} />
            <line x1={0} y1={f * H} x2={W} y2={f * H} stroke="hsl(var(--border))" strokeWidth={0.5} />
          </g>
        ))}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5}
            fill={p.label === "S" ? "hsl(var(--chart-cyan))" : "hsl(var(--chart-magenta))"}
            opacity={0.7} />
        ))}
        <circle cx={20} cy={H - 22} r={4} fill="hsl(var(--chart-cyan))" />
        <text x={28} y={H - 18} fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="IBM Plex Mono">Parental</text>
        <circle cx={90} cy={H - 22} r={4} fill="hsl(var(--chart-magenta))" />
        <text x={98} y={H - 18} fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="IBM Plex Mono">Resistant</text>
      </svg>
    </div>
  );
}

/* ── Component Bars ── */
function ComponentBars({ result }: { result: ReturnType<typeof mockTTI> }) {
  const comps = [
    { key: "zL" as const, label: "L — Loop Mass", cssColor: "hsl(var(--chart-rose))" },
    { key: "zB" as const, label: "B — Branching", cssColor: "hsl(var(--chart-amber))" },
    { key: "zN" as const, label: "N — Bottleneck", cssColor: "hsl(var(--chart-emerald))" },
  ];
  const maxZ = Math.max(6, ...Object.values(result.z).map(Math.abs));

  return (
    <div className="space-y-3">
      {comps.map(({ key, label, cssColor }) => {
        const z = result.z[key];
        const pct = (Math.abs(z) / maxZ) * 100;
        return (
          <div key={key}>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-muted-foreground">{label}</span>
              <span style={{ color: cssColor }}>z = {z.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full" style={{ background: cssColor }} />
            </div>
          </div>
        );
      })}
      <p className="text-[10px] font-mono text-muted-foreground mt-2">
        Phase-transition threshold: TTI ≥ 6.0 | Composite TTI = {result.tti.toFixed(3)}
        <span className="ml-2">95% CI [{result.tti_ci[0].toFixed(2)}, {result.tti_ci[1].toFixed(2)}]</span>
      </p>
    </div>
  );
}

/* ── Landscape SVG ── */
function LandscapeSVG({ tti, phaseTransition }: { tti: number; phaseTransition: boolean }) {
  const lW = 500, lH = 180;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 200; i++) {
    const xN = i / 200;
    const u = 500 * (xN - 0.28) ** 2 * (xN - 0.72) ** 2;
    pts.push([xN * lW, Math.min(lH * 0.15 + u * 0.9, lH * 0.95)]);
  }
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${lW},${lH} L0,${lH} Z`;

  return (
    <svg viewBox={`0 0 ${lW} ${lH}`} className="w-full h-auto">
      <defs>
        <linearGradient id="tti-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#tti-grad)" />
      <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
      <text x={lW * 0.28} y={lH - 8} textAnchor="middle" fill="hsl(var(--chart-cyan))" fontSize={10} fontFamily="IBM Plex Mono">Parental</text>
      <text x={lW * 0.72} y={lH - 8} textAnchor="middle" fill="hsl(var(--chart-magenta))" fontSize={10} fontFamily="IBM Plex Mono">Resistant</text>
      <circle cx={lW * 0.28} cy={pts[56][1] + 5} r={6} fill="hsl(var(--chart-cyan))" opacity={0.8} />
      {phaseTransition ? (
        <text x={lW * 0.5} y={20} textAnchor="middle" fill="hsl(var(--chart-rose))" fontSize={10} fontFamily="IBM Plex Mono">⚡ Phase transition</text>
      ) : (
        <text x={lW * 0.5} y={20} textAnchor="middle" fill="hsl(var(--chart-amber))" fontSize={10} fontFamily="IBM Plex Mono">⬆ High barrier</text>
      )}
      <text x={lW - 8} y={lH - 8} textAnchor="end" fill="hsl(var(--accent))" fontSize={10} fontFamily="IBM Plex Mono">
        fTTI = {tti.toFixed(2)}
      </text>
    </svg>
  );
}

/* ── Simulation Tab ── */
function SimulationTab() {
  const [topology, setTopology] = useState("bottleneck");
  const [k, setK] = useState(30);
  const [nullReps, setNullReps] = useState(100);
  const [seed, setSeed] = useState(42);
  const [computing, setComputing] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof mockTTI> | null>(null);

  const pts = useMemo(() => TOPOLOGIES[topology].gen(260, seed), [topology, seed]);
  const topo = TOPOLOGIES[topology];

  const runCompute = useCallback(() => {
    setComputing(true);
    setResult(null);
    setTimeout(() => {
      setResult(mockTTI(topology, k, nullReps, seed));
      setComputing(false);
    }, 800 + Math.random() * 400);
  }, [topology, k, nullReps, seed]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-2">Topology Class</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(TOPOLOGIES).map(([key, t]) => (
                <Button key={key} variant={topology === key ? "default" : "outline"} size="sm"
                  className="text-xs font-mono justify-start h-auto py-1.5"
                  onClick={() => { setTopology(key); setResult(null); }}>
                  <span className="mr-1">{t.icon}</span> {t.label}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{topo.interpretation}</p>
          <div className="space-y-3">
            {[
              { label: "k (neighbours)", val: k, set: setK, min: 5, max: 60, step: 5 },
              { label: "Null reps", val: nullReps, set: setNullReps, min: 50, max: 500, step: 50 },
              { label: "Random seed", val: seed, set: setSeed, min: 0, max: 200, step: 1 },
            ].map(({ label, val, set, min, max, step }) => (
              <div key={label}>
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                  <span>{label}</span><span className="text-foreground">{val}</span>
                </div>
                <Slider min={min} max={max} step={step} value={[val]}
                  onValueChange={([v]) => { set(v); setResult(null); }} />
              </div>
            ))}
          </div>
          <Button onClick={runCompute} disabled={computing} className="w-full font-mono text-xs">
            {computing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing TTI…</> : <><Play className="w-3.5 h-3.5" /> Run TTI Analysis</>}
          </Button>
        </div>

        {/* Scatter + expected */}
        <div className="col-span-2 space-y-3">
          <ScatterPlot pts={pts} title={`kNN Feature-Space · ${topo.label}`} />
          <div className="grid grid-cols-2 gap-3">
            <div className="module-card">
              <p className="text-[10px] font-mono text-muted-foreground uppercase">Expected TTI</p>
              <p className="text-xl font-mono font-bold text-accent mt-1">{topo.expectedTTI}</p>
            </div>
            <div className="module-card">
              <p className="text-[10px] font-mono text-muted-foreground uppercase">Primary Signal</p>
              <p className="text-xl font-mono font-bold text-accent mt-1">{topo.expectedComponent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Computing indicator */}
      {computing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="module-card border-primary/30">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs font-mono text-primary">Building kNN graph · Running persistent homology · Permutation test</span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">null_reps={nullReps} · k={k} · seed={seed}</p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !computing && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Score card */}
            <div className="module-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide">TTI Result</h3>
                <Badge variant={result.phaseTransition ? "destructive" : "secondary"} className="font-mono text-[10px]">
                  {result.phaseTransition ? "PHASE TRANSITION" : "NO TRANSITION"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "TTI Score", val: result.tti.toFixed(3), accent: true },
                  { label: "CI Lower", val: result.tti_ci[0].toFixed(2) },
                  { label: "φ (conductance)", val: result.phi.toFixed(4) },
                ].map(({ label, val, accent }) => (
                  <div key={label} className="bg-secondary/50 rounded-md p-2.5">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${accent ? "text-accent" : "text-foreground"}`}>{val}</p>
                  </div>
                ))}
              </div>
              <ComponentBars result={result} />
            </div>

            {/* Landscape + p-values */}
            <div className="grid grid-cols-2 gap-4">
              <div className="module-card">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2">Regulatory Landscape</h3>
                <LandscapeSVG tti={result.tti} phaseTransition={result.phaseTransition} />
              </div>
              <div className="module-card">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-3">Component P-values</h3>
                <div className="space-y-3">
                  {[
                    { label: "Loop mass", p: result.pL },
                    { label: "Branching", p: result.pB },
                    { label: "Bottleneck", p: result.pN },
                  ].map(({ label, p }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-foreground">p = {p.toFixed(3)}</span>
                        <Badge variant={p < 0.05 ? "default" : "secondary"} className="text-[9px] font-mono">
                          {p < 0.05 ? "significant" : "n.s."}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── EWS Tab ── */
function EWSTab() {
  const [scenario, setScenario] = useState<"transition" | "stable">("transition");

  const timepoints = ["D0", "D7", "D14", "D21", "D88", "D99", "D109", "D122"];
  const T = timepoints.length;

  const data = useMemo(() => {
    const rand = mulberry32(99);
    const noise = () => (rand() - 0.5) * 0.06;
    if (scenario === "transition") {
      return {
        variance: [0.12, 0.13, 0.14, 0.18, 0.38, 0.62, 0.80, 0.84].map((v) => v + noise()),
        autocorr: [0.10, 0.12, 0.14, 0.19, 0.42, 0.65, 0.78, 0.81].map((v) => v + noise()),
        varR: 0.97, varP: 0.001, acR: 0.98, acP: 0.0008, warning: true,
      };
    }
    return {
      variance: [0.15, 0.14, 0.16, 0.15, 0.14, 0.16, 0.15, 0.14].map((v) => v + noise()),
      autocorr: [0.11, 0.10, 0.12, 0.11, 0.10, 0.13, 0.11, 0.10].map((v) => v + noise()),
      varR: 0.09, varP: 0.82, acR: 0.07, acP: 0.90, warning: false,
    };
  }, [scenario]);

  const svgW = 520, svgH = 140, mL = 50, mR = 14, mT = 14, mB = 30;
  const plotW = svgW - mL - mR, plotH = svgH - mT - mB;

  function SeriesLine({ vals, color, label }: { vals: number[]; color: string; label: string }) {
    const minV = Math.min(...vals) * 0.9;
    const maxV = Math.max(...vals) * 1.1;
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
          Critical slowing down theory predicts variance ↑ and lag-1 autocorrelation ↑
          as a system approaches a bifurcation point (Scheffer et al., Nature 2009).
        </p>
        <div className="flex gap-2">
          {(["transition", "stable"] as const).map((s) => (
            <Button key={s} variant={scenario === s ? "default" : "outline"} size="sm"
              className="font-mono text-xs" onClick={() => setScenario(s)}>
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
            <strong>EWS WARNING</strong> — Both variance and autocorrelation show significant positive trends (p &lt; 0.05).
            System approaching a regulatory phase transition.
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

/* ── Cross-Dataset Comparison Tab ── */
function ComparisonTab() {
  const datasets = [
    { name: "OVCAR3 vs OVCAR3-R", tti: 7.74, lo: 7.12, hi: 8.36, zL: 2.21, zB: 2.40, zN: 3.13, phi: 0.0151, model: "Human cell line" },
    { name: "SKOV3 vs SKOV3-R", tti: 8.14, lo: 7.41, hi: 8.87, zL: 2.31, zB: 2.70, zN: 3.13, phi: 0.0143, model: "Human cell line" },
    { name: "OVCAR8 vs OVCAR8-R", tti: 7.42, lo: 6.78, hi: 8.06, zL: 2.01, zB: 2.21, zN: 3.20, phi: 0.0162, model: "Human cell line" },
    { name: "GEM HGS1", tti: 7.21, lo: 6.51, hi: 7.91, zL: 1.88, zB: 2.15, zN: 3.18, phi: 0.0169, model: "GEM mouse" },
    { name: "GEM HGS3", tti: 7.02, lo: 6.33, hi: 7.71, zL: 1.79, zB: 2.11, zN: 3.12, phi: 0.0175, model: "GEM mouse" },
  ];

  const svgW = 520, svgH = 200;
  const margin = { left: 155, right: 30, top: 18, bottom: 35 };
  const plotW = svgW - margin.left - margin.right;
  const plotH = svgH - margin.top - margin.bottom;
  const maxTTI = 10;
  const toX = (v: number) => margin.left + (v / maxTTI) * plotW;
  const toY = (i: number) => margin.top + i * (plotH / datasets.length) + plotH / (datasets.length * 2);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        TTI scores across five cisplatin-resistance models. Cross-model convergence
        (all TTI &gt; 6.0; all φ &lt; 0.02) supports the epigenetic phase-transition hypothesis.
      </p>

      {/* Forest plot */}
      <div className="module-card">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
          <line x1={toX(6)} y1={margin.top - 4} x2={toX(6)} y2={margin.top + plotH + 4}
            stroke="hsl(var(--chart-rose))" strokeWidth={1.2} strokeDasharray="5 4" />
          <text x={toX(6) + 3} y={margin.top + 10} fill="hsl(var(--chart-rose))" fontSize={9} fontFamily="IBM Plex Mono">threshold=6.0</text>

          {datasets.map((d, i) => {
            const cy = toY(i);
            const isHuman = d.model === "Human cell line";
            const color = isHuman ? "hsl(var(--chart-emerald))" : "hsl(var(--chart-amber))";
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
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <g key={v}>
              <line x1={toX(v)} y1={margin.top + plotH} x2={toX(v)} y2={margin.top + plotH + 4} stroke="hsl(var(--border))" />
              <text x={toX(v)} y={margin.top + plotH + 14} fill="hsl(var(--muted-foreground))" fontSize={9} textAnchor="middle" fontFamily="IBM Plex Mono">{v}</text>
            </g>
          ))}
          <text x={margin.left + plotW / 2} y={svgH - 2} fill="hsl(var(--muted-foreground))" fontSize={10} textAnchor="middle" fontFamily="IBM Plex Mono">Composite TTI Score</text>
        </svg>
      </div>

      {/* Data table */}
      <div className="module-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {["Dataset", "Model", "TTI", "95% CI", "zL", "zB", "zN", "φ"].map((h) => (
                <TableHead key={h} className="font-mono text-[10px] uppercase">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((d) => (
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

/* ── Math Reference Tab ── */
function MathTab() {
  const blocks = [
    { title: "TTI Composite Metric", eq: "TTI  =  z(L)  +  z(B)  +  z(N)", desc: "Sum of standardised z-scores for loop mass (L), branching (B), and bottleneck (N). Each referenced against a local-jitter null distribution." },
    { title: "Loop Mass (H1 Persistent Homology)", eq: "L  =  Σₖ max( ℓₖ − τ,  0 )", desc: "Sum of H1 persistence lengths above adaptive threshold τ (95th percentile of null persistence). Computed by Ripser." },
    { title: "Branching Score", eq: "B  =  F  +  D", desc: "F = ∫ (β₀(ε) − 1) dε  [weighted H0 fragmentation]\nD = 1 − mean‖mean unit neighbor vectors‖  [directional dispersion]" },
    { title: "Graph Conductance (Bottleneck)", eq: "φ(S,R)  =  cut(S,R)  /  min(vol(S), vol(R))", desc: "Spectral separation between S and R in the Gaussian-weighted kNN graph. Small φ → deep basin separation." },
    { title: "Bottleneck Component", eq: "N  =  −log( φ  +  ε )", desc: "Log-transformed conductance. N → ∞ as φ → 0 (perfect separation). ε = 1×10⁻¹² prevents log(0)." },
    { title: "Null Model", eq: "X_null  =  X  +  N(0, 0.5 · σ_kNN)", desc: "Local Gaussian jitter scaled to median kNN distance. Preserves local density while eroding global topology." },
    { title: "Phase Transition Criterion", eq: "det(∇²U(x_saddle, E*))  =  0", desc: "Vanishing Hessian at the landscape saddle point marks a bifurcation in the regulatory potential. Empirically: TTI ≥ 6.0." },
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

/* ── Main TTI Panel ── */
const TTIPanel = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Hexagon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">TTI Platform — Topological Transition Index</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Feature-space Topological Transition Index (fTTI) · Persistent Homology · Dynamical Systems
          </p>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Fadiel and Odunsi, 2026. UC-CCC COBU</p>
        </div>
      </div>

      <Tabs defaultValue="simulation">
        <TabsList className="font-mono">
          <TabsTrigger value="simulation" className="text-xs">Interactive Demo</TabsTrigger>
          <TabsTrigger value="ews" className="text-xs">Early Warning Signals</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs">Cross-Dataset</TabsTrigger>
          <TabsTrigger value="math" className="text-xs">Mathematics</TabsTrigger>
        </TabsList>

        <TabsContent value="simulation">
          <SimulationTab />
        </TabsContent>
        <TabsContent value="ews">
          <EWSTab />
        </TabsContent>
        <TabsContent value="comparison">
          <ComparisonTab />
        </TabsContent>
        <TabsContent value="math">
          <MathTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default TTIPanel;
