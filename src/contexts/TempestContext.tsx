import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PipelineRun {
  id: string;
  module: string;
  status: string;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
}

interface AnalysisResult {
  id: string;
  module: string;
  results: any;
  config: any;
  created_at: string;
}

interface Cohort {
  id: string;
  name: string;
  samples: number;
  timepoints: any;
  modalities: any;
  tensor_shape: string | null;
  latent_factors: number | null;
  variance_explained: string | null;
}

interface AIContext {
  module: string;
  content: string;
  timestamp: number;
}

interface TempestState {
  pipelineRuns: PipelineRun[];
  analysisResults: Record<string, AnalysisResult | null>;
  cohorts: Cohort[];
  activeCohort: Cohort | null;
  setActiveCohort: (cohort: Cohort | null) => void;
  aiContext: AIContext | null;
  setAIContext: (ctx: AIContext | null) => void;
  isLoading: boolean;
  pipelineRunning: boolean;
  lastSynthesis: string | null;
  runFullPipeline: (opts?: { scenario?: string; onModule?: (m: string, status: "start" | "done" | "error") => void }) => Promise<{ ok: boolean; synthesis?: string }>;
  refreshPipeline: () => Promise<void>;
  refreshResults: (module: string) => Promise<void>;
  refreshCohorts: () => Promise<void>;
  saveCohort: (cohort: Omit<Cohort, "id">) => Promise<void>;
  resetPipeline: (module: string) => Promise<void>;
}

const TempestContext = createContext<TempestState | null>(null);

export function TempestProvider({ children }: { children: ReactNode }) {
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult | null>>({});
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [activeCohort, setActiveCohort] = useState<Cohort | null>(null);
  const [aiContext, setAIContext] = useState<AIContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [lastSynthesis, setLastSynthesis] = useState<string | null>(null);

  const refreshPipeline = useCallback(async () => {
    const { data } = await supabase.from("pipeline_runs").select("*").order("module");
    if (data) setPipelineRuns(data as PipelineRun[]);
  }, []);

  const refreshResults = useCallback(async (module: string) => {
    const { data } = await supabase
      .from("analysis_results")
      .select("*")
      .eq("module", module)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      setAnalysisResults((prev) => ({ ...prev, [module]: data[0] as AnalysisResult }));
    }
  }, []);

  const refreshCohorts = useCallback(async () => {
    const { data } = await supabase.from("cohorts").select("*").order("created_at", { ascending: false });
    if (data) setCohorts(data as Cohort[]);
  }, []);

  const saveCohort = useCallback(async (cohort: Omit<Cohort, "id">) => {
    await supabase.from("cohorts").insert(cohort);
    await refreshCohorts();
  }, [refreshCohorts]);

  const resetPipeline = useCallback(async (module: string) => {
    const run = pipelineRuns.find((r) => r.module === module);
    if (run) {
      await supabase
        .from("pipeline_runs")
        .update({ status: "idle", progress: 0, started_at: null, completed_at: null })
        .eq("id", run.id);
      await refreshPipeline();
    }
  }, [pipelineRuns, refreshPipeline]);

  const runFullPipeline = useCallback(
    async (opts?: { scenario?: string; onModule?: (m: string, status: "start" | "done" | "error") => void }) => {
      setPipelineRunning(true);
      const sequence = ["motf", "gbsc", "bctn", "cnis", "msrs", "trajectory"];
      // Compute a data signature from current datasets so AI varies its output
      const { data: ds } = await supabase
        .from("datasets")
        .select("name, source, record_count, is_training, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      const dataSignature = `n=${ds?.length || 0};training=${(ds || []).filter((d: any) => d.is_training).length};latest=${ds?.[0]?.created_at || "none"};hash=${(ds || []).map((d: any) => d.name).join(",").slice(0, 200)}`;

      let ok = true;
      for (const m of sequence) {
        try {
          opts?.onModule?.(m, "start");
          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-analysis`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ module: m, scenario: opts?.scenario, dataSignature }),
          });
          if (!resp.ok) { ok = false; opts?.onModule?.(m, "error"); }
          else { await refreshResults(m); opts?.onModule?.(m, "done"); }
        } catch (e) {
          console.error(`pipeline ${m} error`, e);
          ok = false;
          opts?.onModule?.(m, "error");
        }
      }

      // Now ask AI Agent to synthesize and predict next phase
      let synthesis: string | undefined;
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/synthesize-prediction`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ scenario: opts?.scenario }),
        });
        if (resp.ok) {
          const j = await resp.json();
          synthesis = j.interpretation;
          if (synthesis) setLastSynthesis(synthesis);
        }
      } catch (e) { console.error("synthesis error", e); }

      setPipelineRunning(false);
      return { ok, synthesis };
    },
    [refreshResults]
  );

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([
        refreshPipeline(),
        refreshCohorts(),
        ...["motf", "gbsc", "bctn", "cnis", "msrs"].map(refreshResults),
      ]);
      setIsLoading(false);
    };
    load();
  }, [refreshPipeline, refreshCohorts, refreshResults]);

  // Realtime subscription for pipeline updates
  useEffect(() => {
    const channel = supabase
      .channel("pipeline-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pipeline_runs" }, () => {
        refreshPipeline();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshPipeline]);

  return (
    <TempestContext.Provider value={{ pipelineRuns, analysisResults, cohorts, activeCohort, setActiveCohort, aiContext, setAIContext, isLoading, pipelineRunning, lastSynthesis, runFullPipeline, refreshPipeline, refreshResults, refreshCohorts, saveCohort, resetPipeline }}>
      {children}
    </TempestContext.Provider>
  );
}

export function useTempest() {
  const ctx = useContext(TempestContext);
  if (!ctx) throw new Error("useTempest must be inside TempestProvider");
  return ctx;
}
