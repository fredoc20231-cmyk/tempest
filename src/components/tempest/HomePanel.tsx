import { motion } from "framer-motion";
import { Dna, Activity, FlaskConical, Shield, BarChart3, ArrowRight, Zap, Brain, Globe, Lock, GitBranch } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const modules = [
  {
    id: "motf",
    label: "MOTF",
    title: "Tucker Decomposition",
    desc: "Multi-modal tensor factorization to decompose high-dimensional omics data into interpretable latent factors across genomic, transcriptomic, and epigenomic layers.",
    icon: Dna,
    color: "text-chart-cyan",
    bg: "bg-chart-cyan/10",
  },
  {
    id: "gbsc",
    label: "GBSC",
    title: "Bayesian Survival Curves",
    desc: "Generate Kaplan-Meier survival estimates with Bayesian confidence intervals, stratified by molecular subtypes and treatment arms.",
    icon: Activity,
    color: "text-chart-magenta",
    bg: "bg-chart-magenta/10",
  },
  {
    id: "bctn",
    label: "BCTN",
    title: "Clonal Dynamics",
    desc: "Track clonal architecture evolution across longitudinal timepoints, mapping subclonal expansions, contractions, and therapeutic bottlenecks.",
    icon: FlaskConical,
    color: "text-chart-amber",
    bg: "bg-chart-amber/10",
  },
  {
    id: "cnis",
    label: "CNIS",
    title: "Neoantigen Intelligence",
    desc: "Predict immunogenic neoantigen candidates from somatic mutations, integrating HLA binding affinity, clonality, and expression filters. Cross-species validation with tiered prioritization.",
    icon: Shield,
    color: "text-chart-emerald",
    bg: "bg-chart-emerald/10",
  },
  {
    id: "msrs",
    label: "MSRS",
    title: "Multi-Scale Risk Scoring",
    desc: "Aggregate molecular, clinical, and microenvironmental features into a composite risk score with interpretable feature attribution and bootstrap confidence intervals.",
    icon: BarChart3,
    color: "text-chart-rose",
    bg: "bg-chart-rose/10",
  },
  {
    id: "trajectory",
    label: "Trajectory",
    title: "Cancer Trajectory Prediction",
    desc: "Predict future cancer evolution using dynamical systems theory. Models epigenetic landscape bifurcations, transcriptomic entropy, and early warning signals to identify branching transitions.",
    icon: GitBranch,
    color: "text-chart-magenta",
    bg: "bg-chart-magenta/10",
  },
];

const capabilities = [
  {
    icon: Zap,
    title: "Real-Time Pipeline",
    desc: "Run multi-module analyses with live progress tracking and instant result visualization.",
  },
  {
    icon: Brain,
    title: "AI-Powered Agent",
    desc: "Natural language interface to query cohort data, trigger analyses, and interpret results conversationally.",
  },
  {
    icon: Globe,
    title: "Multi-Cohort Support",
    desc: "Upload and manage multiple patient cohorts with CSV/TSV import and cross-cohort comparisons.",
  },
  {
    icon: Lock,
    title: "Reproducible & Auditable",
    desc: "Every pipeline run is logged with full provenance — configurations, timestamps, and versioned outputs.",
  },
];

interface HomePanelProps {
  onNavigate: (module: string) => void;
}

const HomePanel = ({ onNavigate }: HomePanelProps) => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 p-6 max-w-5xl mx-auto">
      {/* Hero */}
      <motion.div variants={item} className="text-center py-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono mb-6">
          <Dna className="w-3.5 h-3.5" /> Precision Oncology Platform
        </div>
        <h1 className="text-4xl font-semibold text-foreground tracking-tight leading-tight">
          Tumor Evolution Mapping Platform<br />
          <span className="text-primary">for Ensemble Statistical Tracking</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          TEMPEST integrates multi-omics tensor decomposition, Bayesian survival modelling, clonal dynamics tracking, neoantigen prediction, and composite risk scoring into a single, AI-assisted research workflow.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate("overview")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate("chat")}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            <Brain className="w-4 h-4" /> Ask AI Agent
          </button>
        </div>
      </motion.div>

      {/* Capabilities */}
      <motion.div variants={item}>
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Platform Capabilities</h2>
        <div className="grid grid-cols-2 gap-4">
          {capabilities.map((c) => (
            <div key={c.title} className="module-card flex items-start gap-4">
              <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                <c.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">{c.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Modules */}
      <motion.div variants={item}>
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Analysis Modules</h2>
        <div className="space-y-3">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className="module-card w-full text-left flex items-start gap-4 group"
            >
              <div className={`p-2 rounded-md ${mod.bg} flex-shrink-0`}>
                <mod.icon className={`w-4 h-4 ${mod.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-semibold ${mod.color}`}>{mod.label}</span>
                  <span className="text-sm font-medium text-foreground">{mod.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HomePanel;
