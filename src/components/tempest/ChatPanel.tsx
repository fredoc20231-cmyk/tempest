import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Database, Search } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: string[];
}

const sampleResponses: Record<string, { content: string; tools: string[] }> = {
  default: {
    content: "I can help you search TCGA, cBioPortal, and ICGC databases. Try asking me to find specific cancer datasets, run survival analyses, or interpret mutation profiles.",
    tools: [],
  },
  tcga: {
    content: "Found **847 samples** matching TCGA-LUAD (Lung Adenocarcinoma). Key statistics:\n\n• Median OS: 18.2 months\n• TP53 mutation rate: 52%\n• KRAS mutation rate: 33%\n• EGFR mutation rate: 14%\n\nShall I load this cohort into the MOTF pipeline for tensor decomposition?",
    tools: ["ConnectorRegistry.search()", "TCGA.query()"],
  },
  survival: {
    content: "Running Kaplan-Meier analysis on the selected cohort...\n\n**Results:**\n• Log-rank p-value: 0.003 (significant)\n• Treated arm median OS: 24.1 mo\n• Control arm median OS: 16.8 mo\n• Hazard ratio: 0.68 (95% CI: 0.52–0.89)\n\nThe GBSC module has been updated with these results.",
    tools: ["GBSC.kaplan_meier()", "StatEngine.log_rank()"],
  },
};

const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to the TEMPEST AI Agent. I can search biomedical databases, run analyses, and interpret results. What would you like to explore?",
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
    const key = lower.includes("tcga") || lower.includes("lung") ? "tcga" : lower.includes("survival") || lower.includes("kaplan") ? "survival" : "default";
    const resp = sampleResponses[key];

    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: "assistant", content: resp.content, tools: resp.tools },
    ]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          TEMPEST AI Agent
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Claude-powered biomedical search & analysis</p>
      </div>

      {/* Quick actions */}
      <div className="px-6 py-3 border-b border-border flex gap-2 flex-wrap">
        {["Search TCGA for lung cancer", "Run survival analysis", "Show neoantigen landscape"].map((q) => (
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
              <span className="text-xs text-muted-foreground font-mono">Querying databases...</span>
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
            placeholder="Search TCGA, cBioPortal, ICGC..."
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
