import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Dna, Activity, FlaskConical, Shield, BarChart3, ArrowRight, Zap, Brain,
  Globe, Lock, GitBranch, Upload, Database, CheckCircle2, AlertTriangle,
  Loader2, FileText, Play,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTempest } from "@/contexts/TempestContext";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const modules = [
  { id: "motf", label: "MOTF", title: "Tucker Decomposition", desc: "Multi-modal tensor factorization across genomic, transcriptomic, and epigenomic layers.", icon: Dna, color: "text-chart-cyan", bg: "bg-chart-cyan/10" },
  { id: "gbsc", label: "GBSC", title: "Bayesian Survival Curves", desc: "Kaplan-Meier with Bayesian CIs, stratified by molecular subtypes and treatment arms.", icon: Activity, color: "text-chart-magenta", bg: "bg-chart-magenta/10" },
  { id: "immune", label: "Immune & Risk", title: "BCTN · CNIS · MSRS", desc: "Clonal dynamics, neoantigen intelligence, and multi-scale risk scoring in one tab.", icon: Shield, color: "text-chart-emerald", bg: "bg-chart-emerald/10" },
  { id: "predict", label: "Predictive", title: "Trajectory & TTI", desc: "Dynamical systems forecasting and fTTI topological transition prediction.", icon: GitBranch, color: "text-chart-magenta", bg: "bg-chart-magenta/10" },
];

const capabilities = [
  { icon: Zap, title: "Real-Time Pipeline", desc: "Run multi-module analyses with live progress tracking and instant result visualization." },
  { icon: Brain, title: "AI-Powered Agent", desc: "Natural language interface to query cohort data, trigger analyses, and interpret results." },
  { icon: Globe, title: "Multi-Cohort Support", desc: "Upload and manage multiple patient cohorts with CSV/TSV import and cross-cohort comparisons." },
  { icon: Lock, title: "Reproducible & Auditable", desc: "Every pipeline run is logged with full provenance — configurations, timestamps, versioned outputs." },
];

interface HomePanelProps {
  onNavigate: (module: string) => void;
}

interface QCReport {
  name: string;
  samples: number;
  columns: number;
  timepoints: string[];
  modalities: string[];
  missingPct: number;
  emptyRows: number;
  numericCols: number;
  warnings: string[];
  passed: boolean;
}

const HomePanel = ({ onNavigate }: HomePanelProps) => {
  const { saveCohort, refreshCohorts } = useTempest();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [qc, setQc] = useState<QCReport | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "tsv") {
      toast.error("Please upload a CSV or TSV file.");
      return;
    }
    setUploading(true);
    setQc(null);
    try {
      const text = await file.text();
      const sep = ext === "tsv" ? "\t" : ",";
      const lines = text.trim().split("\n").filter(Boolean);
      const headers = lines[0].split(sep).map((h) => h.trim());
      const rows = lines.slice(1).map((l) => l.split(sep));
      const sampleCount = rows.length;
      const colCount = headers.length;

      // QC metrics
      let missingCells = 0;
      let emptyRows = 0;
      let numericCols = 0;
      for (const r of rows) {
        const nonEmpty = r.filter((v) => v && v.trim() !== "" && v.trim().toLowerCase() !== "na");
        if (nonEmpty.length === 0) emptyRows++;
        missingCells += colCount - nonEmpty.length;
      }
      for (let c = 0; c < colCount; c++) {
        const sample = rows.slice(0, Math.min(50, rows.length)).map((r) => r[c]);
        const numeric = sample.filter((v) => v && !isNaN(parseFloat(v))).length;
        if (numeric / Math.max(sample.length, 1) > 0.8) numericCols++;
      }
      const totalCells = sampleCount * colCount;
      const missingPct = totalCells > 0 ? (missingCells / totalCells) * 100 : 0;

      const timepoints = headers.filter((h) => /^[dD]\d+/.test(h));
      const modalities = headers.filter((h) => !/^[dD]\d+/.test(h) && h.toLowerCase() !== "sample" && h.toLowerCase() !== "id");

      const warnings: string[] = [];
      if (sampleCount < 25) warnings.push(`Only ${sampleCount} samples — fTTI requires n ≥ 25 for valid topology.`);
      if (missingPct > 20) warnings.push(`${missingPct.toFixed(1)}% missing values — consider imputation.`);
      if (emptyRows > 0) warnings.push(`${emptyRows} empty rows detected.`);
      if (timepoints.length === 0) warnings.push("No D# timepoint columns found (e.g., D0, D44) — longitudinal modules will be limited.");
      if (numericCols < 2) warnings.push("Few numeric columns detected — verify the file is quantitative data.");

      const passed = warnings.length === 0 || (sampleCount >= 25 && missingPct < 20);

      // Upload to storage + save cohort
      const path = `${Date.now()}_${file.name}`;
      await supabase.storage.from("cohort-uploads").upload(path, file);
      await saveCohort({
        name: file.name.replace(/\.(csv|tsv)$/i, ""),
        samples: sampleCount,
        timepoints,
        modalities,
        tensor_shape: `T ∈ ℝ^(${sampleCount} × ${colCount})`,
        latent_factors: null,
        variance_explained: null,
      });
      await refreshCohorts();

      setQc({
        name: file.name,
        samples: sampleCount,
        columns: colCount,
        timepoints,
        modalities,
        missingPct,
        emptyRows,
        numericCols,
        warnings,
        passed,
      });
      toast.success(`Cohort uploaded — QC ${passed ? "passed" : "completed with warnings"}.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process file.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 p-6 max-w-5xl mx-auto">
      {/* Hero */}
      <motion.div variants={item} className="text-center pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono mb-6">
          <Dna className="w-3.5 h-3.5" /> Research framework — not a clinical tool
        </div>
        <h1 className="text-4xl font-semibold text-foreground tracking-tight leading-tight">
          State-separation &amp;<br />
          <span className="text-primary">transition-dynamics framework</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          Bring your own cohort or select a public dataset. TEMPEST runs QC then dispatches MOTF, GBSC, Immune &amp; Risk, and Predictive modules end-to-end. All outputs are retrospective; no prospective prediction or clinical use is claimed.
        </p>
        <div className="mt-4 inline-block border border-chart-amber/40 bg-chart-amber/5 rounded-md px-3 py-1.5 text-[11px] text-chart-amber font-mono">
          fTTI threshold is proof-of-concept only; not validated for clinical stratification.
        </div>
      </motion.div>

      {/* Get Started — two paths */}
      <motion.div variants={item}>
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Step 1 · Choose Your Data Source</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Path A: Upload */}
          <div className="module-card p-5 flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-md bg-chart-cyan/10 flex-shrink-0">
                <Upload className="w-5 h-5 text-chart-cyan" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Upload Your Cohort</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  CSV / TSV with samples × features. Automatic QC: missingness, sample size, timepoint detection, numeric integrity.
                </p>
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Running QC..." : "Upload CSV / TSV"}
            </button>
            <input ref={fileRef} type="file" accept=".csv,.tsv" className="hidden" onChange={handleFile} />
          </div>

          {/* Path B: Public data */}
          <div className="module-card p-5 flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-md bg-chart-emerald/10 flex-shrink-0">
                <Database className="w-5 h-5 text-chart-emerald" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Use Public Data</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Pull live from TCGA / GDC, cBioPortal, UniProt, or Ensembl. Tag as training data to feed downstream AI synthesis.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("datasources")}
              className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              <Globe className="w-4 h-4" /> Browse Public Sources
            </button>
          </div>
        </div>
      </motion.div>

      {/* QC report card */}
      {qc && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="module-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-md flex-shrink-0 ${qc.passed ? "bg-chart-emerald/10" : "bg-chart-amber/10"}`}>
                {qc.passed
                  ? <CheckCircle2 className="w-5 h-5 text-chart-emerald" />
                  : <AlertTriangle className="w-5 h-5 text-chart-amber" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> QC Report — {qc.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {qc.passed ? "Passed quality checks. Ready for analysis." : "Completed with warnings — review below."}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${qc.passed ? "bg-chart-emerald/15 text-chart-emerald" : "bg-chart-amber/15 text-chart-amber"}`}>
              {qc.passed ? "PASS" : "WARN"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Samples (n)", value: qc.samples, hint: qc.samples >= 25 ? "≥ n* = 25" : "below n* = 25" },
              { label: "Columns", value: qc.columns },
              { label: "Missing %", value: `${qc.missingPct.toFixed(1)}%` },
              { label: "Numeric cols", value: qc.numericCols },
              { label: "Timepoints", value: qc.timepoints.length || "—", hint: qc.timepoints.slice(0, 4).join(", ") },
              { label: "Modalities", value: qc.modalities.length },
              { label: "Empty rows", value: qc.emptyRows },
              { label: "Status", value: qc.passed ? "Ready" : "Review" },
            ].map((s) => (
              <div key={s.label} className="border border-border rounded-md p-3 bg-card/40">
                <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">{s.label}</div>
                <div className="text-base font-semibold text-foreground mt-1">{s.value}</div>
                {s.hint && <div className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">{s.hint}</div>}
              </div>
            ))}
          </div>

          {qc.warnings.length > 0 && (
            <div className="border border-chart-amber/30 bg-chart-amber/5 rounded-md p-3 mb-4">
              <div className="text-xs font-semibold text-chart-amber mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> QC Warnings
              </div>
              <ul className="text-xs text-foreground/80 space-y-1 list-disc list-inside">
                {qc.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate("motf")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Start with MOTF
            </button>
            <button onClick={() => onNavigate("overview")} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md text-xs font-medium hover:bg-muted transition-colors">
              <Zap className="w-3.5 h-3.5" /> Run Full Pipeline
            </button>
            <button onClick={() => onNavigate("chat")} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md text-xs font-medium hover:bg-muted transition-colors">
              <Brain className="w-3.5 h-3.5" /> Ask AI Agent
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2 — Analysis modules */}
      <motion.div variants={item}>
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Step 2 · Run Analyses</h2>
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

      {/* Capabilities */}
      <motion.div variants={item}>
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-4">Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </motion.div>
  );
};

export default HomePanel;
