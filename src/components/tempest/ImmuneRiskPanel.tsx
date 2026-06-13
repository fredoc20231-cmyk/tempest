import { useState } from "react";
import { FlaskConical, Shield, BarChart3 } from "lucide-react";
import ModulePanel from "./ModulePanel";
import type { CohortPayload } from "./ChatPanel";

type Sub = "bctn" | "cnis" | "msrs";

const tabs: { id: Sub; label: string; desc: string; icon: typeof Shield }[] = [
  { id: "bctn", label: "BCTN", desc: "Clonal Dynamics", icon: FlaskConical },
  { id: "cnis", label: "CNIS", desc: "Neoantigen Intel", icon: Shield },
  { id: "msrs", label: "MSRS", desc: "Risk Scoring", icon: BarChart3 },
];

const ImmuneRiskPanel = ({ cohort }: { cohort?: CohortPayload | null }) => {
  const [active, setActive] = useState<Sub>("bctn");
  return (
    <div className="flex flex-col">
      <div className="border-b border-border bg-card/40 px-6 pt-4">
        <div className="flex items-center gap-1">
          {tabs.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono rounded-t-md border-b-2 transition-all ${
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span className="font-semibold">{t.label}</span>
                <span className="text-[10px] opacity-70">— {t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
      <ModulePanel key={active} module={active} cohort={cohort} />
    </div>
  );
};

export default ImmuneRiskPanel;
