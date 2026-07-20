import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Database, Search, ArrowRight, Dna, Upload, Paperclip, X, FileText, RotateCcw } from "lucide-react";
import CohortUploader from "./CohortUploader";
import { supabase } from "@/integrations/supabase/client";
import { useTempest } from "@/contexts/TempestContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

function parseAction(text: string): { label: string; module: string } | undefined {
  const match = text.match(/ACTION:\s*(\{[^}]+\})/);
  if (!match) return undefined;
  try {
    return JSON.parse(match[1]);
  } catch {
    return undefined;
  }
}

function stripAction(text: string): string {
  return text.replace(/ACTION:\s*\{[^}]+\}/, "").trim();
}

import { parseFile, SUPPORTED_EXTENSIONS, getExtension } from "@/lib/fileParsers";

const MAX_FILE_CHARS = 50000;

interface AttachedFile {
  name: string;
  content: string;
  size: number;
  truncated: boolean;
  kind: string;
}

const ChatPanel = ({ onNavigate, onCohortLoaded }: ChatPanelProps) => {
  const { saveCohort, setAIContext } = useTempest();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to the TEMPEST AI Agent. I have access to the HGSOC GEM longitudinal dataset (8 timepoints, D0–D122) with RNA-seq, WES, spatial transcriptomics, and neoantigen data.\n\nYou can **upload files in any common format** — PDF, DOCX, DOC, RTF, HTML, TXT, CSV, TSV, JSON, VCF, MAF, FASTA, and more. I'll extract the text, analyze it in the context of tumor evolution, and add it to the platform's knowledge base so other modules (and the cross-module synthesis) can use it.\n\nAsk me to load cohorts into the MOTF pipeline, run survival staging, or explore the neoantigen landscape.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Load persisted messages on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          tools: m.tools || undefined,
          action: m.action || undefined,
        })));
      }
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const persistMessage = async (msg: Message) => {
    await supabase.from("chat_messages").insert({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      tools: msg.tools || null,
      action: msg.action || null,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      const ext = getExtension(file.name);
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        alert(`Unsupported file type: ${ext || "(none)"}.\n\nSupported: ${SUPPORTED_EXTENSIONS.join(", ")}`);
        continue;
      }
      try {
        const parsed = await parseFile(file, MAX_FILE_CHARS);
        newFiles.push(parsed);
        // Persist to platform knowledge so the AI synthesis and other modules can use it.
        try {
          await supabase.from("datasets").insert({
            name: file.name,
            source: "user-upload",
            source_id: `chat-${Date.now()}-${file.name}`,
            category: "user-upload",
            description: `User-uploaded ${parsed.kind.toUpperCase()} (${(file.size / 1024).toFixed(1)} KB${parsed.truncated ? ", truncated" : ""})`,
            data: { content: parsed.content, kind: parsed.kind, truncated: parsed.truncated },
            record_count: parsed.content.length,
            metadata: { mime: file.type || null, original_size: file.size },
            is_training: true,
          });
        } catch (persistErr) {
          console.warn("Failed to persist uploaded file to datasets table:", persistErr);
        }
      } catch (err: any) {
        console.error(err);
        alert(`Failed to parse ${file.name}: ${err?.message || err}`);
      }
    }
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (name: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const buildMessageWithFiles = (text: string, files: AttachedFile[]): string => {
    if (files.length === 0) return text;
    let msg = text || "Analyze the uploaded file(s) in the context of cancer progression and tumor evolution.";
    files.forEach((f) => {
      msg += `\n\n---\n📎 **File: ${f.name}** (${(f.size / 1024).toFixed(1)} KB${f.truncated ? ", truncated to first 50K chars" : ""})\n\`\`\`\n${f.content}\n\`\`\``;
    });
    return msg;
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || loading) return;

    // Preflight: block API keys / credentials from ever entering chat state,
    // logs, storage, or the network payload.
    const { preflightUserInput } = await import("@/lib/security/redact");
    const guard = preflightUserInput(input);
    if (!guard.ok) {
      setInput("");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: guard.reason },
      ]);
      return;
    }

    const fullContent = buildMessageWithFiles(input, attachedFiles);
    const displayContent = attachedFiles.length > 0
      ? `${input || "Analyze uploaded file(s)"}\n\n${attachedFiles.map((f) => `📎 ${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join("\n")}`
      : input;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: displayContent };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setLoading(true);

    await persistMessage(userMsg);

    // Check for cohort loading intent
    const lower = input.toLowerCase();
    if (lower.includes("load") && (lower.includes("motf") || lower.includes("tensor") || lower.includes("pipeline") || lower.includes("cohort"))) {
      if (onCohortLoaded) onCohortLoaded(HGSOC_COHORT);
      await saveCohort({
        name: HGSOC_COHORT.name,
        samples: HGSOC_COHORT.samples,
        timepoints: HGSOC_COHORT.timepoints,
        modalities: HGSOC_COHORT.modalities,
        tensor_shape: HGSOC_COHORT.tensorShape,
        latent_factors: HGSOC_COHORT.latentFactors,
        variance_explained: HGSOC_COHORT.varianceExplained,
      });
    }

    // Stream from AI edge function
    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    try {
      const chatHistory = [...messages.filter(m => m.id !== "welcome"), { role: "user" as const, content: fullContent }].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!resp.ok || !resp.body) {
        let errMsg = "Failed to get response from AI.";
        try {
          const errData = await resp.json();
          errMsg = errData.error || errMsg;
        } catch {}
        const errAssistant: Message = { id: assistantId, role: "assistant", content: errMsg };
        setMessages((prev) => [...prev, errAssistant]);
        await persistMessage(errAssistant);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: stripAction(assistantContent) } : m);
                }
                return [...prev, { id: assistantId, role: "assistant", content: stripAction(assistantContent) }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) assistantContent += content;
          } catch {}
        }
      }

      // Parse action from response
      const action = parseAction(assistantContent);
      const cleanContent = stripAction(assistantContent);

      // Update final message with action
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: cleanContent, action } : m)
      );

      await persistMessage({ id: assistantId, role: "assistant", content: cleanContent, action });
    } catch (e) {
      console.error("Chat stream error:", e);
      const errAssistant: Message = { id: assistantId, role: "assistant", content: "An error occurred while processing your request. Please try again." };
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId) return prev.map((m, i) => i === prev.length - 1 ? errAssistant : m);
        return [...prev, errAssistant];
      });
      await persistMessage(errAssistant);
    }

    setLoading(false);
  };

  const handleQuickAction = (q: string) => {
    setInput(q);
  };

  const handleReset = async () => {
    if (loading) return;
    if (!confirm("Reset the conversation? Your uploaded datasets and learned context will be preserved — only the chat history will be cleared.")) return;
    try {
      await supabase.from("chat_messages").delete().not("id", "is", null);
    } catch (e) {
      console.error("Failed to clear chat history", e);
    }
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Conversation reset. My learned context (uploaded datasets, training references, prior analysis results) is preserved, so I can give you a sharper answer this round.\n\nWhat would you like to ask?",
      },
    ]);
    setAttachedFiles([]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            TEMPEST AI Agent
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Lovable AI-powered biomedical search & MOTF pipeline orchestration</p>
        </div>
        <button
          onClick={handleReset}
          disabled={loading}
          title="Reset conversation (keeps learned context)"
          className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset chat
        </button>
      </div>

      <div className="px-6 py-3 border-b border-border flex gap-2 flex-wrap items-center">
        <CohortUploader />
        {[
          "Search TCGA for HGSOC cohorts",
          "Load cohort into MOTF pipeline",
          "Run GBSC survival staging",
          "Show neoantigen landscape",
          "Analyze clonal trajectories",
        ].map((q) => (
          <button
            key={q}
            onClick={() => handleQuickAction(q)}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors font-mono"
          >
            {q}
          </button>
        ))}
      </div>

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
              <div className={`max-w-[85%] ${msg.role === "user" ? "bg-primary/10 text-foreground" : "bg-card"} rounded-lg px-4 py-3 border border-border`}>
                <div className="text-sm prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-td:text-foreground prose-th:text-foreground">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-md border border-border">
                          <Table>{children}</Table>
                        </div>
                      ),
                      thead: ({ children }) => <TableHeader className="bg-secondary">{children}</TableHeader>,
                      tbody: ({ children }) => <TableBody>{children}</TableBody>,
                      tr: ({ children }) => <TableRow className="hover:bg-secondary/50">{children}</TableRow>,
                      th: ({ children }) => <TableHead className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2">{children}</TableHead>,
                      td: ({ children }) => <TableCell className="font-mono text-sm px-3 py-2 leading-relaxed">{children}</TableCell>,
                    }}
                  >{msg.content}</ReactMarkdown>
                </div>
                {msg.action && (
                  <button
                    onClick={() => {
                      setAIContext({
                        module: msg.action!.module,
                        content: msg.content,
                        timestamp: Date.now(),
                      });
                      onNavigate?.(msg.action!.module);
                    }}
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
              <span className="text-xs text-muted-foreground font-mono">Querying AI & running pipeline...</span>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-6 py-4 border-t border-border space-y-2">
        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((f) => (
              <div key={f.name} className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md border border-primary/20 text-xs font-mono text-primary">
                <FileText className="w-3 h-3" />
                <span className="max-w-[150px] truncate">{f.name}</span>
                <span className="text-muted-foreground">({(f.size / 1024).toFixed(1)}K)</span>
                <button onClick={() => removeFile(f.name)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-4 py-2 border border-border focus-within:border-primary/40 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={SUPPORTED_EXTENSIONS.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
            title={`Attach file — PDF, DOCX, DOC, RTF, HTML, TXT, CSV, JSON, VCF, MAF, FASTA, etc. (${SUPPORTED_EXTENSIONS.length} formats)`}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Upload data or ask about cancer progression..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachedFiles.length === 0) || loading}
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
