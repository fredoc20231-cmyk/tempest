import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type EvidenceType =
  | "synthetic-ground-truth"
  | "endpoint-comparison"
  | "longitudinal-trajectory"
  | "prospective-prediction";

const meta: Record<EvidenceType, { label: string; tip: string; cls: string }> = {
  "synthetic-ground-truth": {
    label: "Synthetic ground truth",
    tip: "Result is derived from a simulated system with known dynamics. Used for method validation, not biological claims.",
    cls: "bg-chart-magenta/10 text-chart-magenta border-chart-magenta/30",
  },
  "endpoint-comparison": {
    label: "Endpoint comparison",
    tip: "Two-state comparison (e.g. parental vs resistant). Demonstrates separation, not transition dynamics.",
    cls: "bg-chart-cyan/10 text-chart-cyan border-chart-cyan/30",
  },
  "longitudinal-trajectory": {
    label: "Longitudinal trajectory",
    tip: "Multi-timepoint evidence supporting transition-dynamics interpretation. Retrospective only.",
    cls: "bg-chart-emerald/10 text-chart-emerald border-chart-emerald/30",
  },
  "prospective-prediction": {
    label: "Prospective prediction",
    tip: "Reserved label. TEMPEST does not produce prospective predictions and never assigns this automatically.",
    cls: "bg-chart-amber/10 text-chart-amber border-chart-amber/30",
  },
};

export function EvidenceBadge({ type }: { type: EvidenceType }) {
  const m = meta[type];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`font-mono text-[10px] ${m.cls}`}>
            {m.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{m.tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
