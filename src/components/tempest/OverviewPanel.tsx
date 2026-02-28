import { motion } from "framer-motion";
import { Dna, Activity, FlaskConical, Shield, BarChart3, ArrowUpRight, TrendingUp, Download } from "lucide-react";
import SurvivalCurveChart from "./charts/SurvivalCurveChart";
import ClonalDynamicsChart from "./charts/ClonalDynamicsChart";
import RiskRadar from "./charts/RiskRadar";
import { downloadChartAsPng } from "./utils/downloadUtils";
import { useTempest } from "@/contexts/TempestContext";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const moduleIcons: Record<string, any> = {
  motf: Dna,
  gbsc: Activity,
  bctn: FlaskConical,
  cnis: Shield,
  msrs: BarChart3,
};

const moduleLabels: Record<string, string> = {
  motf: "Tucker Decomposition",
  gbsc: "Survival Curves",
  bctn: "Clonal Dynamics",
  cnis: "Neoantigen Intel",
  msrs: "Risk Scoring",
};

const moduleColors: Record<string, string> = {
  motf: "text-chart-cyan",
  gbsc: "text-chart-magenta",
  bctn: "text-chart-amber",
  cnis: "text-chart-emerald",
  msrs: "text-chart-rose",
};

const ChartCard = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <div className="module-card col-span-1">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{title}</h3>
      <button
        onClick={() => downloadChartAsPng(id, title.replace(/\s+/g, "_"))}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary rounded border border-border hover:border-primary/40 transition-colors"
      >
        <Download className="w-3 h-3" /> PNG
      </button>
    </div>
    <div id={id}>{children}</div>
  </div>
);

const OverviewPanel = () => {
  const { pipelineRuns, analysisResults, cohorts } = useTempest();

  const completedCount = Object.values(analysisResults).filter(Boolean).length;
  const runningCount = pipelineRuns.filter((r) => r.status === "running").length;
  const alertCount = pipelineRuns.filter((r) => r.status === "failed").length;

  const metrics = [
    { label: "Analyses Run", value: String(completedCount), change: completedCount > 0 ? `+${completedCount}` : "—", icon: TrendingUp },
    { label: "Active Cohorts", value: String(cohorts.length), change: cohorts.length > 0 ? `+${cohorts.length}` : "—", icon: Dna },
    { label: "Running", value: String(runningCount), change: runningCount > 0 ? "active" : "idle", icon: Activity },
    { label: "Alerts", value: String(alertCount), change: alertCount > 0 ? "!" : "clear", icon: Shield },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-semibold text-foreground">TEMPEST Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Tumor Evolution Mapping Platform for Ensemble Statistical Tracking</p>
      </motion.div>

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

      <motion.div variants={item} className="grid grid-cols-3 gap-4">
        <ChartCard id="chart-survival" title="Kaplan-Meier Survival">
          <SurvivalCurveChart />
        </ChartCard>
        <ChartCard id="chart-clonal" title="Clonal Architecture">
          <ClonalDynamicsChart />
        </ChartCard>
        <ChartCard id="chart-risk" title="Multi-Dimensional Risk">
          <RiskRadar />
        </ChartCard>
      </motion.div>

      <motion.div variants={item} className="module-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Pipeline Status</h3>
          <button
            onClick={() => {
              const header = "Module,Label,Status,Progress\n";
              const rows = pipelineRuns.map((m) => `"${m.module}","${moduleLabels[m.module] || m.module}","${m.status}","${m.progress}%"`).join("\n");
              const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
              const a = document.createElement("a");
              a.download = "pipeline_status.csv";
              a.href = URL.createObjectURL(blob);
              a.click();
            }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary rounded border border-border hover:border-primary/40 transition-colors"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
        <div className="space-y-3">
          {pipelineRuns.map((mod) => {
            const Icon = moduleIcons[mod.module] || Activity;
            const color = moduleColors[mod.module] || "text-muted-foreground";
            const label = moduleLabels[mod.module] || mod.module;
            return (
              <div key={mod.module} className="flex items-center gap-4">
                <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground font-mono">{mod.module.toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mod.progress}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className={`h-full rounded-full ${
                        mod.status === "complete" ? "bg-chart-emerald" : mod.status === "running" ? "bg-primary" : mod.status === "failed" ? "bg-destructive" : "bg-muted-foreground/30"
                      }`}
                    />
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  mod.status === "complete" ? "bg-chart-emerald/10 text-chart-emerald" :
                  mod.status === "running" ? "bg-primary/10 text-primary" :
                  mod.status === "failed" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {mod.status.toUpperCase()}
                </span>
              </div>
            );
          })}
          {pipelineRuns.length === 0 && (
            <p className="text-xs text-muted-foreground font-mono">No pipeline data yet. Run an analysis to see status.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OverviewPanel;
