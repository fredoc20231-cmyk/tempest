import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Database, Download, Search, Save, Loader2, Tag, Trash2, RefreshCw, Globe, FlaskConical, Brain, Zap, BookOpen, Play, Sparkles, Activity } from "lucide-react";
import AnalysisSummaryFooter from "./AnalysisSummaryFooter";
import { moduleSummaries } from "./moduleSummaries";
import { supabase } from "@/integrations/supabase/client";
import { useTempest } from "@/contexts/TempestContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface Dataset {
  id: string;
  name: string;
  source: string;
  source_id: string | null;
  category: string;
  description: string | null;
  data: any;
  record_count: number;
  metadata: any;
  is_training: boolean;
  created_at: string;
}

const SOURCES = [
  { id: "tcga", label: "TCGA / GDC", desc: "The Cancer Genome Atlas — genomic, clinical, mutation data", color: "text-chart-cyan", bg: "bg-chart-cyan/10" },
  { id: "cbioportal", label: "cBioPortal", desc: "Cancer genomics portal — studies, mutations, gene panels", color: "text-chart-magenta", bg: "bg-chart-magenta/10" },
  { id: "uniprot", label: "UniProt", desc: "Universal Protein Resource — protein sequences & annotations", color: "text-chart-amber", bg: "bg-chart-amber/10" },
  { id: "ensembl", label: "Ensembl", desc: "Genome browser — gene lookups, annotations, variants", color: "text-chart-emerald", bg: "bg-chart-emerald/10" },
];

const CATEGORIES: Record<string, string[]> = {
  tcga: ["projects", "mutations", "genes", "cases"],
  cbioportal: ["studies", "genes", "mutations"],
  uniprot: ["search"],
  ensembl: ["lookup"],
};

const DataSourcesPanel = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedSource, setSelectedSource] = useState("tcga");
  const [selectedCategory, setSelectedCategory] = useState("projects");
  const [query, setQuery] = useState("");
  const [saveToDb, setSaveToDb] = useState(true);
  const [markTraining, setMarkTraining] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"fetch" | "saved" | "learn" | "predict">("fetch");
  const [learning, setLearning] = useState(false);
  const [learnResult, setLearnResult] = useState<any>(null);
  const [autoRunPipeline, setAutoRunPipeline] = useState(true);
  const [scenario, setScenario] = useState("");
  const [moduleStatus, setModuleStatus] = useState<Record<string, "idle" | "start" | "done" | "error">>({});
  const { runFullPipeline, pipelineRunning, lastSynthesis } = useTempest();
  const debounceRef = useRef<number | null>(null);

  const refreshDatasets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("datasets").select("*").order("created_at", { ascending: false });
    if (data) setDatasets(data as Dataset[]);
    setLoading(false);
  }, []);

  useEffect(() => { refreshDatasets(); }, [refreshDatasets]);

  useEffect(() => {
    setSelectedCategory(CATEGORIES[selectedSource]?.[0] || "projects");
  }, [selectedSource]);

  const handleFetch = async () => {
    setFetching(true);
    setPreviewData(null);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-public-data", {
        body: { source: selectedSource, query, category: selectedCategory, save: saveToDb, is_training: markTraining },
      });
      if (error) throw error;
      setPreviewData(data);
      if (saveToDb) await refreshDatasets();
      toast.success(`Fetched ${data.record_count} records from ${data.source}`);
      if (saveToDb) triggerAutoPipeline();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to fetch data");
    }
    setFetching(false);
  };

  const handleAutoLearn = async () => {
    setLearning(true);
    setLearnResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("auto-learn", { body: {} });
      if (error) throw error;
      setLearnResult(data);
      await refreshDatasets();
      toast.success(`Self-learning complete: ${data.fetched} new datasets ingested, ${data.total_training} total training sources`);
      triggerAutoPipeline();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Auto-learn failed");
    }
    setLearning(false);
  };

  const toggleTraining = async (id: string, current: boolean) => {
    await supabase.from("datasets").update({ is_training: !current } as any).eq("id", id);
    await refreshDatasets();
    toast.success(!current ? "Marked as training dataset" : "Removed training flag");
  };

  const deleteDataset = async (id: string) => {
    await supabase.from("datasets").delete().eq("id", id);
    await refreshDatasets();
    toast.success("Dataset deleted");
    triggerAutoPipeline();
  };

  const triggerAutoPipeline = useCallback((scenarioOverride?: string) => {
    if (!autoRunPipeline && !scenarioOverride) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      runPipeline(scenarioOverride);
    }, 800);
  }, [autoRunPipeline]); // eslint-disable-line react-hooks/exhaustive-deps

  const runPipeline = async (scenarioOverride?: string) => {
    setModuleStatus({});
    toast.info("Running full analysis pipeline → AI prediction…");
    const result = await runFullPipeline({
      scenario: scenarioOverride || scenario || undefined,
      onModule: (m, status) => setModuleStatus((s) => ({ ...s, [m]: status })),
    });
    if (result.ok) toast.success("Pipeline complete — AI synthesis ready in Predict tab");
    else toast.error("Pipeline finished with errors");
    setActiveTab("predict");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" /> Public Data Sources
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Fetch genomic data from TCGA, cBioPortal, UniProt & Ensembl to train and enrich the AI model</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("fetch")}
            className={`px-4 py-2 text-xs font-mono rounded-md transition-colors ${activeTab === "fetch" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Globe className="w-3 h-3 inline mr-1" /> Fetch Data
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 text-xs font-mono rounded-md transition-colors ${activeTab === "saved" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Save className="w-3 h-3 inline mr-1" /> Saved ({datasets.length})
          </button>
          <button
            onClick={() => setActiveTab("learn")}
            className={`px-4 py-2 text-xs font-mono rounded-md transition-colors ${activeTab === "learn" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Brain className="w-3 h-3 inline mr-1" /> Auto-Learn
          </button>
          <button
            onClick={() => setActiveTab("predict")}
            className={`px-4 py-2 text-xs font-mono rounded-md transition-colors ${activeTab === "predict" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles className="w-3 h-3 inline mr-1" /> Predict
          </button>
        </div>
      </div>

      {/* Reactive pipeline control bar — applies to ALL tabs */}
      <div className="module-card p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={autoRunPipeline} onChange={(e) => setAutoRunPipeline(e.target.checked)} className="accent-primary" />
            <Activity className="w-3 h-3" /> Auto re-run pipeline when data changes
          </label>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1 text-[10px] font-mono">
            {["motf","gbsc","bctn","cnis","msrs","trajectory"].map((m) => {
              const s = moduleStatus[m];
              const cls = s === "done" ? "bg-chart-emerald/15 text-chart-emerald" :
                          s === "start" ? "bg-primary/15 text-primary animate-pulse" :
                          s === "error" ? "bg-destructive/15 text-destructive" :
                          "bg-muted text-muted-foreground";
              return <span key={m} className={`px-1.5 py-0.5 rounded ${cls}`}>{m}</span>;
            })}
          </div>
        </div>
        <button
          onClick={() => runPipeline()}
          disabled={pipelineRunning}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {pipelineRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {pipelineRunning ? "Running…" : "Run Full Pipeline + Predict"}
        </button>
      </div>

      {activeTab === "fetch" && (
        <div className="space-y-4">
          {/* Source selection */}
          <div className="grid grid-cols-4 gap-3">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSource(s.id)}
                className={`module-card text-left p-3 transition-all ${selectedSource === s.id ? "border-primary ring-1 ring-primary/20" : ""}`}
              >
                <span className={`text-xs font-mono font-bold ${s.color}`}>{s.label}</span>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
              </button>
            ))}
          </div>

          {/* Query form */}
          <div className="module-card p-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">Category</label>
                <div className="flex gap-2 mt-1">
                  {(CATEGORIES[selectedSource] || []).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${selectedCategory === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase">Query / Filter</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={selectedSource === "tcga" ? "e.g. TCGA-OV or TP53,BRCA1" : selectedSource === "uniprot" ? "e.g. BRCA1 AND organism_id:9606" : "e.g. BRCA1"}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={saveToDb} onChange={(e) => setSaveToDb(e.target.checked)} className="accent-primary" />
                Save to database
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={markTraining} onChange={(e) => setMarkTraining(e.target.checked)} className="accent-primary" />
                <FlaskConical className="w-3 h-3" /> Mark as training data
              </label>
            </div>

            <button
              onClick={handleFetch}
              disabled={fetching}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {fetching ? "Fetching..." : "Fetch Data"}
            </button>
          </div>

          {/* Preview */}
          {previewData && (
            <div className="module-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">
                  Preview — {previewData.record_count} records from {previewData.source}
                </h3>
              </div>
              <div className="max-h-[400px] overflow-auto rounded-md border border-border bg-background p-3">
                <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">
                  {JSON.stringify(previewData.data?.slice(0, 10), null, 2)}
                </pre>
              </div>
              {previewData.data?.length > 10 && (
                <p className="text-[10px] text-muted-foreground mt-2 font-mono">Showing 10 of {previewData.record_count} records</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={refreshDatasets} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <span className="text-xs text-muted-foreground font-mono">
              {datasets.filter((d) => d.is_training).length} training datasets
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
              No datasets saved yet. Fetch data from a public source to get started.
            </div>
          ) : (
            datasets.map((ds) => (
              <div key={ds.id} className="module-card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{ds.name}</span>
                    {ds.is_training && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-chart-emerald/10 text-chart-emerald text-[10px] font-mono">
                        <FlaskConical className="w-2.5 h-2.5" /> Training
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{ds.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-muted-foreground">
                    <span className="uppercase">{ds.source}</span>
                    <span>{ds.record_count} records</span>
                    <span>{ds.category}</span>
                    <span>{new Date(ds.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleTraining(ds.id, ds.is_training)}
                    title={ds.is_training ? "Remove training flag" : "Mark as training data"}
                    className={`p-2 rounded-md transition-colors ${ds.is_training ? "text-chart-emerald hover:bg-chart-emerald/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteDataset(ds.id)}
                    className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "learn" && (
        <div className="space-y-4">
          <div className="module-card p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Self-Learning Pipeline</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Automatically fetch data from all accessible public databases (TCGA, cBioPortal, UniProt, Ensembl),
              synthesize knowledge, and continuously improve analytical judgment across all TEMPEST modules.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-chart-amber" /> 19 predefined queries</span>
              <span className="flex items-center gap-1"><Database className="w-3 h-3 text-chart-cyan" /> 4 public sources</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-chart-emerald" /> {datasets.filter(d => d.is_training).length} training datasets</span>
            </div>
            <button
              onClick={handleAutoLearn}
              disabled={learning}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {learning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
              {learning ? "Learning in progress..." : "Start Self-Learning"}
            </button>
          </div>

          {learning && (
            <div className="module-card p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Crawling public databases...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Fetching cancer genomics data, generating knowledge synthesis, and updating AI context. This may take 1-2 minutes.</p>
                </div>
              </div>
            </div>
          )}

          {learnResult && (
            <div className="module-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-chart-amber" /> Learning Complete
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-chart-cyan/5 border border-chart-cyan/20 rounded-md p-3 text-center">
                  <p className="text-2xl font-bold text-chart-cyan">{learnResult.fetched || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">New Datasets</p>
                </div>
                <div className="bg-chart-emerald/5 border border-chart-emerald/20 rounded-md p-3 text-center">
                  <p className="text-2xl font-bold text-chart-emerald">{learnResult.total_training || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">Total Training</p>
                </div>
                <div className="bg-chart-amber/5 border border-chart-amber/20 rounded-md p-3 text-center">
                  <p className="text-2xl font-bold text-chart-amber">{learnResult.skipped || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">Already Known</p>
                </div>
              </div>
              {learnResult.summary && (
                <div className="bg-background border border-border rounded-md p-3">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Knowledge Synthesis Preview</p>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{learnResult.summary}</p>
                </div>
              )}
              {learnResult.errors && learnResult.errors.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3">
                  <p className="text-[10px] font-mono text-destructive uppercase mb-1">Partial Errors ({learnResult.errors.length})</p>
                  {learnResult.errors.slice(0, 5).map((e: string, i: number) => (
                    <p key={i} className="text-[10px] text-muted-foreground">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="module-card p-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase mb-3">How Self-Learning Works</h3>
            <div className="space-y-2">
              {[
                { step: "1", title: "Crawl", desc: "Fetches cancer genomics data from TCGA, cBioPortal, UniProt, and Ensembl with predefined cancer-relevant queries" },
                { step: "2", title: "Ingest", desc: "Saves all fetched data to the database marked as training datasets, skipping duplicates" },
                { step: "3", title: "Synthesize", desc: "AI analyzes all training data to extract cross-dataset patterns, biological insights, and clinical correlations" },
                { step: "4", title: "Enrich", desc: "Knowledge synthesis is automatically injected into all analysis modules (MOTF, GBSC, BCTN, CNIS, MSRS, Trajectory) and the AI Agent" },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{s.step}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "predict" && (
        <div className="space-y-4">
          <div className="module-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Simulate a Case & Predict Next Phase
            </h3>
            <p className="text-xs text-muted-foreground">
              Describe ANY cancer case (cancer type, stage, mutations, treatment, time since diagnosis). The platform will adapt its temporal-bifurcation framework to your scenario, re-run all six analytical modules, and the AI Agent will predict the next likely phase of evolution.
            </p>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder={"e.g. 58-y-old female, neuroblastoma stage 4, MYCN-amplified, 6 weeks post-cisplatin, RNA-seq shows ADRN signature dropping, MES markers (PRRX1, VIM) rising. Predict next phase."}
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={() => runPipeline(scenario)}
                disabled={pipelineRunning || !scenario.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {pipelineRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Simulate & Predict
              </button>
              <button
                onClick={() => { setScenario(""); runPipeline(); }}
                disabled={pipelineRunning}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" /> Run on Current Data
              </button>
            </div>
          </div>

          {lastSynthesis ? (
            <div className="module-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" /> AI Agent Synthesis & Phase Prediction
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono">cross-module · live</span>
              </div>
              <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-td:text-foreground prose-th:text-foreground max-h-[600px] overflow-y-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{lastSynthesis}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="module-card p-6 text-center text-sm text-muted-foreground">
              No prediction yet. Add data, run a pipeline, or describe a scenario above to generate the AI Agent's next-phase prediction.
            </div>
          )}
        </div>
      )}

      {/* Analysis Summary Footer */}
      <AnalysisSummaryFooter
        title={moduleSummaries.datasources.title}
        objective={moduleSummaries.datasources.objective}
        accomplishments={moduleSummaries.datasources.accomplishments}
        significance={moduleSummaries.datasources.significance}
        nextStep={{ label: moduleSummaries.datasources.nextLabel! }}
      />
    </motion.div>
  );
};

export default DataSourcesPanel;
