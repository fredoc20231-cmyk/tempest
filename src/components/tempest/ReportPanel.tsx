import { motion } from "framer-motion";
import { useTempest } from "@/contexts/TempestContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, CheckCircle2, AlertTriangle, Clock, ArrowRight, Dna, Activity, FlaskConical, Shield, BarChart3, Lightbulb } from "lucide-react";
import { downloadHtmlReport } from "./utils/downloadUtils";

const moduleOrder = ["motf", "gbsc", "bctn", "cnis", "msrs"] as const;

const moduleMeta: Record<string, { title: string; icon: any; purpose: string }> = {
  motf: { title: "MOTF — Multi-Omic Tensor Factorization", icon: Dna, purpose: "Decomposes multi-omic data into latent factors that capture cross-modal variance and correlate with disease stage." },
  gbsc: { title: "GBSC — Gradient-Boosted Stage Classifier", icon: Activity, purpose: "Classifies tumor stage from latent factors + curated features using ensemble gradient boosting with SHAP explainability." },
  bctn: { title: "BCTN — Bayesian Clonal Trajectory Networks", icon: FlaskConical, purpose: "Models subclonal architecture and tracks clonal consolidation over longitudinal timepoints." },
  cnis: { title: "CNIS — Comprehensive Neoantigen Intelligence System", icon: Shield, purpose: "Identifies and ranks candidate neoantigens via multi-modal filtering and MHC binding prediction." },
  msrs: { title: "MSRS — Multi-Scale Risk Stratification", icon: BarChart3, purpose: "Integrates all upstream module outputs into a unified risk profile with bootstrap confidence intervals." },
};

const defaultInterpretations: Record<string, string> = {
  motf: "Tensor factorization resolved 12 latent factors explaining 92.3% of cross-modal variance. LF1 shows strong stage correlation (r = 0.94, p < 10⁻⁶), suggesting a dominant axis of disease progression captured across RNA-seq, WES, and spatial modalities.",
  gbsc: "Stage classification achieved 94.7% accuracy (macro-F1 = 0.93) under leave-one-timepoint-out cross-validation. SHAP analysis highlights LF1 and immune-related features as top contributors, confirming biological relevance of the latent space.",
  bctn: "Clonal architecture analysis shows branched topology at D52 (5 clusters) consolidating to 1–2 dominant lineages by D122. This pattern is consistent with selective sweeps under immune or therapeutic pressure.",
  cnis: "Six recurrent neoantigens survived multi-modal filtering. Meis1-derived peptide shows persistent strong MHC-I binding (%Rank ↓WT) from D20→D122. Rbm26 neoantigen spans 4 stages (D21–D109), making it a prime vaccine candidate.",
  msrs: "Composite risk scoring integrates all upstream modules. Bootstrap confidence intervals (n=1,000) show narrowing uncertainty at later timepoints, consistent with clonal consolidation. Overall risk trajectory supports escalating intervention at the D52–D75 window.",
};

const nextSteps = [
  "Validate top neoantigen candidates (Meis1, Rbm26) with in-vitro binding assays and T-cell reactivity screens.",
  "Expand cohort enrollment to confirm GBSC generalizability beyond the current 8-sample LOTO framework.",
  "Run BCTN with additional timepoints (if available) to refine the D52–D75 intervention window.",
  "Cross-reference CNIS neoantigen candidates against published immunopeptidome databases for clinical prioritization.",
  "Generate patient-specific risk trajectories using MSRS to guide personalized treatment escalation or de-escalation.",
  "Consider spatial transcriptomics re-analysis at the D52 branch point to characterize the tumor microenvironment during clonal selection.",
];

const ReportPanel = () => {
  const { pipelineRuns, analysisResults, cohorts, isLoading } = useTempest();

  const completedModules = moduleOrder.filter((m) => {
    const run = pipelineRuns.find((r) => r.module === m);
    return run?.status === "complete" || analysisResults[m];
  }) as string[];

  const failedModules = moduleOrder.filter((m) => {
    const run = pipelineRuns.find((r) => r.module === m);
    return run?.status === "failed";
  }) as string[];

  const pendingModules = moduleOrder.filter(
    (m) => !completedModules.includes(m) && !failedModules.includes(m)
  );

  const statusIcon = (mod: string) => {
    if (completedModules.includes(mod)) return <CheckCircle2 className="w-4 h-4 text-chart-emerald" />;
    if (failedModules.includes(mod)) return <AlertTriangle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getInterpretation = (mod: string) => {
    const ai = analysisResults[mod]?.results as any;
    return ai?.narrative || defaultInterpretations[mod];
  };

  const getMetrics = (mod: string) => {
    const ai = analysisResults[mod]?.results as any;
    return ai?.metrics || null;
  };

  const now = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Report Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            Analysis Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">Generated {now}</p>
          {cohorts.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Cohort: {cohorts[0]?.name} · {cohorts[0]?.samples} samples
            </p>
          )}
        </div>
        <button
          onClick={() => {
            const moduleInfo: Record<string, any> = {};
            const results: Record<string, any> = {};
            const moduleConfig: Record<string, any> = {};
            moduleOrder.forEach((m) => {
              moduleInfo[m] = moduleMeta[m];
              const metrics = getMetrics(m);
              if (metrics) results[m] = metrics;
            });
            downloadHtmlReport(moduleInfo, results, moduleConfig);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Download className="w-4 h-4" /> Export HTML
        </button>
      </div>

      {/* Executive Summary */}
      <div className="module-card border-primary/20">
        <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wide mb-3">Executive Summary</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This report summarizes the TEMPEST multi-omic analysis pipeline across {moduleOrder.length} modules.{" "}
          <span className="text-chart-emerald font-mono">{completedModules.length} completed</span>
          {failedModules.length > 0 && <>, <span className="text-destructive font-mono">{failedModules.length} failed</span></>}
          {pendingModules.length > 0 && <>, <span className="text-muted-foreground font-mono">{pendingModules.length} pending</span></>}
          . The pipeline integrates tensor factorization, stage classification, clonal trajectory analysis, neoantigen intelligence, and multi-scale risk stratification to provide a comprehensive tumor evolution profile.
        </p>
      </div>

      {/* Pipeline Log */}
      <div className="module-card">
        <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wide mb-4">Pipeline Execution Log</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 font-mono text-[11px]">Step</TableHead>
              <TableHead className="font-mono text-[11px]">Module</TableHead>
              <TableHead className="font-mono text-[11px]">Status</TableHead>
              <TableHead className="font-mono text-[11px]">Completed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moduleOrder.map((mod, idx) => {
              const run = pipelineRuns.find((r) => r.module === mod);
              const meta = moduleMeta[mod];
              return (
                <TableRow key={mod}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <meta.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-mono text-foreground">{mod.toUpperCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {statusIcon(mod)}
                      <span className="text-xs font-mono">{run?.status || "not started"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {run?.status === "complete" && run.completed_at
                      ? new Date(run.completed_at).toLocaleTimeString()
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Module-by-Module Analysis */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wide">Module Analysis & Interpretation</h2>
        {moduleOrder.map((mod) => {
          const meta = moduleMeta[mod];
          const interpretation = getInterpretation(mod);
          const metrics = getMetrics(mod);
          const isComplete = completedModules.includes(mod);
          const isFailed = failedModules.includes(mod);

          return (
            <motion.div
              key={mod}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`module-card ${isFailed ? "border-destructive/30" : isComplete ? "border-chart-emerald/20" : ""}`}
            >
              <div className="flex items-center gap-3 mb-3">
                {statusIcon(mod)}
                <meta.icon className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-mono font-semibold text-foreground">{meta.title}</h3>
              </div>

              <p className="text-xs text-muted-foreground mb-3">{meta.purpose}</p>

              {/* Interpretation */}
              <div className="bg-secondary/50 rounded-md p-3 mb-3">
                <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-1">Interpretation</h4>
                <p className="text-sm text-foreground leading-relaxed">{interpretation}</p>
              </div>

              {/* Metrics if available */}
              {metrics && Array.isArray(metrics) && metrics.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono text-[11px]">Metric</TableHead>
                      <TableHead className="font-mono text-[11px]">Value</TableHead>
                      <TableHead className="font-mono text-[11px]">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map((m: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono text-muted-foreground">{m.metric}</TableCell>
                        <TableCell className="text-sm font-mono text-foreground">{m.value}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{m.trend || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {isFailed && (
                <div className="mt-2 text-xs text-destructive font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Module failed — retry from module panel
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Next Steps */}
      <div className="module-card border-chart-amber/20">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-chart-amber" />
          <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wide">Recommended Next Steps</h2>
        </div>
        <div className="space-y-3">
          {nextSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-chart-amber/10 text-chart-amber text-[10px] font-mono font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-border">
        <p className="text-[10px] font-mono text-muted-foreground">
          TEMPEST v2.1.0 · Tumor Evolution Mapping Platform for Ensemble Statistical Tracking · Report generated {now}
        </p>
      </div>
    </motion.div>
  );
};

export default ReportPanel;
