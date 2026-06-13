import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type Provenance =
  | "COMPUTED"
  | "USER-UPLOADED"
  | "DEMO/SYNTHETIC"
  | "PENDING VERIFICATION";

const meta: Record<Provenance, { tip: string; cls: string }> = {
  COMPUTED: {
    tip: "Numbers computed by the platform from active inputs.",
    cls: "bg-primary/10 text-primary border-primary/30",
  },
  "USER-UPLOADED": {
    tip: "Derived directly from a cohort the user uploaded this session.",
    cls: "bg-chart-emerald/10 text-chart-emerald border-chart-emerald/30",
  },
  "DEMO/SYNTHETIC": {
    tip: "Synthetic / demonstration data. Not biological evidence.",
    cls: "bg-chart-magenta/10 text-chart-magenta border-chart-magenta/30",
  },
  "PENDING VERIFICATION": {
    tip: "Draft material that is NOT publication-ready. Excluded from any 'publication-ready' export.",
    cls: "border-chart-amber text-chart-amber bg-[repeating-linear-gradient(45deg,hsl(var(--chart-amber)/0.08)_0_6px,transparent_6px_12px)]",
  },
};

export function ProvenanceBadge({ value }: { value: Provenance }) {
  const m = meta[value];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            aria-label={value === "PENDING VERIFICATION" ? "not publication ready" : undefined}
            className={`font-mono text-[10px] tracking-wider ${m.cls}`}
          >
            {value}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{m.tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
