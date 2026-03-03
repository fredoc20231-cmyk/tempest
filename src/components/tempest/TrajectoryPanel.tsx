import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Play, Loader2, Download, FileText, RefreshCw, RotateCcw, Info } from "lucide-react";
import BifurcationChart from "./charts/BifurcationChart";
import { downloadChartAsPng, downloadTableAsCsv, downloadHtmlReport } from "./utils/downloadUtils";
import { useTempest } from "@/contexts/TempestContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const phaseData = [
  {
    phase: "I — Early Constrained",
    window: "Day 0–21",
    transcriptome: "Tight PCA clustering; baseline-proximal",
    mutations: "Missense:silent ~2.18; LOF acquisition (EPHX2, PPP5C, CBL)",
    model: "Deep potential valley; single attractor",
    entropy: "Low (S ≈ 0.15)",
  },
  {
    phase: "II — Transition",
    window: "Day 52",
    transcriptome: "Distinct intermediate cluster; steroidogenic reprogramming",
    mutations: "Peak missense enrichment (2.65 at D88); 3,772 variants",
    model: "Barrier lowering; landscape flattening",
    entropy: "Rising (S ≈ 0.35)",
  },
  {
    phase: "III — Late-Intermediate (Bifurcation)",
    window: "Day 88–99",
    transcriptome: "Divergent cluster; Marco+ macrophage polarization",
    mutations: "Clonal expansion → 4–6 PyClone clusters",
    model: "Critical transition; μ > 0; two attractors emerge",
    entropy: "Peak (S ≈ 0.70)",
  },
  {
    phase: "IV — Advanced",
    window: "Day 109–122",
    transcriptome: "Proliferative consolidation; insulin/IGF activation",
    mutations: "Stabilization; missense:silent ~1.16; 1–2 dominant lineages",
    model: "Post-branch attractors; reduced plasticity",
    entropy: "Declining (S ≈ 0.45)",
  },
];

const trajectoryMetrics = [
  { metric: "Branch Point", value: "Day 88–99", trend: "μ crosses zero" },
  { metric: "Entropy Peak", value: "S(99) = 0.70", trend: "Shannon entropy" },
  { metric: "EWS Variance", value: "↑ 2.4× at D88", trend: "Critical slowing" },
  { metric: "Attractor Count", value: "1 → 2", trend: "Post-bifurcation" },
  { metric: "Clonal Consolidation", value: "5 → 1–2 clones", trend: "Selective sweep" },
  { metric: "STIC→Tumor Switch", value: "D116 single cell", trend: "Discrete transition" },
];

const neoantigenTiers = [
  { candidate: "MEIS1 (F378X)", tier: "Tier 1", binding: "47.7% improvement", human: "Expression + CD8+ recruitment confirmed", actionability: "Hypothesis-generating" },
  { candidate: "SLFN11 (I791N)", tier: "Tier 2", binding: "26.0% improvement", human: "Biomarker validated; chemo sensitivity", actionability: "Patient selection tool" },
  { candidate: "ZKSCAN7 (K404N)", tier: "Tier 3", binding: "69.9% (best)", human: "Zero human data", actionability: "Research-grade only" },
  { candidate: "RBM26 (S990FX)", tier: "Tier 4", binding: "21.2% (most recurrent)", human: "Not a cancer gene; no COSMIC data", actionability: "Not recommended" },
  { candidate: "Mfhas1::Tns3", tier: "Fusion", binding: "%Rank 0.133 (SB)", human: "DNA breakpoint pending", actionability: "Late-clone targeting" },
  { candidate: "Camk1d::Arid1a", tier: "Fusion", binding: "%Rank 0.519 (WB)", human: "RT-PCR in progress", actionability: "Dual MHC-I/II" },
];

const TrajectoryPanel = () => {
  const { pipelineRuns, analysisResults, resetPipeline, refreshResults, isLoading } = useTempest();
  const [running, setRunning] = useState(false);
  const chartId = "trajectory-bifurcation-chart";

  const handleRunAnalysis = async () => {
    setRunning(true);
    toast.info("Starting Trajectory Prediction analysis...");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ module: "trajectory" }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast.error(errData.error || `Analysis failed (${resp.status})`);
        setRunning(false);
        return;
      }
      await refreshResults("trajectory");
      toast.success("Trajectory prediction complete!");
    } catch (e) {
      toast.error("Network error running analysis.");
      console.error(e);
    }
    setRunning(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-chart-magenta/10">
            <GitBranch className="w-6 h-6 text-chart-magenta" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Trajectory Prediction — Dynamical Systems Framework</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">Non-linear Cancer Evolution & Bifurcation Analysis</p>
            <p className="text-xs text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Models tumor transcriptomic state as stochastic gradient flow on an epigenetic potential landscape U(x).
              Late-stage branching is formalized as a supercritical pitchfork bifurcation where cumulative "priming"
              (chromatin remodeling, microenvironmental coupling) drives the control parameter μ past zero,
              splitting one stable attractor into two divergent fates.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Predicting..." : "Run Prediction"}
          </button>
          <button
            onClick={() => downloadTableAsCsv(trajectoryMetrics, "trajectory_metrics")}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Mathematical Framework */}
      <div className="module-card border-chart-magenta/20">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-3">Dynamical Systems Formulation</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-md p-3">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">State Evolution</span>
            <span className="block text-sm font-mono text-foreground mt-1">dx/dt = −∇U(x) + η(t)</span>
            <span className="block text-[10px] text-muted-foreground mt-1">Waddington landscape model</span>
          </div>
          <div className="bg-secondary/50 rounded-md p-3">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Bifurcation (Normal Form)</span>
            <span className="block text-sm font-mono text-foreground mt-1">dx/dt = μx − x³</span>
            <span className="block text-[10px] text-muted-foreground mt-1">Supercritical pitchfork</span>
          </div>
          <div className="bg-secondary/50 rounded-md p-3">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Progression Coordinate</span>
            <span className="block text-sm font-mono text-foreground mt-1">Φ(t) = α·Epi + β·Sig + γ·Imm</span>
            <span className="block text-[10px] text-muted-foreground mt-1">Time-dependent, coupled weights</span>
          </div>
        </div>
      </div>

      {/* Bifurcation Chart + Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="module-card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Bifurcation Trajectory & Entropy Landscape</h3>
            <button
              onClick={() => downloadChartAsPng(chartId, "bifurcation_trajectory")}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary rounded border border-border hover:border-primary/40 transition-colors"
            >
              <Download className="w-3 h-3" /> PNG
            </button>
          </div>
          <div id={chartId}>
            {isLoading ? <Skeleton className="h-[260px] w-full" /> : <BifurcationChart />}
          </div>
          <div className="flex gap-6 mt-3 text-[10px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[hsl(216,100%,21%)] inline-block" /> Attractor 1 (Dominant)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[hsl(292,80%,60%)] inline-block border-dashed" /> Attractor 2 (Divergent)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[hsl(38,100%,55%)] inline-block" /> Entropy S(t)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[hsl(160,84%,45%)] inline-block" /> Barrier U(x)</span>
          </div>
        </div>

        <div className="module-card">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Trajectory Metrics</h3>
          <div className="space-y-3">
            {trajectoryMetrics.map((r) => (
              <div key={r.metric} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{r.metric}</span>
                <div className="text-right">
                  <span className="text-sm font-mono text-foreground">{r.value}</span>
                  <span className="block text-[10px] font-mono text-muted-foreground">{r.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase Structure Table */}
      <div className="module-card">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Phase Structure (Manuscript-Derived)</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-[11px]">Phase</TableHead>
                <TableHead className="font-mono text-[11px]">Window</TableHead>
                <TableHead className="font-mono text-[11px]">Transcriptome</TableHead>
                <TableHead className="font-mono text-[11px]">Mutations / Clonal</TableHead>
                <TableHead className="font-mono text-[11px]">Model State</TableHead>
                <TableHead className="font-mono text-[11px]">Entropy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phaseData.map((p) => (
                <TableRow key={p.phase}>
                  <TableCell className="text-xs font-mono font-semibold text-foreground">{p.phase}</TableCell>
                  <TableCell className="text-xs font-mono text-primary">{p.window}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.transcriptome}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.mutations}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.model}</TableCell>
                  <TableCell className="text-xs font-mono text-foreground">{p.entropy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Neoantigen Cross-Species Validation */}
      <div className="module-card">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Neoantigen Cross-Species Validation Tiers</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-[11px]">Candidate</TableHead>
                <TableHead className="font-mono text-[11px]">Tier</TableHead>
                <TableHead className="font-mono text-[11px]">Binding Improvement</TableHead>
                <TableHead className="font-mono text-[11px]">Human Validation</TableHead>
                <TableHead className="font-mono text-[11px]">Actionability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {neoantigenTiers.map((n) => (
                <TableRow key={n.candidate}>
                  <TableCell className="text-xs font-mono font-semibold text-foreground">{n.candidate}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      n.tier === "Tier 1" ? "bg-chart-emerald/10 text-chart-emerald" :
                      n.tier === "Tier 2" ? "bg-primary/10 text-primary" :
                      n.tier === "Fusion" ? "bg-chart-magenta/10 text-chart-magenta" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {n.tier}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-foreground">{n.binding}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">{n.human}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{n.actionability}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Clinical Implications */}
      <div className="module-card border-chart-amber/20">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-chart-amber" />
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Clinical & Therapeutic Implications</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/50 rounded-md p-3">
            <span className="text-xs font-semibold text-foreground block mb-1">Biomarker Timing</span>
            <span className="text-xs text-muted-foreground leading-relaxed block">
              Single biomarker panels may fail post-branch because different attractors express different marker sets.
              Sampling near/before the D88–99 bifurcation window maximizes neoantigen diversity capture.
            </span>
          </div>
          <div className="bg-secondary/50 rounded-md p-3">
            <span className="text-xs font-semibold text-foreground block mb-1">Combination Therapy Rationale</span>
            <span className="text-xs text-muted-foreground leading-relaxed block">
              In a multi-attractor system, pushing the tumor out of one basin may land it in another.
              Simultaneous targeting of immune + angiogenic + proliferative programs is required for durable response.
            </span>
          </div>
          <div className="bg-secondary/50 rounded-md p-3">
            <span className="text-xs font-semibold text-foreground block mb-1">Temporal-Clonal Strategy</span>
            <span className="text-xs text-muted-foreground leading-relaxed block">
              Early-stage (adjuvant): truncal neoantigen vaccines (MEIS1) to eliminate residual disease.
              Late-stage (recurrent): fusion neoantigens (Mfhas1::Tns3) to target dominant late clones.
            </span>
          </div>
          <div className="bg-secondary/50 rounded-md p-3">
            <span className="text-xs font-semibold text-foreground block mb-1">ECM Intervention Window</span>
            <span className="text-xs text-muted-foreground leading-relaxed block">
              ECM remodeling is permissive for subsequent proliferative expansion. MMP inhibition during
              the D52–88 transitional phase may prevent progression to advanced disease.
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrajectoryPanel;
