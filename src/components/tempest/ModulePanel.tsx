import { motion } from "framer-motion";
import type { Module } from "./Sidebar";
import SurvivalCurveChart from "./charts/SurvivalCurveChart";
import ClonalDynamicsChart from "./charts/ClonalDynamicsChart";
import RiskRadar from "./charts/RiskRadar";
import { Dna, Activity, FlaskConical, Shield, BarChart3, FileText, Play, Download } from "lucide-react";

const moduleInfo: Record<string, { title: string; subtitle: string; icon: any; description: string }> = {
  motf: {
    title: "MOTF — Multi-Omic Tensor Factorization",
    subtitle: "Weighted Non-negative Tucker Decomposition",
    icon: Dna,
    description: "Decomposes multi-omic data tensors (genomic × transcriptomic × epigenomic) using weighted NTD to identify latent molecular programs. Supports PARAFAC, Tucker3, and sparse variants with automatic rank selection via core consistency diagnostics.",
  },
  gbsc: {
    title: "GBSC — Genomic Bayesian Survival Classifier",
    subtitle: "Kaplan-Meier & Cox Proportional Hazards",
    icon: Activity,
    description: "Bayesian survival modeling integrating genomic features with clinical outcomes. Implements stratified Kaplan-Meier estimation, multivariate Cox regression with elastic net regularization, and concordance-based model selection.",
  },
  bctn: {
    title: "BCTN — Bayesian Clonal Trajectory Networks",
    subtitle: "Dirichlet-Multinomial Clonal Dynamics",
    icon: FlaskConical,
    description: "Models tumor clonal architecture evolution using Dirichlet-Multinomial mixture models. Tracks variant allele frequency trajectories, infers phylogenetic relationships, and detects branching events in longitudinal sequencing data.",
  },
  cnis: {
    title: "CNIS — Comprehensive Neoantigen Intelligence System",
    subtitle: "HLA-Peptide Binding & Immunogenicity",
    icon: Shield,
    description: "Predicts neoantigen candidates from somatic mutations using neural network-based MHC binding affinity models. Integrates HLA typing, peptide processing, T-cell receptor recognition, and immunogenicity scoring.",
  },
  msrs: {
    title: "MSRS — Multi-Scale Risk Stratification",
    subtitle: "Ensemble Risk Scoring Framework",
    icon: BarChart3,
    description: "Combines molecular, clinical, and imaging features into a unified risk score via gradient-boosted ensemble models. Provides patient-level risk profiles, cohort stratification, and treatment response prediction.",
  },
};

const chartForModule: Record<string, React.ReactNode> = {
  motf: <RiskRadar />,
  gbsc: <SurvivalCurveChart />,
  bctn: <ClonalDynamicsChart />,
  cnis: <SurvivalCurveChart />,
  msrs: <RiskRadar />,
};

const sampleResults = [
  { metric: "Reconstruction Error", value: "0.0342", trend: "↓ 12%" },
  { metric: "Core Consistency", value: "94.7%", trend: "↑ 3%" },
  { metric: "Latent Factors", value: "8", trend: "stable" },
  { metric: "Explained Variance", value: "87.2%", trend: "↑ 5%" },
];

interface Props {
  module: Exclude<Module, "overview" | "chat">;
}

const ModulePanel = ({ module }: Props) => {
  const info = moduleInfo[module];
  if (!info) return null;

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
            {sampleResults.map((r) => (
              <div key={r.metric} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{r.metric}</span>
                <div className="text-right">
                  <span className="text-sm font-mono text-foreground">{r.value}</span>
                  <span className={`block text-[10px] font-mono ${r.trend.startsWith("↑") ? "text-chart-emerald" : r.trend.startsWith("↓") ? "text-chart-cyan" : "text-muted-foreground"}`}>
                    {r.trend}
                  </span>
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
          {[
            { label: "Rank", value: "[4, 6, 8]" },
            { label: "Iterations", value: "500" },
            { label: "Convergence", value: "1e-6" },
            { label: "Regularization", value: "L1 + L2" },
          ].map((c) => (
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
