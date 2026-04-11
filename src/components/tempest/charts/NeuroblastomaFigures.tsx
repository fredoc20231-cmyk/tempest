import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { downloadChartAsPng } from "../utils/downloadUtils";
import {
  CHIP_VOLCANO, RNA_VOLCANO, CROSS_SCATTER, DRUG_CORRELATION,
  CROSS_PEARSON_R, DRUG_PEARSON_R, CHIP_LABELS, RNA_LABELS,
  CHIP_SIG_COUNTS, RNA_SIG_COUNTS, DELTA_SCORES, PHOX2B_TIMECOURSE,
  type VolcanoPoint, type CrossPoint, type DrugPoint, type DeltaScore,
} from "@/lib/neuroblastomaFigures";

const W = 420, H = 280, MG = { l: 44, r: 16, t: 16, b: 32 };
const pw = W - MG.l - MG.r, ph = H - MG.t - MG.b;

function tx(x: number, xMin: number, xMax: number) { return MG.l + ((x - xMin) / (xMax - xMin + 1e-9)) * pw; }
function ty(y: number, yMin: number, yMax: number) { return H - MG.b - ((y - yMin) / (yMax - yMin + 1e-9)) * ph; }

/* ─── Volcano Plot ─── */
function VolcanoPlot({ data, labels, sigCounts, title, id }: {
  data: VolcanoPoint[]; labels: string[]; sigCounts: { up: number; down: number; total: number }; title: string; id: string;
}) {
  const { xMin, xMax, yMax } = useMemo(() => {
    const xs = data.map(d => d.x), ys = data.map(d => d.y);
    return { xMin: Math.min(...xs), xMax: Math.max(...xs), yMax: Math.max(...ys) };
  }, [data]);
  const labelSet = new Set(labels);

  return (
    <div id={id}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-card rounded-md border border-border">
        {/* Axes */}
        <line x1={MG.l} y1={H - MG.b} x2={W - MG.r} y2={H - MG.b} stroke="hsl(var(--border))" strokeWidth={0.5} />
        <line x1={MG.l} y1={MG.t} x2={MG.l} y2={H - MG.b} stroke="hsl(var(--border))" strokeWidth={0.5} />
        {/* Significance line at -log10(0.05) ≈ 1.3 */}
        <line x1={MG.l} y1={ty(1.3, 0, yMax)} x2={W - MG.r} y2={ty(1.3, 0, yMax)}
          stroke="hsl(var(--muted-foreground))" strokeWidth={0.5} strokeDasharray="4,4" />
        {/* Zero line */}
        <line x1={tx(0, xMin, xMax)} y1={MG.t} x2={tx(0, xMin, xMax)} y2={H - MG.b}
          stroke="hsl(var(--muted-foreground))" strokeWidth={0.3} strokeDasharray="3,6" />
        {/* Points */}
        {data.map((p, i) => (
          <circle key={i} cx={tx(p.x, xMin, xMax)} cy={ty(p.y, 0, yMax)} r={p.s ? 2 : 1.2}
            fill={p.s ? (p.x > 0 ? "hsl(var(--chart-rose))" : "hsl(var(--chart-cyan))") : "hsl(var(--muted-foreground))"}
            opacity={p.s ? 0.7 : 0.2} />
        ))}
        {/* Labels */}
        {data.filter(p => labelSet.has(p.g)).map((p, i) => (
          <text key={i} x={tx(p.x, xMin, xMax) + 4} y={ty(p.y, 0, yMax) - 4}
            fill="hsl(var(--foreground))" fontSize={7} fontFamily="IBM Plex Mono">{p.g}</text>
        ))}
        {/* Axis labels */}
        <text x={W / 2} y={H - 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="IBM Plex Mono">log₂FC</text>
        <text x={10} y={H / 2} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="IBM Plex Mono"
          transform={`rotate(-90,10,${H / 2})`}>−log₁₀(FDR)</text>
        {/* Stats */}
        <text x={W - MG.r - 2} y={MG.t + 10} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={7} fontFamily="IBM Plex Mono">
          {sigCounts.total} sig ({sigCounts.up}↑ {sigCounts.down}↓)
        </text>
      </svg>
      <p className="text-[10px] font-mono text-muted-foreground mt-1 text-center">{title}</p>
    </div>
  );
}

/* ─── Cross-Layer Scatter (Fig 1C) ─── */
function CrossLayerScatter({ id }: { id: string }) {
  const bounds = useMemo(() => {
    const xs = CROSS_SCATTER.map(p => p.cx), ys = CROSS_SCATTER.map(p => p.ry);
    return { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) };
  }, []);

  const colorMap = { both: "hsl(var(--chart-rose))", one: "hsl(var(--chart-cyan))", ns: "hsl(var(--muted-foreground))" };
  const opMap = { both: 0.85, one: 0.5, ns: 0.15 };

  return (
    <div id={id}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-card rounded-md border border-border">
        <line x1={MG.l} y1={H - MG.b} x2={W - MG.r} y2={H - MG.b} stroke="hsl(var(--border))" strokeWidth={0.5} />
        <line x1={MG.l} y1={MG.t} x2={MG.l} y2={H - MG.b} stroke="hsl(var(--border))" strokeWidth={0.5} />
        <line x1={tx(0, bounds.xMin, bounds.xMax)} y1={MG.t} x2={tx(0, bounds.xMin, bounds.xMax)} y2={H - MG.b}
          stroke="hsl(var(--muted-foreground))" strokeWidth={0.3} strokeDasharray="3,6" />
        <line x1={MG.l} y1={ty(0, bounds.yMin, bounds.yMax)} x2={W - MG.r} y2={ty(0, bounds.yMin, bounds.yMax)}
          stroke="hsl(var(--muted-foreground))" strokeWidth={0.3} strokeDasharray="3,6" />
        {CROSS_SCATTER.map((p, i) => (
          <circle key={i} cx={tx(p.cx, bounds.xMin, bounds.xMax)} cy={ty(p.ry, bounds.yMin, bounds.yMax)}
            r={p.cat === "both" ? 3 : p.cat === "one" ? 1.8 : 1}
            fill={colorMap[p.cat]} opacity={opMap[p.cat]} />
        ))}
        <text x={W / 2} y={H - 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="IBM Plex Mono">H3K27ac log₂FC</text>
        <text x={10} y={H / 2} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="IBM Plex Mono"
          transform={`rotate(-90,10,${H / 2})`}>RNA log₂FC</text>
        <rect x={MG.l + 4} y={MG.t + 2} width={120} height={14} rx={2} fill="hsl(var(--card))" opacity={0.9} />
        <text x={MG.l + 8} y={MG.t + 12} fill="hsl(var(--foreground))" fontSize={8} fontFamily="IBM Plex Mono">
          r = {CROSS_PEARSON_R} (n = {CROSS_SCATTER.length})
        </text>
        {/* Legend */}
        <rect x={W - MG.r - 110} y={H - MG.b - 40} width={106} height={36} rx={3} fill="hsl(var(--card))" opacity={0.9} />
        <circle cx={W - MG.r - 100} cy={H - MG.b - 30} r={3} fill="hsl(var(--chart-rose))" />
        <text x={W - MG.r - 94} y={H - MG.b - 27} fill="hsl(var(--foreground))" fontSize={7} fontFamily="IBM Plex Mono">Both sig (n=33)</text>
        <circle cx={W - MG.r - 100} cy={H - MG.b - 18} r={2.5} fill="hsl(var(--chart-cyan))" />
        <text x={W - MG.r - 94} y={H - MG.b - 15} fill="hsl(var(--foreground))" fontSize={7} fontFamily="IBM Plex Mono">One layer sig</text>
      </svg>
      <p className="text-[10px] font-mono text-muted-foreground mt-1 text-center">
        Fig 1C. Gene-level decoupling: H3K27ac vs RNA log₂FC (Pearson r = {CROSS_PEARSON_R})
      </p>
    </div>
  );
}

/* ─── Lineage Δ Scores Bar Chart (Fig 2A) ─── */
function LineageDeltaChart({ id }: { id: string }) {
  const catColors: Record<string, string> = {
    hNCC: "hsl(var(--chart-emerald))",
    MES: "hsl(var(--chart-amber))",
    ADRN: "hsl(var(--chart-cyan))",
    Drug: "hsl(var(--chart-rose))",
    "PHOX2B-KD": "hsl(var(--chart-magenta))",
  };
  const barW = Math.min(10, (pw - 4) / DELTA_SCORES.length);
  const yMin = Math.min(...DELTA_SCORES.map(d => d.delta));
  const yMax = Math.max(...DELTA_SCORES.map(d => d.delta));
  const zeroY = ty(0, yMin, yMax);

  return (
    <div id={id}>
      <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full h-auto bg-card rounded-md border border-border">
        <line x1={MG.l} y1={H - MG.b} x2={W - MG.r} y2={H - MG.b} stroke="hsl(var(--border))" strokeWidth={0.5} />
        <line x1={MG.l} y1={zeroY} x2={W - MG.r} y2={zeroY} stroke="hsl(var(--muted-foreground))" strokeWidth={0.5} strokeDasharray="4,4" />
        {DELTA_SCORES.map((d, i) => {
          const x = MG.l + 2 + i * barW;
          const barTop = d.delta >= 0 ? ty(d.delta, yMin, yMax) : zeroY;
          const barHeight = Math.abs(ty(d.delta, yMin, yMax) - zeroY);
          return (
            <g key={i}>
              <rect x={x} y={barTop} width={barW - 1} height={barHeight}
                fill={catColors[d.category] || "hsl(var(--muted-foreground))"} opacity={0.8} rx={0.5} />
            </g>
          );
        })}
        <text x={10} y={H / 2} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="IBM Plex Mono"
          transform={`rotate(-90,10,${H / 2})`}>Δ Score (ADRN − MES)</text>
        <text x={MG.l} y={MG.t + 8} fill="hsl(var(--muted-foreground))" fontSize={7} fontFamily="IBM Plex Mono">Δ = 0</text>
        {/* Legend */}
        {Object.entries(catColors).map(([cat, color], i) => (
          <g key={cat}>
            <rect x={MG.l + i * 72} y={H + 6} width={8} height={8} rx={1} fill={color} />
            <text x={MG.l + i * 72 + 11} y={H + 13} fill="hsl(var(--foreground))" fontSize={7} fontFamily="IBM Plex Mono">{cat}</text>
          </g>
        ))}
      </svg>
      <p className="text-[10px] font-mono text-muted-foreground mt-1 text-center">
        Fig 2A. RNA-seq lineage Δ scores across {DELTA_SCORES.length} samples (MES→ADRN)
      </p>
    </div>
  );
}

/* ─── PHOX2B Time Course (Fig 5A) ─── */
function PHOX2BTimeCourse({ id }: { id: string }) {
  const sorted = useMemo(() => {
    const order = ['CLB-GA', 'J0', 'J2', 'J5', 'J13'];
    return [...PHOX2B_TIMECOURSE].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
  }, []);
  const yMin = Math.min(...sorted.map(d => d.delta)) - 0.5;
  const yMax = Math.max(...sorted.map(d => d.delta)) + 0.5;

  return (
    <div id={id}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-card rounded-md border border-border">
        <line x1={MG.l} y1={H - MG.b} x2={W - MG.r} y2={H - MG.b} stroke="hsl(var(--border))" strokeWidth={0.5} />
        <line x1={MG.l} y1={MG.t} x2={MG.l} y2={H - MG.b} stroke="hsl(var(--border))" strokeWidth={0.5} />
        {/* Shaded adrenergic region */}
        <rect x={MG.l} y={MG.t} width={pw} height={ty(5, yMin, yMax) - MG.t}
          fill="hsl(var(--chart-cyan))" opacity={0.06} />
        <text x={W - MG.r - 4} y={MG.t + 12} textAnchor="end" fill="hsl(var(--chart-cyan))" fontSize={7} fontFamily="IBM Plex Mono" opacity={0.6}>
          Adrenergic range
        </text>
        {/* Line */}
        {sorted.length > 1 && (
          <polyline fill="none" stroke="hsl(var(--chart-magenta))" strokeWidth={1.5}
            points={sorted.map((d, i) => `${MG.l + (i / (sorted.length - 1)) * pw},${ty(d.delta, yMin, yMax)}`).join(" ")} />
        )}
        {/* Points */}
        {sorted.map((d, i) => {
          const cx = MG.l + (i / (sorted.length - 1)) * pw;
          const cy = ty(d.delta, yMin, yMax);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={4} fill="hsl(var(--chart-magenta))" opacity={0.8} />
              <text x={cx} y={cy - 8} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={7} fontFamily="IBM Plex Mono">
                {d.delta}
              </text>
              <text x={cx} y={H - MG.b + 14} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={7} fontFamily="IBM Plex Mono">
                {d.day}
              </text>
            </g>
          );
        })}
        <text x={10} y={H / 2} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="IBM Plex Mono"
          transform={`rotate(-90,10,${H / 2})`}>Δ Score</text>
      </svg>
      <p className="text-[10px] font-mono text-muted-foreground mt-1 text-center">
        Fig 5A. PHOX2B suppression time course (CLB-GA shPHOX2B), displacement −0.95 units
      </p>
    </div>
  );
}

/* ─── Drug Response Correlation (Fig 4A) ─── */
function DrugCorrelationScatter({ id }: { id: string }) {
  const bounds = useMemo(() => {
    const xs = DRUG_CORRELATION.map(p => p.cx), ys = DRUG_CORRELATION.map(p => p.dy);
    return { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) };
  }, []);

  return (
    <div id={id}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-card rounded-md border border-border">
        <line x1={MG.l} y1={H - MG.b} x2={W - MG.r} y2={H - MG.b} stroke="hsl(var(--border))" strokeWidth={0.5} />
        <line x1={MG.l} y1={MG.t} x2={MG.l} y2={H - MG.b} stroke="hsl(var(--border))" strokeWidth={0.5} />
        {/* Zero lines */}
        <line x1={tx(0, bounds.xMin, bounds.xMax)} y1={MG.t} x2={tx(0, bounds.xMin, bounds.xMax)} y2={H - MG.b}
          stroke="hsl(var(--muted-foreground))" strokeWidth={0.3} strokeDasharray="3,6" />
        <line x1={MG.l} y1={ty(0, bounds.yMin, bounds.yMax)} x2={W - MG.r} y2={ty(0, bounds.yMin, bounds.yMax)}
          stroke="hsl(var(--muted-foreground))" strokeWidth={0.3} strokeDasharray="3,6" />
        {DRUG_CORRELATION.map((p, i) => {
          const inQ = (p.cx > 0 && p.dy > 0) || (p.cx < 0 && p.dy < 0);
          return (
            <circle key={i} cx={tx(p.cx, bounds.xMin, bounds.xMax)} cy={ty(p.dy, bounds.yMin, bounds.yMax)}
              r={1.5} fill={inQ ? "hsl(var(--chart-rose))" : "hsl(var(--chart-cyan))"} opacity={inQ ? 0.5 : 0.3} />
          );
        })}
        <rect x={MG.l + 4} y={MG.t + 2} width={130} height={14} rx={2} fill="hsl(var(--card))" opacity={0.9} />
        <text x={MG.l + 8} y={MG.t + 12} fill="hsl(var(--foreground))" fontSize={8} fontFamily="IBM Plex Mono">
          Pearson r = {DRUG_PEARSON_R} (n = {DRUG_CORRELATION.length})
        </text>
        <text x={W / 2} y={H - 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="IBM Plex Mono">
          Cisplatin log₂FC
        </text>
        <text x={10} y={H / 2} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="IBM Plex Mono"
          transform={`rotate(-90,10,${H / 2})`}>Doxorubicin log₂FC</text>
      </svg>
      <p className="text-[10px] font-mono text-muted-foreground mt-1 text-center">
        Fig 4A. Cisplatin vs doxorubicin gene-wise log₂FC (r = {DRUG_PEARSON_R})
      </p>
    </div>
  );
}

/* ─── Export Button ─── */
function FigExportBtn({ chartId, name }: { chartId: string; name: string }) {
  return (
    <button onClick={() => downloadChartAsPng(chartId, name)}
      className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary rounded border border-border hover:border-primary/40 transition-colors">
      <Download className="w-3 h-3" /> PNG
    </button>
  );
}

/* ─── Main Figure Panel ─── */
export default function NeuroblastomaFigures() {
  const [tab, setTab] = useState("volcanos");

  return (
    <Card className="module-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono tracking-wide flex items-center gap-2">
            Neuroblastoma Multi-Omic Figures
            <Badge variant="outline" className="text-[10px]">Boeva et al.</Badge>
          </CardTitle>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">
          ADRN vs MES lineage plasticity — H3K27ac ChIP-seq & RNA-seq (15 cell lines, 36 samples)
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-5 h-7 mb-3">
            <TabsTrigger value="volcanos" className="text-[10px] data-[state=active]:bg-primary/20">Volcanos</TabsTrigger>
            <TabsTrigger value="cross" className="text-[10px] data-[state=active]:bg-primary/20">Cross-Layer</TabsTrigger>
            <TabsTrigger value="lineage" className="text-[10px] data-[state=active]:bg-primary/20">Lineage Δ</TabsTrigger>
            <TabsTrigger value="drugs" className="text-[10px] data-[state=active]:bg-primary/20">Drug Resp.</TabsTrigger>
            <TabsTrigger value="phox2b" className="text-[10px] data-[state=active]:bg-primary/20">PHOX2B</TabsTrigger>
          </TabsList>

          <TabsContent value="volcanos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">Fig 1A — RNA-seq DE</span>
                  <FigExportBtn chartId="nb-rna-volcano" name="RNA_Volcano" />
                </div>
                <VolcanoPlot id="nb-rna-volcano" data={RNA_VOLCANO} labels={RNA_LABELS}
                  sigCounts={RNA_SIG_COUNTS} title="RNA-seq: Noradrenergic vs NCC-like/Mesenchymal" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">Fig 1B — H3K27ac Diff. Binding</span>
                  <FigExportBtn chartId="nb-chip-volcano" name="ChIP_Volcano" />
                </div>
                <VolcanoPlot id="nb-chip-volcano" data={CHIP_VOLCANO} labels={CHIP_LABELS}
                  sigCounts={CHIP_SIG_COUNTS} title="H3K27ac ChIP-seq: Differential Binding" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cross">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-muted-foreground">Fig 1C — Multi-layer decoupling</span>
              <FigExportBtn chartId="nb-cross-scatter" name="Cross_Layer_Scatter" />
            </div>
            <CrossLayerScatter id="nb-cross-scatter" />
            <div className="mt-3 p-2 rounded bg-muted/30 border border-border">
              <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Key finding:</strong> Gene-level decoupling between chromatin (H3K27ac) and
                transcription (RNA) — Pearson r = {CROSS_PEARSON_R}. Despite near-zero correlation at gene level,
                sample-level concordance is high (r = 0.91), consistent with chromatin acting as a permissive landscape
                rather than instructive signal.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="lineage">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-muted-foreground">Fig 2A — Lineage score distribution</span>
              <FigExportBtn chartId="nb-delta-bars" name="Lineage_Delta" />
            </div>
            <LineageDeltaChart id="nb-delta-bars" />
            <div className="mt-3 p-2 rounded bg-muted/30 border border-border">
              <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Δ = mean(ADRN markers) − mean(MES markers).</strong> Positive = adrenergic identity,
                negative = mesenchymal. hNCC (developmental reference) anchors the mesenchymal extreme. Drug-treated
                SK-N-SH shifts toward MES, while PHOX2B-KD CLB-GA remains in ADRN range with gradual drift.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="drugs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-muted-foreground">Fig 4A — Drug response concordance</span>
              <FigExportBtn chartId="nb-drug-corr" name="Drug_Correlation" />
            </div>
            <DrugCorrelationScatter id="nb-drug-corr" />
            <div className="mt-3 p-2 rounded bg-muted/30 border border-border">
              <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Pharmacologic trajectory coherence:</strong> Cisplatin and doxorubicin induce
                highly correlated transcriptomic changes (r = {DRUG_PEARSON_R}), defining a shared chemotherapy
                response axis. This is analogous to HGSOC platinum-resistance trajectories and validates the
                perturbation-class dominance principle.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="phox2b">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-muted-foreground">Fig 5A — PHOX2B suppression trajectory</span>
              <FigExportBtn chartId="nb-phox2b-tc" name="PHOX2B_TimeCourse" />
            </div>
            <PHOX2BTimeCourse id="nb-phox2b-tc" />
            <div className="mt-3 p-2 rounded bg-muted/30 border border-border">
              <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Distinct trajectory:</strong> PHOX2B suppression drives gradual lineage drift
                (11.7% displacement over 13 days) that remains within the adrenergic basin — in contrast to
                chemotherapy-driven mesenchymal transitions. This orthogonality between perturbation classes is the
                central organizing principle of the multi-trajectory framework (Fig 6–7).
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
