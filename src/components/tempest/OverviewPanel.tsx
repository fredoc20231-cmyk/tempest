import { motion } from "framer-motion";
import NeuroblastomaFigures from "./charts/NeuroblastomaFigures";
import AnalysisSummaryFooter from "./AnalysisSummaryFooter";
import { moduleSummaries } from "./moduleSummaries";
import { Dna, Activity, FlaskConical, Shield, BarChart3, ArrowUpRight, TrendingUp, Download, RefreshCw, RotateCcw, FlaskRound } from "lucide-react";
import SurvivalCurveChart from "./charts/SurvivalCurveChart";
import ClonalDynamicsChart from "./charts/ClonalDynamicsChart";
import RiskRadar from "./charts/RiskRadar";
import { downloadChartAsPng } from "./utils/downloadUtils";
import { useTempest } from "@/contexts/TempestContext";
import { mapSurvivalData, mapClonalData, mapRadarData } from "@/lib/chartDataMapper";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
  const { pipelineRuns, analysisResults, cohorts, isLoading, resetPipeline } = useTempest();

  const completedCount = Object.values(analysisResults).filter(Boolean).length;
  const runningCount = pipelineRuns.filter((r) => r.status === "running").length;
  const alertCount = pipelineRuns.filter((r) => r.status === "failed").length;

  const gbscResults = analysisResults["gbsc"];
  const bctnResults = analysisResults["bctn"];
  const msrsResults = analysisResults["msrs"];

  const handleRetry = async (module: string) => {
    toast.info(`Retrying ${module.toUpperCase()}...`);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ module }),
      });
    } catch {
      toast.error("Retry failed.");
    }
  };

  const handleReset = async (module: string) => {
    await resetPipeline(module);
    toast.success(`${module.toUpperCase()} reset to idle.`);
  };

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
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="module-card">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))
          : metrics.map((m) => (
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
          {isLoading ? <Skeleton className="h-[220px] w-full" /> : <SurvivalCurveChart data={mapSurvivalData(gbscResults?.results)} />}
        </ChartCard>
        <ChartCard id="chart-clonal" title="Clonal Architecture">
          {isLoading ? <Skeleton className="h-[220px] w-full" /> : <ClonalDynamicsChart data={mapClonalData(bctnResults?.results)} />}
        </ChartCard>
        <ChartCard id="chart-risk" title="Multi-Dimensional Risk">
          {isLoading ? <Skeleton className="h-[220px] w-full" /> : <RiskRadar data={mapRadarData(msrsResults?.results)} />}
        </ChartCard>
      </motion.div>

      <motion.div variants={item}>
        <NeuroblastomaFigures />
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
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-4 h-4 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              ))
            : pipelineRuns.map((mod) => {
                const Icon = moduleIcons[mod.module] || Activity;
                const color = moduleColors[mod.module] || "text-muted-foreground";
                const label = moduleLabels[mod.module] || mod.module;
                const isFailed = mod.status === "failed";
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
                    {isFailed && (
                      <div className="flex gap-1">
                        <button onClick={() => handleRetry(mod.module)} className="p-1 rounded hover:bg-chart-amber/10 text-chart-amber" title="Retry">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleReset(mod.module)} className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Reset">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          {!isLoading && pipelineRuns.length === 0 && (
            <div className="text-center py-8">
              <FlaskRound className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-mono">No pipeline runs yet</p>
              <p className="text-xs text-muted-foreground mt-1">Navigate to a module and run your first analysis to see pipeline status.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Analysis Summary Footer */}
      <AnalysisSummaryFooter
        title={moduleSummaries.overview.title}
        objective={moduleSummaries.overview.objective}
        accomplishments={moduleSummaries.overview.accomplishments}
        significance={moduleSummaries.overview.significance}
        nextStep={{ label: moduleSummaries.overview.nextLabel! }}
      />
    </motion.div>
  );
};

export default OverviewPanel;
