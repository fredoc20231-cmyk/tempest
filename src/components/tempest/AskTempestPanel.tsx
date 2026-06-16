import { useMemo, useState } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";
import { askTempest, QUICK_QUESTIONS, REFUSAL } from "@/lib/intelligence/askTempest";

interface Turn {
  q: string;
  answer: string;
  grounded_in: string[];
  refused: boolean;
}

export default function AskTempestPanel() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);

  const submit = (q: string) => {
    const text = q.trim();
    if (!text) return;
    const res = askTempest(text);
    setTurns((t) => [...t, { q: text, ...res }]);
    setQuestion("");
  };

  const groundedInfo = useMemo(
    () => `Grounded only in: uploaded dataset summary · DatasetContext · module results · TEMPEST knowledge base · safe-language rules. If unsupported: "${REFUSAL}"`,
    [],
  );

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <MessageCircleQuestion className="w-5 h-5 text-primary" /> Ask TEMPEST
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{groundedInfo}</p>
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
