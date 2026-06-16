import { motion } from "framer-motion";
import { useState } from "react";
import { useTempest } from "@/contexts/TempestContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, CheckCircle2, AlertTriangle, Clock, ArrowRight, Dna, Activity, FlaskConical, Shield, BarChart3, Lightbulb, GitBranch } from "lucide-react";
import { downloadHtmlReport } from "./utils/downloadUtils";
import { downloadReproBundle } from "@/lib/export/reproducibilityReport";
import { DISCLAIMER_FTTI, DISCLAIMER_SCOPE, TEMPEST_VERSION } from "@/lib/scopeConfig";
import { EvidenceBadge, type EvidenceType } from "./EvidenceBadge";
import { evaluatePublicationGate } from "@/lib/export/publicationGate";
import { evaluateExportSafety, DRAFT_AUDIT_WATERMARK } from "@/lib/audit/claimAudit";
import { toast } from "@/hooks/use-toast";

const moduleOrder = ["motf", "gbsc", "bctn", "cnis", "msrs", "trajectory"] as const;

const moduleEvidence: Record<string, EvidenceType> = {
  motf: "longitudinal-trajectory",
  gbsc: "endpoint-comparison",
  bctn: "longitudinal-trajectory",
  cnis: "endpoint-comparison",
  msrs: "longitudinal-trajectory",
  trajectory: "longitudinal-trajectory",
};

const reviewerSafeFor = (e: EvidenceType): string =>
  e === "endpoint-comparison"
    ? "This quantifies established state separation, not transition prediction."
    : e === "longitudinal-trajectory"
    ? "Retrospective trajectory evidence; not prospective prediction."
    : e === "prospective-prediction"
    ? "Reserved: only valid with user-supplied time-course outcome labels."
    : "Synthetic ground truth; method validation only.";

function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows
    .map((r) => r.map((c) => {
      const s = c == null ? "" : String(c);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\n");
  const a = document.createElement("a");
  a.download = filename;
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.click();
  URL.revokeObjectURL(a.href);
}

const moduleMeta: Record<string, { title: string; icon: any; purpose: string }> = {
  motf: { title: "MOTF — Multi-Omic Tensor Factorization", icon: Dna, purpose: "Decomposes multi-omic data into latent factors that capture cross-modal variance and correlate with disease stage." },
  gbsc: { title: "GBSC — Gradient-Boosted Stage Classifier", icon: Activity, purpose: "Classifies tumor stage from latent factors + curated features using ensemble gradient boosting with SHAP explainability." },
  bctn: { title: "BCTN — Bayesian Clonal Trajectory Networks", icon: FlaskConical, purpose: "Models subclonal architecture and tracks clonal consolidation over longitudinal timepoints." },
  cnis: { title: "CNIS — Comprehensive Neoantigen Intelligence System", icon: Shield, purpose: "Identifies and ranks candidate neoantigens via multi-modal filtering, MHC binding prediction, and cross-species validation tiers." },
  msrs: { title: "MSRS — Multi-Scale Risk Stratification", icon: BarChart3, purpose: "Integrates all upstream module outputs into a unified risk profile with bootstrap confidence intervals." },
  trajectory: { title: "Trajectory Prediction — Dynamical Systems Framework", icon: GitBranch, purpose: "Models cancer evolution as stochastic gradient flow on an epigenetic landscape, predicting bifurcation points where tumors transition from single to multi-attractor systems." },
};

const defaultInterpretations: Record<string, string> = {
  motf: "Tensor factorization resolved 12 latent factors explaining 92.3% of cross-modal variance. LF1 shows strong stage correlation (r = 0.94, p < 10⁻⁶), suggesting a dominant axis of disease progression captured across RNA-seq, WES, and spatial modalities.",
  gbsc: "Stage classification achieved 94.7% accuracy (macro-F1 = 0.93) under leave-one-timepoint-out cross-validation. SHAP analysis highlights LF1 and immune-related features as top contributors, confirming biological relevance of the latent space.",
  bctn: "Clonal architecture analysis shows branched topology at D52 (5 clusters) consolidating to 1–2 dominant lineages by D122. This pattern is consistent with selective sweeps under immune or therapeutic pressure.",
  cnis: "Database-validated analysis of 4,499 neoantigen candidates (11 mutation-derived + 4,488 fusion-derived) across D0–D122. COSMIC cross-validation confirms 4/6 target genes. MEIS1 F378X (Tier 1, 23.07% WB) shows persistent trunk expression with 19% human immunogenicity and CD8+ T-cell recruitment via CCL18/CCL4/CXCL7. Top fusion targets: Camk1d::Arid1a (0.519% WB, ARID1A mutated in 46-70% of clear cell OC), Mfhas1::Tns3 (0.133% SB, strongest binder), Nsd3::Kat6a (both COSMIC-validated histone modifiers). Fusion landscape peaks at D88 (104 events, 52 high-confidence) then consolidates, consistent with BCTN clonal sweep dynamics. RNA/WES integration validates 993 H-2-Db binders with expression confirmation (ARID1A ↑3.4-fold FDR<0.001).",
  msrs: "Composite risk scoring integrates all upstream modules. Bootstrap confidence intervals (n=1,000) show narrowing uncertainty at later timepoints, consistent with clonal consolidation. Overall risk trajectory supports escalating intervention at the D52–D75 window.",
  trajectory: "Dynamical systems analysis identifies a supercritical pitchfork bifurcation at the D88–99 window. Transcriptomic entropy S(t) peaks at Day 99, consistent with maximum heterogeneity at the branch point. Early warning signals (variance increase 2.4×, rising autocorrelation) are detected at D88, supporting approach to critical transition. Post-bifurcation, the system occupies two distinct attractors corresponding to immune-evasive and proliferative programs. The epigenetic barrier U(x) drops below the critical threshold during the transitional phase, enabling stochastic commitment to divergent fates.",
};

const nextSteps = [
  "Synthesize top neoantigen peptides (MEIS1 TFFFXXMVLF, Camk1d::Arid1a AVLRNHPVQWI, Mfhas1::Tns3 HAFPGDDPI) and wild-type controls for MHC binding validation (IC50 < 500 nM).",
  "Run H-2-Db/Kb competitive binding assays with stability testing (>4 hours) for all 8 high-priority candidates.",
  "Perform C57BL/6 splenocyte immunogenicity testing: ELISpot (IFN-γ, IL-2, TNF-α) targeting >100 SFC/10⁶ cells and CD8+ flow cytometry (>2-fold activation).",
  "Search COSMIC/FusionGDB/TumorFusions for human equivalents of Camk1d::Arid1a and Nsd3::Kat6a fusions (60-80% success probability).",
  "Validate ARID1A fusion neoantigen in ARID1A-mutant clear cell OC patient samples (46-70% frequency provides large validation cohort).",
  "Generate patient-specific MSRS risk trajectories integrating validated CNIS neoantigen data to guide personalized vaccine timing relative to D88-99 bifurcation window.",
  "Design combination protocol: PRPS1-engineered CAR-T + pyrimidine support (cytidine/uridine) + MEIS1 neoantigen vaccine timed to pre-bifurcation window.",
  "Sequence 50+ HGSOC patient tumors (RNA-seq) for novel fusion discovery to expand human translation candidates (40-60% success probability).",
];

const ReportPanel = () => {
  const { pipelineRuns, analysisResults, cohorts, isLoading } = useTempest();
  const [topology, setTopology] = useState<"VR" | "GCT">("VR");

  const getFTTI = (mod: string): { primary: number | null; gct: number | null; zL_VR: number | null; zL_GCT: number | null } => {
    const r = (analysisResults[mod]?.results as any) || {};
    const metadata = (analysisResults[mod] as any)?.metadata || {};
    return {
      primary: r.fTTI_primary ?? metadata.fTTI_primary ?? r.tti_score ?? metadata.tti_score ?? null,
      gct: r.fTTI_GCT ?? metadata.fTTI_GCT ?? null,
      zL_VR: r.z?.zL_VR ?? metadata.zL_VR ?? null,
      zL_GCT: r.z?.zL ?? metadata.zL_GCT ?? null,
    };
  };

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
        <div className="flex gap-2">
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
          <button
            onClick={() =>
              downloadReproBundle({
                seed: 42,
                kNN: 12,
                nullReps: 50,
                bsReps: 50,
                topologyPrimary: topology,
                cohortName: cohorts[0]?.name,
                cohortSource: cohorts[0] ? "USER-UPLOADED" : "DEMO/SYNTHETIC",
                nPerCondition: cohorts[0]?.samples,
                validityWarning: cohorts[0] && cohorts[0].samples < 25 ? `n=${cohorts[0].samples} < 25` : undefined,
                modules: moduleOrder.map((m) => ({
                  module: m,
                  evidenceType: moduleEvidence[m],
                  provenance: analysisResults[m] ? "COMPUTED" : "PENDING VERIFICATION",
                })),
              })
            }
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" /> Methods + Repro
          </button>
          <button
            onClick={() => {
              const nP = cohorts[0]?.samples ?? null;
              const validity = nP != null && nP < 25 ? `n=${nP} < 25 (composite suppressed)` : "OK";
              const header = [
                "module", "fTTI_primary", "fTTI_GCT", "zL_VR", "zL_GCT",
                "topology_primary", "validity_status", "evidence_type", "provenance",
              ];
              const rows = moduleOrder.map((m) => {
                const f = getFTTI(m);
                return [
                  m,
                  f.primary != null ? f.primary.toFixed(4) : "",
                  f.gct != null ? f.gct.toFixed(4) : "",
                  f.zL_VR != null ? f.zL_VR.toFixed(4) : "",
                  f.zL_GCT != null ? f.zL_GCT.toFixed(4) : "",
                  topology === "VR" ? "VR-PH (Ripser-style H1)" : "GCT (graph cycle approximation)",
                  validity,
                  moduleEvidence[m],
                  analysisResults[m] ? "COMPUTED" : "PENDING VERIFICATION",
                ];
              });
              downloadCsv("tempest_module_scores.csv", [header, ...rows]);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => {
              const cohort = cohorts[0] as any;
              const allComplete = completedModules.length === moduleOrder.length;
              const gate = evaluatePublicationGate({
                dataset_accession: cohort?.accession ?? cohort?.dataset_accession ?? null,
                data_source: cohort?.source ?? cohort?.data_source ?? null,
                primary_data_available: cohort?.primary_data_available === true,
                code_available: cohort?.code_available === true,
                computation_status: allComplete ? "COMPLETE" : "PENDING",
              });
              // Audit all narrative text + interpretations under the dominant evidence context.
              const corpus = [
                ...moduleOrder.map((m) => `${moduleMeta[m]?.purpose ?? ""} ${getInterpretation(m) ?? ""}`),
                ...nextSteps,
              ].join("\n");
              const audit = evaluateExportSafety(corpus, {
                evidence_type: "longitudinal",
                lead_time: null,
                longitudinal_data: true,
                immunogenicity_validated: false,
              });
              const blockers = [...gate.blockers];
              if (!audit.publicationReady) {
                blockers.push(`claim-audit: ${audit.audit.blockingPhrases.join(", ") || "auto-replaceable phrases present"}`);
              }
              if (blockers.length > 0) {
                toast({
                  title: "Publication-ready export blocked",
                  description: `${DRAFT_AUDIT_WATERMARK} Blockers: ${blockers.join("; ")}`,
                  variant: "destructive",
                });
                return;
              }
              toast({ title: "Publication-ready", description: "Metadata complete and claim audit clean. Use Export HTML / CSV / Methods to build the bundle." });
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" /> Publication-ready
          </button>
        </div>
      </div>

      {/* Scope disclaimer */}
      <div className="module-card border-chart-amber/30 bg-chart-amber/5">
        <p className="text-xs text-chart-amber font-mono font-semibold mb-1">Scope &amp; disclaimers ({TEMPEST_VERSION})</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{DISCLAIMER_SCOPE}</p>
        <p className="text-xs text-foreground/80 leading-relaxed mt-1">{DISCLAIMER_FTTI}</p>
      </div>

      {/* Methods — topology */}
      <div className="module-card border-primary/20">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wide">Methods — Topology channel</h2>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-mono">topology_primary: VR-PH (Ripser-style H1)</span>. Composite{" "}
              <span className="font-mono">fTTI = z_B + z_L^VR + z_N</span>. The GCT channel is retained as a fast graph-cycle approximation and is not the manuscript score.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-secondary/50 rounded-md p-0.5 flex-shrink-0">
            <button onClick={() => setTopology("VR")} className={`text-[10px] font-mono px-2 py-1 rounded ${topology === "VR" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>VR-PH</button>
            <button onClick={() => setTopology("GCT")} className={`text-[10px] font-mono px-2 py-1 rounded ${topology === "GCT" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>GCT</button>
          </div>
        </div>
        {topology === "GCT" && (
          <p className="text-[11px] font-mono text-chart-amber mt-2">
            ⚠ Approximation only; not primary manuscript score. Manuscript values must be reported from VR-PH.
          </p>
        )}
      </div>

      {/* Executive Summary */}
      <div className="module-card border-primary/20">
        <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wide mb-3">Executive Summary</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This report summarizes the TEMPEST state-separation and transition-dynamics analysis across {moduleOrder.length} modules.{" "}
          <span className="text-chart-emerald font-mono">{completedModules.length} completed</span>
          {failedModules.length > 0 && <>, <span className="text-destructive font-mono">{failedModules.length} failed</span></>}
          {pendingModules.length > 0 && <>, <span className="text-muted-foreground font-mono">{pendingModules.length} pending</span></>}
          . All evidence is endpoint or longitudinal; no prospective prediction is claimed.
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
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {statusIcon(mod)}
                <meta.icon className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-mono font-semibold text-foreground">{meta.title}</h3>
                <EvidenceBadge type={moduleEvidence[mod]} />
              </div>

              <p className="text-xs text-muted-foreground mb-2">{meta.purpose}</p>

              <p className="text-[11px] font-mono text-muted-foreground bg-secondary/30 border-l-2 border-chart-cyan/40 px-3 py-1 rounded-sm mb-3">
                {reviewerSafeFor(moduleEvidence[mod])}
              </p>

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

      {/* Appendix — Reproducibility & Claim Audit */}
      {(() => {
        const cohort = cohorts[0] as any;
        const allComplete = completedModules.length === moduleOrder.length;
        const gate = evaluatePublicationGate({
          dataset_accession: cohort?.accession ?? cohort?.dataset_accession ?? null,
          data_source: cohort?.source ?? cohort?.data_source ?? null,
          primary_data_available: cohort?.primary_data_available === true,
          code_available: cohort?.code_available === true,
          computation_status: allComplete ? "COMPLETE" : "PENDING",
        });
        const corpus = [
          ...moduleOrder.map((m) => `${moduleMeta[m]?.purpose ?? ""} ${getInterpretation(m) ?? ""}`),
          ...nextSteps,
        ].join("\n");
        const audit = evaluateExportSafety(corpus, {
          evidence_type: "longitudinal",
          lead_time: null,
          longitudinal_data: true,
          immunogenicity_validated: false,
        });
        const nP = cohorts[0]?.samples ?? null;
        const validity = nP != null && nP < 25 ? `INSUFFICIENT (n=${nP} < 25)` : "OK";
        const rows: [string, string][] = [
          ["Evidence type", "longitudinal-trajectory (endpoint per-module)"],
          ["Provenance", cohort ? "USER-UPLOADED" : "DEMO/SYNTHETIC"],
          ["Validity status", validity],
          ["Topology primary", topology === "VR" ? "VR-PH (Ripser-style H1)" : "GCT (approximation)"],
          ["Threshold status", "proof-of-concept; not validated for clinical stratification"],
          ["Missing metadata", gate.blockers.length ? gate.blockers.join("; ") : "—"],
          [
            "Claim audit result",
            audit.publicationReady
              ? "CLEAN"
              : `BLOCKED — ${audit.audit.blockingPhrases.join(", ") || "auto-replaceable phrases present"}`,
          ],
        ];
        return (
          <div className="module-card border-primary/20">
            <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wide mb-3">
              Appendix · Reproducibility &amp; Claim Audit
            </h2>
            <table className="w-full text-xs">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-muted-foreground uppercase w-56">{k}</td>
                    <td className="py-1.5 text-foreground/90 font-mono text-[11px]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!audit.publicationReady && (
              <p className="text-[11px] text-chart-amber mt-2 font-mono">
                ⚠ {DRAFT_AUDIT_WATERMARK} Draft export remains available; resolve flagged phrases on the Claim Audit panel before publication.
              </p>
            )}
          </div>
        );
      })()}
      <div className="text-center py-4 border-t border-border">
        <p className="text-[10px] font-mono text-muted-foreground">
          TEMPEST v2.1.0 · Tumor Evolution Mapping Platform for Ensemble Statistical Tracking · Report generated {now}
        </p>
      </div>
    </motion.div>
  );
};

export default ReportPanel;
