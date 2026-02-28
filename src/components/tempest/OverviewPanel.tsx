import { motion } from "framer-motion";
import { Dna, Activity, FlaskConical, Shield, BarChart3, ArrowUpRight, TrendingUp } from "lucide-react";
import SurvivalCurveChart from "./charts/SurvivalCurveChart";
import ClonalDynamicsChart from "./charts/ClonalDynamicsChart";
import RiskRadar from "./charts/RiskRadar";

const metrics = [
  { label: "Analyses Run", value: "1,247", change: "+12%", icon: TrendingUp },
  { label: "Active Cohorts", value: "8", change: "+2", icon: Dna },
  { label: "Risk Alerts", value: "3", change: "-1", icon: Shield },
  { label: "Models Trained", value: "42", change: "+5", icon: Activity },
];

const moduleStatus = [
  { id: "MOTF", label: "Tucker Decomposition", status: "complete", progress: 100, icon: Dna, color: "text-chart-cyan" },
  { id: "GBSC", label: "Survival Curves", status: "running", progress: 67, icon: Activity, color: "text-chart-magenta" },
  { id: "BCTN", label: "Clonal Dynamics", status: "queued", progress: 0, icon: FlaskConical, color: "text-chart-amber" },
  { id: "CNIS", label: "Neoantigen Intel", status: "complete", progress: 100, icon: Shield, color: "text-chart-emerald" },
  { id: "MSRS", label: "Risk Scoring", status: "running", progress: 34, icon: BarChart3, color: "text-chart-rose" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const OverviewPanel = () => (
  <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-6">
    {/* Header */}
    <motion.div variants={item}>
      <h1 className="text-2xl font-semibold text-foreground">TEMPEST Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">Tumor Evolution Mapping Platform for Ensemble Statistical Tracking</p>
    </motion.div>

    {/* Metric cards */}
    <motion.div variants={item} className="grid grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="module-card flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-semibold text-foreground mt-1 font-mono">{m.value}</p>
            <span className="text-xs text-chart-emerald flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" /> {m.change}
            </span>
          </div>
          <div className="p-2 rounded-md bg-primary/10">
            <m.icon className="w-4 h-4 text-primary" />
          </div>
        </div>
      ))}
    </motion.div>

    {/* Charts row */}
    <motion.div variants={item} className="grid grid-cols-3 gap-4">
      <div className="module-card col-span-1">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Kaplan-Meier Survival</h3>
        <SurvivalCurveChart />
      </div>
      <div className="module-card col-span-1">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Clonal Architecture</h3>
        <ClonalDynamicsChart />
      </div>
      <div className="module-card col-span-1">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Multi-Dimensional Risk</h3>
        <RiskRadar />
      </div>
    </motion.div>

    {/* Module pipeline */}
    <motion.div variants={item} className="module-card">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Pipeline Status</h3>
      <div className="space-y-3">
        {moduleStatus.map((mod) => (
          <div key={mod.id} className="flex items-center gap-4">
            <mod.icon className={`w-4 h-4 ${mod.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-foreground font-mono">{mod.id}</span>
                <span className="text-xs text-muted-foreground">{mod.label}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mod.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full rounded-full ${
                    mod.status === "complete" ? "bg-chart-emerald" : mod.status === "running" ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              </div>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                mod.status === "complete"
                  ? "bg-chart-emerald/10 text-chart-emerald"
                  : mod.status === "running"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {mod.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

export default OverviewPanel;
