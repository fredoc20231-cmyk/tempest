import { motion } from "framer-motion";
import type { Module } from "./Sidebar";
import type { CohortPayload } from "./ChatPanel";
import SurvivalCurveChart from "./charts/SurvivalCurveChart";
import ClonalDynamicsChart from "./charts/ClonalDynamicsChart";
import RiskRadar from "./charts/RiskRadar";
import { Dna, Activity, FlaskConical, Shield, BarChart3, FileText, Play, Download, CheckCircle2 } from "lucide-react";

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
    description: "Ensemble GBDT trained on MOTF latent factors + 47 curated features (top 20 stage-specific DEGs, missense:silent ratio, PyClone dominant cluster prevalence, Vim & MKI67 spatial scores). XGBoost v1.7: 350 estimators, depth 5, η=0.04, L2 γ=1.2. LOTO CV yields 94.7% accuracy, macro-F1 = 0.93. SHAP provides per-sample feature attribution.",
  },
  bctn: {
    title: "BCTN — Bayesian Clonal Trajectory Networks",
    subtitle: "Dirichlet Process Mixture + PyClone v0.13.1",
    icon: FlaskConical,
    description: "Models subclonal architecture from somatic VAFs using Dirichlet Process Mixture (10K MCMC, 1K burn-in, Binomial emission). Tracks clonal consolidation from 5 early clusters to 1–2 dominant lineages. Expanding clone GSEA reveals cell cycle, chromatin org, vasculogenesis, rRNA processing, and immune modulation programs. Gelman-Rubin R̂ < 1.1, ARI > 0.90.",
  },
  cnis: {
    title: "CNIS — Comprehensive Neoantigen Intelligence System",
    subtitle: "NetMHCpan 4.1b + Fusion Scanning",
    icon: Shield,
    description: "Multi-modal filtering: WES∩RNA co-detection, >10 CPM expression, absence from D0 controls, VEP high-impact, dbSNP/MGI exclusion. NetMHCpan 4.1b predicts H-2-Db/Kb binding (%Rank < 0.5 = strong). Fusion detection via STAR-Fusion∩Arriba intersection (≥5 spanning + ≥3 split reads). Identifies recurrent, stage-spanning neoantigens for immunotherapy prioritization.",
  },
  msrs: {
    title: "MSRS — Multi-Scale Risk Stratification",
    subtitle: "Composite Risk Scoring with Uncertainty Quantification",
    icon: BarChart3,
    description: "Integrates MOTF latent factors, GBSC stage probabilities, BCTN clonal trajectory forecasts, and CNIS immunogenicity scores into a unified risk profile. Bootstrap confidence intervals (n=1,000) provide calibrated uncertainty. Patient-level risk trajectories enable stage-specific therapeutic timing recommendations.",
  },
};

const moduleResults: Record<string, { metric: string; value: string; trend: string }[]> = {
  motf: [
    { metric: "Latent Factors", value: "12", trend: "elbow @ 90%" },
    { metric: "Variance Explained", value: "92.3%", trend: "cross-modal" },
    { metric: "LF1 ↔ Stage", value: "r = 0.94", trend: "p < 10⁻⁶" },
    { metric: "LF2 ↔ Transitional", value: "r = 0.81", trend: "D88/99" },
    { metric: "LF4 ↔ Compartment", value: "r = 0.88", trend: "FT/STIC/Tumor" },
  ],
  gbsc: [
    { metric: "Accuracy (LOTO)", value: "94.7%", trend: "8-fold" },
    { metric: "Macro F1", value: "0.93", trend: "4 stages" },
    { metric: "Mean Brier Score", value: "0.047", trend: "±0.008" },
    { metric: "Top SHAP: LF1", value: "0.342", trend: "stage driver" },
    { metric: "Top SHAP: M:S ratio", value: "0.218", trend: "mutational" },
  ],
  bctn: [
    { metric: "D52 Clusters", value: "5", trend: "branched" },
    { metric: "D88 M:S Ratio", value: "2.65", trend: "peak diversity" },
    { metric: "D122 Lineages", value: "1–2", trend: "consolidated" },
    { metric: "Gelman-Rubin R̂", value: "< 1.1", trend: "converged" },
    { metric: "Cluster ARI", value: "> 0.90", trend: "stable" },
  ],
  cnis: [
    { metric: "Meis1 (D20→D122)", value: "%Rank ↓WT", trend: "persistent" },
    { metric: "Rbm26 (4 stages)", value: "longest-lived", trend: "D21–D109" },
    { metric: "Slfn8", value: "strong binder", trend: "D52 & D99" },
    { metric: "Mfhas1::Tns3", value: "%Rank 0.13", trend: "fusion" },
    { metric: "Camk1d::Arid1a", value: "dual Db/Kb", trend: "fusion" },
  ],
  msrs: [
    { metric: "Stage Classification", value: "94.7%", trend: "GBSC" },
    { metric: "Clonal Forecast", value: "converged", trend: "BCTN" },
    { metric: "Neoantigen Targets", value: "6 recurrent", trend: "CNIS" },
    { metric: "Bootstrap CI", value: "n = 1,000", trend: "calibrated" },
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
    { label: "Fusion", value: "STAR-Fusion∩Arriba" },
  ],
  msrs: [
    { label: "Inputs", value: "MOTF+GBSC+BCTN+CNIS" },
    { label: "Bootstrap", value: "n = 1,000" },
    { label: "Calibration", value: "Brier score" },
    { label: "Output", value: "Risk trajectory" },
  ],
};

const chartForModule: Record<string, React.ReactNode> = {
  motf: <RiskRadar />,
  gbsc: <SurvivalCurveChart />,
  bctn: <ClonalDynamicsChart />,
  cnis: <SurvivalCurveChart />,
  msrs: <RiskRadar />,
};

interface Props {
  module: Exclude<Module, "overview" | "chat">;
  cohort?: CohortPayload | null;
}

const ModulePanel = ({ module, cohort }: Props) => {
  const info = moduleInfo[module];
  if (!info) return null;

  const results = moduleResults[module] || [];
  const config = moduleConfig[module] || [];

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
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
            <Play className="w-3.5 h-3.5" /> Run Analysis
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Cohort banner */}
      {cohort && module === "motf" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-lg p-4"
        >
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

      {/* Description */}
      <div className="module-card">
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Chart */}
        <div className="module-card col-span-2">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Visualization</h3>
          {chartForModule[module]}
        </div>

        {/* Results */}
        <div className="module-card">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Latest Results</h3>
          <div className="space-y-3">
            {results.map((r) => (
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
