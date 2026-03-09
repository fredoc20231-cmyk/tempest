import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Module } from "./Sidebar";
import type { CohortPayload } from "./ChatPanel";
import SurvivalCurveChart from "./charts/SurvivalCurveChart";
import ClonalDynamicsChart from "./charts/ClonalDynamicsChart";
import RiskRadar from "./charts/RiskRadar";
import { downloadChartAsPng, downloadTableAsCsv, downloadHtmlReport } from "./utils/downloadUtils";
import { useTempest } from "@/contexts/TempestContext";
import { mapSurvivalData, mapClonalData, mapRadarData } from "@/lib/chartDataMapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Dna, Activity, FlaskConical, Shield, BarChart3, FileText, Play, Download, CheckCircle2, Loader2, RotateCcw, RefreshCw, GitBranch, Bot, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const moduleInfo: Record<string, { title: string; subtitle: string; icon: any; description: string }> = {
  motf: {
    title: "MOTF — Multi-Omic Tensor Factorization",
    subtitle: "Weighted Non-negative Tucker Decomposition (wNTD)",
    icon: Dna,
    description: "Constructs a three-way tensor T ∈ ℝ^(S × G × M) where S = samples/timepoints, G = features (genes, variants, spatial spots), M = modalities (RNA-seq, WES, Spatial, Neoantigen). Uses weighted NTD with Tikhonov regularization (λ₁–λ₃ tuned via 5-fold CV) and binary observation mask W for missing modality handling. Latent factors annotated via PROGENy pathway correlation.",
  },
  gbsc: {
    title: "GBSC — Gradient-Boosted Stage Classifier",
    subtitle: "XGBoost + LOTO Cross-Validation",
    icon: Activity,
    description: "Ensemble GBDT trained on MOTF latent factors + 47 curated features. XGBoost v1.7: 350 estimators, depth 5, η=0.04, L2 γ=1.2. LOTO CV yields 94.7% accuracy, macro-F1 = 0.93. SHAP provides per-sample feature attribution.",
  },
  bctn: {
    title: "BCTN — Bayesian Clonal Trajectory Networks",
    subtitle: "Dirichlet Process Mixture + PyClone v0.13.1",
    icon: FlaskConical,
    description: "Models subclonal architecture from somatic VAFs using Dirichlet Process Mixture (10K MCMC, 1K burn-in, Binomial emission). Tracks clonal consolidation from 5 early clusters to 1–2 dominant lineages.",
  },
  cnis: {
    title: "CNIS — Comprehensive Neoantigen Intelligence System",
    subtitle: "NetMHCpan 4.1b + Arriba Fusion + COSMIC Validation",
    icon: Shield,
    description: "Database-validated neoantigen analysis: 4,499 candidates (11 mutation + 4,488 fusion) across D0–D122. GATK4 Mutect2 → SnpEff → NetMHCpan 4.1b (H-2-Db/Kb). Fusion detection via STAR-Fusion∩Arriba. Multi-modal filtering: WES∩RNA co-detection, >10 CPM expression, absence from D0 controls, VEP high-impact, dbSNP/MGI exclusion. COSMIC v98 cross-validation confirms MEIS1, ARID1A (46-70% OC), KAT6A, NSD3 as validated targets. Priority scoring: 3×(−log10(rank_el%)) + 1.5×log2(peak_expr) + log2(stages+1) + 1.5×DE.",
  },
  msrs: {
    title: "MSRS — Multi-Scale Risk Stratification",
    subtitle: "Composite Risk Scoring with Uncertainty Quantification",
    icon: BarChart3,
    description: "Integrates MOTF latent factors, GBSC stage probabilities, BCTN clonal trajectory forecasts, and CNIS immunogenicity scores into a unified risk profile. Bootstrap confidence intervals (n=1,000).",
  },
};

const defaultResults: Record<string, { metric: string; value: string; trend: string }[]> = {
  motf: [
    { metric: "Latent Factors", value: "12", trend: "elbow @ 90%" },
    { metric: "Variance Explained", value: "92.3%", trend: "cross-modal" },
    { metric: "LF1 ↔ Stage", value: "r = 0.94", trend: "p < 10⁻⁶" },
  ],
  gbsc: [
    { metric: "Accuracy (LOTO)", value: "94.7%", trend: "8-fold" },
    { metric: "Macro F1", value: "0.93", trend: "4 stages" },
  ],
  bctn: [
    { metric: "D52 Clusters", value: "5", trend: "branched" },
    { metric: "D122 Lineages", value: "1–2", trend: "consolidated" },
  ],
  cnis: [
    { metric: "Total Candidates", value: "4,499", trend: "11 mutation + 4,488 fusion" },
    { metric: "High-Priority Targets", value: "8", trend: "validated for testing" },
    { metric: "MEIS1 F378X (Tier 1)", value: "23.07% WB", trend: "D20→D122 trunk, 19% immunogenicity" },
    { metric: "Camk1d::Arid1a", value: "0.519% WB", trend: "ARID1A: 46-70% OC (COSMIC)" },
    { metric: "Fxr1::Zfp704", value: "1.329% WB", trend: "dual MHC binding (Db+Kb)" },
    { metric: "Nsd3::Kat6a", value: "1.230% WB", trend: "histone modifier fusion (COSMIC)" },
    { metric: "Mfhas1::Tns3", value: "0.133% SB", trend: "strongest binder, late (D109-122)" },
    { metric: "Fusion Events", value: "374", trend: "164 high-confidence, peak D88" },
    { metric: "RNA/WES Integration", value: "993 binders", trend: "823 up / 763 down DEGs" },
    { metric: "COSMIC Validated Genes", value: "4/6", trend: "MEIS1, ARID1A, KAT6A, NSD3" },
  ],
  msrs: [
    { metric: "Stage Classification", value: "94.7%", trend: "GBSC" },
    { metric: "Neoantigen Targets", value: "6 recurrent", trend: "CNIS" },
  ],
};

const moduleConfig: Record<string, { label: string; value: string }[]> = {
  motf: [
    { label: "Tensor", value: "T ∈ ℝ^(8×12451×4)" },
    { label: "Decomposition", value: "wNTD" },
    { label: "Regularization", value: "Tikhonov (λ₁–λ₃)" },
    { label: "Rank Selection", value: "Elbow @ 90%" },
  ],
  gbsc: [
    { label: "Model", value: "XGBoost v1.7" },
    { label: "Estimators", value: "350, depth 5" },
    { label: "Validation", value: "LOTO (8-fold)" },
    { label: "Explainability", value: "SHAP" },
  ],
  bctn: [
    { label: "Model", value: "DPM (PyClone)" },
    { label: "MCMC", value: "10K iter, 1K burn" },
    { label: "Emission", value: "Binomial" },
    { label: "Convergence", value: "R̂ < 1.1" },
  ],
  cnis: [
    { label: "Predictor", value: "NetMHCpan 4.1b" },
    { label: "Alleles", value: "H-2-Db, H-2-Kb" },
    { label: "Strong Binder", value: "%Rank < 0.5" },
    { label: "Weak Binder", value: "%Rank 0.5–2.0" },
    { label: "Fusion", value: "STAR∩Arriba (374 events)" },
    { label: "WES", value: "GATK4 Mutect2" },
    { label: "Expression", value: "limma-voom, TMM norm" },
    { label: "Clonality", value: "PyClone (17 clusters)" },
    { label: "Validation", value: "COSMIC v98" },
  ],
  msrs: [
    { label: "Inputs", value: "MOTF+GBSC+BCTN+CNIS" },
    { label: "Bootstrap", value: "n = 1,000" },
    { label: "Calibration", value: "Brier score" },
    { label: "Output", value: "Risk trajectory" },
  ],
};

function ChartForModule({ module, results }: { module: string; results: any }) {
  const aiResults = results?.results;
  switch (module) {
    case "gbsc":
    case "cnis":
      return <SurvivalCurveChart data={mapSurvivalData(aiResults)} />;
    case "bctn":
      return <ClonalDynamicsChart data={mapClonalData(aiResults)} />;
    case "motf":
    case "msrs":
      return <RiskRadar data={mapRadarData(aiResults)} />;
    default:
      return <RiskRadar />;
  }
}

interface Props {
  module: Exclude<Module, "overview" | "chat">;
  cohort?: CohortPayload | null;
}

const ModulePanel = ({ module, cohort }: Props) => {
  const info = moduleInfo[module];
  const { analysisResults, pipelineRuns, refreshResults, resetPipeline, isLoading, aiContext, setAIContext } = useTempest();
  const [running, setRunning] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(true);

  if (!info) return null;

  const pipelineRun = pipelineRuns.find((r) => r.module === module);
  const latestResult = analysisResults[module];
  const results = latestResult?.results?.metrics || defaultResults[module] || [];
  const config = moduleConfig[module] || [];
  const chartId = `module-chart-${module}`;
  const isFailed = pipelineRun?.status === "failed";

  const handleRunAnalysis = async () => {
    setRunning(true);
    toast.info(`Starting ${module.toUpperCase()} analysis...`);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ module }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast.error(errData.error || `Analysis failed (${resp.status})`);
        setRunning(false);
        return;
      }

      await refreshResults(module);
      toast.success(`${module.toUpperCase()} analysis complete!`);
    } catch (e) {
      toast.error("Network error running analysis.");
      console.error(e);
    }
    setRunning(false);
  };

  const handleReset = async () => {
    await resetPipeline(module);
    toast.success(`${module.toUpperCase()} pipeline reset to idle.`);
  };

  const handleExport = () => {
    downloadTableAsCsv(results, `${module}_results`);
    toast.success("Results exported as CSV.");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <info.icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{info.title}</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">{info.subtitle}</p>
            {pipelineRun && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded mt-1 inline-block ${
                pipelineRun.status === "complete" ? "bg-chart-emerald/10 text-chart-emerald" :
                pipelineRun.status === "running" ? "bg-primary/10 text-primary" :
                pipelineRun.status === "failed" ? "bg-destructive/10 text-destructive" :
                "bg-muted text-muted-foreground"
              }`}>
                {pipelineRun.status.toUpperCase()} {pipelineRun.status === "running" && `(${pipelineRun.progress}%)`}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isFailed && (
            <>
              <button
                onClick={handleRunAnalysis}
                disabled={running}
                className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-chart-amber/10 text-chart-amber rounded-md hover:bg-chart-amber/20 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </>
          )}
          <button
            onClick={handleRunAnalysis}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Running..." : "Run Analysis"}
          </button>
          <button
            onClick={() => downloadHtmlReport(moduleInfo, { [module]: results }, moduleConfig)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> HTML Report
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Cohort banner */}
      {cohort && module === "motf" && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-chart-emerald" />
            <span className="text-sm font-mono font-semibold text-foreground">Cohort Loaded: {cohort.name}</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-secondary/50 rounded-md p-2">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">Tensor</span>
              <span className="block text-xs font-mono text-foreground mt-0.5">{cohort.tensorShape}</span>
            </div>
            <div className="bg-secondary/50 rounded-md p-2">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">Latent Factors</span>
              <span className="block text-xs font-mono text-foreground mt-0.5">{cohort.latentFactors} (92.3% var.)</span>
            </div>
            <div className="bg-secondary/50 rounded-md p-2">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">Timepoints</span>
              <span className="block text-xs font-mono text-foreground mt-0.5">{cohort.timepoints.length} (D0–D122)</span>
            </div>
            <div className="bg-secondary/50 rounded-md p-2">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">Modalities</span>
              <span className="block text-xs font-mono text-foreground mt-0.5">{cohort.modalities.length} integrated</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Context Banner */}
      <AnimatePresence>
        {aiContext?.module === module && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="module-card border-primary/30 bg-primary/5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-mono text-primary uppercase tracking-wide">AI Agent Analysis Context</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setContextExpanded(!contextExpanded)}
                  className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                >
                  {contextExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setAIContext(null)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {contextExpanded && (
              <div className="text-sm prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-td:text-foreground prose-th:text-foreground max-h-[300px] overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2 rounded-md border border-border">
                        <Table>{children}</Table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-secondary">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="hover:bg-secondary/50 border-b border-border">{children}</tr>,
                    th: ({ children }) => <th className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 text-left">{children}</th>,
                    td: ({ children }) => <td className="font-mono text-sm px-3 py-2 leading-relaxed">{children}</td>,
                  }}
                >{aiContext.content}</ReactMarkdown>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description */}
      <div className="module-card">
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
        </div>
      </div>

      {/* Narrative from AI results */}
      {latestResult?.results?.narrative && (
        <div className="module-card border-primary/20">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2">AI Analysis Narrative</h3>
          <p className="text-sm text-foreground leading-relaxed">{latestResult.results.narrative}</p>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="module-card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Visualization</h3>
            <button
              onClick={() => downloadChartAsPng(chartId, `${module}_visualization`)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary rounded border border-border hover:border-primary/40 transition-colors"
            >
              <Download className="w-3 h-3" /> PNG
            </button>
          </div>
          <div id={chartId}>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ChartForModule module={module} results={latestResult} />
            )}
          </div>
        </div>

        <div className="module-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
              {latestResult ? "AI-Generated Results" : "Default Results"}
            </h3>
            <button
              onClick={() => downloadTableAsCsv(results, `${module}_results`)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary rounded border border-border hover:border-primary/40 transition-colors"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r: any) => (
                <div key={r.metric} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{r.metric}</span>
                  <div className="text-right">
                    <span className="text-sm font-mono text-foreground">{r.value}</span>
                    <span className="block text-[10px] font-mono text-muted-foreground">{r.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="module-card">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Configuration</h3>
        <div className="grid grid-cols-4 gap-4">
          {config.map((c) => (
            <div key={c.label} className="bg-secondary/50 rounded-md p-3">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">{c.label}</span>
              <span className="block text-sm font-mono text-foreground mt-1">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ModulePanel;
