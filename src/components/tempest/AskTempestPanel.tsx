import { useEffect, useMemo, useState } from "react";
import { MessageCircleQuestion, Send, RotateCcw } from "lucide-react";
import { askTempest, QUICK_QUESTIONS, REFUSAL } from "@/lib/intelligence/askTempest";
import { preflightUserInput } from "@/lib/security/redact";

interface Turn {
  q: string;
  answer: string;
  grounded_in: string[];
  refused: boolean;
}

const STORAGE_KEY = "tempest.asktempest.turns.v1";

function loadTurns(): Turn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AskTempestPanel() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>(() => loadTurns());

  // Persist on every change so navigation/reload preserves history.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(turns));
    } catch {
      /* quota — silently degrade */
    }
  }, [turns]);

  const submit = (q: string) => {
    const text = q.trim();
    if (!text) return;
    const guard = preflightUserInput(text);
    if (!guard.ok) {
      setTurns((t) => [...t, { q: "[blocked]", answer: guard.reason, grounded_in: [], refused: true }]);
      setQuestion("");
      return;
    }
    const res = askTempest(text);
    setTurns((t) => [...t, { q: text, ...res }]);
    setQuestion("");
  };

  const handleReset = () => {
    if (turns.length === 0) return;
    if (!confirm("Reset Ask TEMPEST history? Your dataset context and module results are preserved.")) return;
    setTurns([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  };

  const groundedInfo = useMemo(
    () => `Grounded only in: uploaded dataset summary · DatasetContext · module results · TEMPEST knowledge base · safe-language rules. If unsupported: "${REFUSAL}"`,
    [],
  );

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5 text-primary" /> Ask TEMPEST
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{groundedInfo}</p>
        </div>
        <button
          onClick={handleReset}
          disabled={turns.length === 0}
          title="Reset Ask TEMPEST history (preserves dataset context)"
          className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="module-card space-y-2">
        <div className="text-[11px] font-mono uppercase text-muted-foreground">Quick questions</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => submit(q)}
              className="text-xs px-2 py-1 rounded bg-secondary/60 hover:bg-secondary text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="module-card min-h-[200px] space-y-3">
        {turns.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Ask a question to begin. Answers are deterministic and grounded.</p>
        ) : (
          turns.map((t, i) => (
            <div key={i} className="space-y-1 border-b border-border/40 pb-2 last:border-0">
              <p className="text-xs font-mono text-muted-foreground">Q: {t.q}</p>
              <p className={`text-sm ${t.refused ? "text-chart-amber" : "text-foreground"}`}>{t.answer}</p>
              <p className="text-[10px] font-mono text-muted-foreground/80">grounded_in: {t.grounded_in.join(", ")}</p>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="flex gap-2"
      >
        <input
          autoFocus
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your uploaded dataset, validity gates, neoantigens, or what to do next..."
          className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm flex items-center gap-1 hover:bg-primary/90"
        >
          <Send className="w-3.5 h-3.5" /> Ask
        </button>
      </form>
    </div>
  );
}
