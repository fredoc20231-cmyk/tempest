import { AlertTriangle } from "lucide-react";
import type { ValidityReport } from "@/lib/validity";

export function ValidityWarning({ report }: { report: ValidityReport }) {
  if (report.ok) return null;
  return (
    <div className="border border-chart-amber/40 bg-chart-amber/5 rounded-md p-3 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-chart-amber flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-chart-amber">Validity gate: n &lt; {report.threshold} per condition</p>
        <p className="text-xs text-foreground/80 mt-0.5">{report.warning}</p>
        <p className="text-[10px] font-mono text-muted-foreground mt-1">
          Allowed channels: {report.allowed.join(", ")} · Blocked: {report.blocked.join(", ")}
        </p>
      </div>
    </div>
  );
}
