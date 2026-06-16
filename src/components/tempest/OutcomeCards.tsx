import type { OutcomeInterpretation } from "@/lib/intelligence/outcomeInterpreter";
import type { DatasetContext } from "@/lib/intelligence/dataIntelligenceEngine";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Microscope,
  Target,
  TestTube2,
} from "lucide-react";

interface Props {
  context: DatasetContext;
  interpretation: OutcomeInterpretation;
}

const Card = ({
  title,
  icon: Icon,
  tone = "default",
  children,
}: {
  title: string;
  icon: any;
  tone?: "default" | "warn" | "ok";
  children: React.ReactNode;
}) => (
  <div
    className={`module-card border ${
      tone === "warn"
        ? "border-chart-amber/40 bg-chart-amber/5"
        : tone === "ok"
        ? "border-chart-emerald/40 bg-chart-emerald/5"
        : "border-border"
    }`}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-primary" />
      <h3 className="text-xs font-mono uppercase tracking-wide text-foreground">{title}</h3>
    </div>
    <div className="text-sm text-foreground/85 leading-relaxed">{children}</div>
  </div>
);

export default function OutcomeCards({ context, interpretation }: Props) {
  const validityTone =
    context.validity_status === "full_fTTI_valid"
      ? "ok"
      : context.validity_status === "invalid_metadata"
      ? "warn"
      : "warn";

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Primary outcome" icon={Target} tone="ok">
        {interpretation.primary_outcome}
      </Card>
      <Card title="Evidence type" icon={Activity}>
        <span className="font-mono text-xs">{context.evidence_type}</span>
      </Card>
      <Card title="Validity status" icon={CheckCircle2} tone={validityTone as any}>
        <span className="font-mono text-xs">{context.validity_status}</span>
        {context.min_per_group != null && (
          <span className="text-xs text-muted-foreground"> · min n/group = {context.min_per_group}</span>
        )}
      </Card>
      <Card title="Biological interpretation" icon={Microscope}>
        {interpretation.biological_interpretation}
      </Card>
      <Card title="Statistical interpretation" icon={FileText}>
        {interpretation.statistical_interpretation}
      </Card>
      <Card title="Reviewer risk flags" icon={AlertTriangle} tone="warn">
        <ul className="list-disc list-inside text-xs space-y-1">
          {interpretation.reviewer_risk_flags.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </Card>
      <Card title="Next best validation step" icon={TestTube2}>
        {interpretation.next_best_validation_step}
      </Card>
      <Card title="Manuscript-safe summary" icon={BookOpen} tone="ok">
        <p className="text-xs italic whitespace-pre-wrap">{interpretation.manuscript_safe_summary}</p>
        {interpretation.limitations.length > 0 && (
          <div className="mt-2 text-[11px] text-muted-foreground">
            <strong>Limitations:</strong>
            <ul className="list-disc list-inside">
              {interpretation.limitations.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
