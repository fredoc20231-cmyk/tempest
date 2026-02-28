import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Database, Search, ArrowRight, Dna } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: string[];
  action?: { label: string; module: string };
}

interface ChatPanelProps {
  onNavigate?: (module: string) => void;
  onCohortLoaded?: (cohort: CohortPayload) => void;
}

export interface CohortPayload {
  name: string;
  samples: number;
  timepoints: string[];
  modalities: string[];
  tensorShape: string;
  latentFactors: number;
  varianceExplained: string;
}

const HGSOC_COHORT: CohortPayload = {
  name: "HGSOC GEM Longitudinal Series",
  samples: 8,
  timepoints: ["D0", "D20", "D21", "D52", "D88", "D92", "D99", "D109", "D122"],
  modalities: ["RNA-seq (bulk)", "WES (somatic)", "10x Visium (spatial)", "Neoantigen (NetMHCpan)"],
  tensorShape: "T ∈ ℝ^(8 × 12,451 × 4)",
  latentFactors: 12,
  varianceExplained: "92.3%",
};

const sampleResponses: Record<string, { content: string; tools: string[]; action?: { label: string; module: string } }> = {
  default: {
    content: "I can search TCGA, cBioPortal, and ICGC databases. Try asking about HGSOC cohorts, running survival analyses on staged timepoints, or loading a multi-omic dataset into the MOTF tensor pipeline.",
    tools: [],
  },
  tcga: {
    content: `Found **847 samples** matching TCGA-OV (High-Grade Serous Ovarian Carcinoma). Key statistics from integrated analysis:\n\n• **TP53 mutation rate:** 96% (near-universal)\n• Median OS: 44.6 months\n• BRCA1/2 germline: 22%\n• HRD-positive: 50%\n\nOur GEM model recapitulates key hallmarks: Trp53/Rb1 deletion + KrasG12D in Pax8+ FT secretory cells across 8 longitudinal timepoints (D0–D122).\n\nShall I load the **HGSOC GEM cohort** into the MOTF pipeline for tensor decomposition?`,
    tools: ["ConnectorRegistry.search()", "TCGA.query(project=TCGA-OV)"],
    action: { label: "Load into MOTF Pipeline", module: "motf" },
  },
  motf: {
    content: `Loading HGSOC GEM longitudinal cohort into **MOTF — Multi-Omic Tensor Factorization**...\n\n**Tensor constructed:** T ∈ ℝ^(8 × 12,451 × 4)\n• Samples: 8 timepoints (D0–D122)\n• Features: 12,451 genes/variants/spots\n• Modalities: RNA-seq, WES, Spatial, Neoantigen\n\n**wNTD decomposition complete:**\n• Latent factors retained: **12** (elbow at 90% variance)\n• Cross-modal variance explained: **92.3%**\n• LF1 ↔ Stage progression: r = 0.94 (p < 10⁻⁶)\n• LF2 ↔ Transitional phase: r = 0.81\n• LF4 ↔ FT/STIC/Tumor compartment: r = 0.88\n\nMOTF latent space is ready. Downstream modules (GBSC, BCTN, CNIS, MSRS) can now consume these factors.`,
    tools: ["MOTF.construct_tensor()", "MOTF.wNTD(rank=12)", "MOTF.annotate_factors(PROGENy)"],
    action: { label: "View MOTF Results", module: "motf" },
  },
  survival: {
    content: `Running **GBSC** (Gradient-Boosted Stage Classifier) on MOTF latent factors + 47 curated features...\n\n**LOTO Cross-Validation Results:**\n• Overall accuracy: **94.7%**\n• Macro F1: **0.93**\n\n| Stage | Precision | Recall | AUC-ROC |\n|---|---|---|---|\n| Early (D0/20/21) | 0.96 | 0.95 | 0.98 |\n| Intermediate (D52) | 0.91 | 0.90 | 0.96 |\n| Transitional (D88/99) | 0.93 | 0.92 | 0.94 |\n| Advanced (D109/122) | 0.95 | 0.96 | 0.97 |\n\nTop SHAP features: LF1 (0.342), missense:silent ratio (0.218), Vim spatial score (0.187).`,
    tools: ["GBSC.train(XGBoost)", "GBSC.loto_cv()", "GBSC.shap_explain()"],
    action: { label: "View Survival Analysis", module: "gbsc" },
  },
  neoantigen: {
    content: `**CNIS — Neoantigen Intelligence** pipeline complete.\n\nHigh-confidence expressed neoantigens (NetMHCpan 4.1b, H-2-Db/Kb):\n\n• **Meis1** → TFFFXXMVLF — D20 & D122 (early genesis, late persistence)\n• **Rbm26** → FFFFFXXVFP — D21, D52, D99, D109 (longest-lived, 4 stages)\n• **Slfn8** → YMKVDIAYAI — D52 & D99 (strong binder)\n• **Zkscan7** → HTQENPYECC — D20 & D122 (stage-spanning)\n\nFusion-derived:\n• **Mfhas1::Tns3** — %Rank 0.13 (strong binder)\n• **Camk1d::Arid1a** — dual H-2-Db/Kb affinity\n\nRecurrent neoantigens span non-adjacent timepoints → antigen-bearing clones persist through progression.`,
    tools: ["CNIS.netmhcpan(alleles=[H-2-Db,H-2-Kb])", "CNIS.fusion_scan(STAR-Fusion∩Arriba)"],
    action: { label: "View Neoantigen Landscape", module: "cnis" },
  },
  clonal: {
    content: `**BCTN — Bayesian Clonal Trajectory Network** analysis:\n\n**PyClone subclonal architecture (Dirichlet Process, 10K MCMC):**\n\nDay 52: 5 distinct clusters → branched architecture\nDay 88: Peak diversification, missense:silent = **2.65**\nDay 92–122: Consolidation to **1–2 dominant lineages**\n\nClonally expanded gene programs:\n• Cell cycle control (CDK/Cyclin)\n• Chromatin organization (SWI/SNF)\n• Vasculogenesis (VEGF axis)\n• rRNA processing\n• Immune modulation (Marco, M2-like polarization)\n\nGelman-Rubin R̂ < 1.1 across all chains. ARI > 0.90 confirms cluster stability.`,
    tools: ["BCTN.pyclone(model=DPM)", "BCTN.trajectory_forecast()", "BCTN.gsea(clonal_genes)"],
    action: { label: "View Clonal Dynamics", module: "bctn" },
  },
};

const ChatPanel = ({ onNavigate, onCohortLoaded }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to the TEMPEST AI Agent. I have access to the HGSOC GEM longitudinal dataset (8 timepoints, D0–D122) with RNA-seq, WES, spatial transcriptomics, and neoantigen data.\n\nAsk me to load cohorts into the MOTF pipeline, run survival staging, or explore the neoantigen landscape.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const lower = input.toLowerCase();
    let key = "default";
    if (lower.includes("load") && (lower.includes("motf") || lower.includes("tensor") || lower.includes("pipeline"))) {
      key = "motf";
    } else if (lower.includes("tcga") || lower.includes("hgsoc") || lower.includes("ovarian") || lower.includes("lung")) {
      key = "tcga";
    } else if (lower.includes("survival") || lower.includes("kaplan") || lower.includes("stage") || lower.includes("gbsc")) {
      key = "survival";
    } else if (lower.includes("neoantigen") || lower.includes("cnis") || lower.includes("immunogen")) {
      key = "neoantigen";
    } else if (lower.includes("clonal") || lower.includes("bctn") || lower.includes("pyclone") || lower.includes("trajectory")) {
      key = "clonal";
    }

    const resp = sampleResponses[key];

    if (key === "motf" && onCohortLoaded) {
      onCohortLoaded(HGSOC_COHORT);
    }

    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: "assistant", content: resp.content, tools: resp.tools, action: resp.action },
    ]);
    setLoading(false);
  };

  const handleAction = (module: string) => {
    onNavigate?.(module as any);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          TEMPEST AI Agent
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Claude-powered biomedical search & MOTF pipeline orchestration</p>
      </div>

      {/* Quick actions */}
      <div className="px-6 py-3 border-b border-border flex gap-2 flex-wrap">
        {[
          "Search TCGA for HGSOC cohorts",
          "Load cohort into MOTF pipeline",
          "Run GBSC survival staging",
          "Show neoantigen landscape",
          "Analyze clonal trajectories",
        ].map((q) => (
          <button
            key={q}
            onClick={() => setInput(q)}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors font-mono"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === "user" ? "bg-primary/10 text-foreground" : "bg-card"} rounded-lg px-4 py-3 border border-border`}>
                {msg.tools && msg.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {msg.tools.map((t) => (
                      <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-1">
                        <Search className="w-2.5 h-2.5" /> {t}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.action && (
                  <button
                    onClick={() => handleAction(msg.action!.module)}
                    className="mt-3 flex items-center gap-2 px-3 py-2 text-xs font-mono bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors border border-primary/20"
                  >
                    <Dna className="w-3.5 h-3.5" />
                    {msg.action.label}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-md bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card rounded-lg px-4 py-3 border border-border flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground font-mono">Querying databases & running pipeline...</span>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2 border border-border focus-within:border-primary/40 transition-colors">
          <Database className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Load cohort into MOTF, search TCGA, run survival analysis..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
