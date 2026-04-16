import { CheckCircle2, ArrowRight, Info } from "lucide-react";

interface SummaryFooterProps {
  title: string;
  objective: string;
  accomplishments: string[];
  nextStep?: { label: string; module?: string; onClick?: () => void };
  significance?: string;
}

const AnalysisSummaryFooter = ({ title, objective, accomplishments, nextStep, significance }: SummaryFooterProps) => (
  <div className="module-card border-t-2 border-primary/30 mt-6">
    <div className="flex items-center gap-2 mb-4">
      <Info className="w-4 h-4 text-primary" />
      <h3 className="text-xs font-mono text-primary uppercase tracking-wide">Analysis Summary — {title}</h3>
    </div>

    <div className="space-y-4">
      {/* Objective */}
      <div className="bg-secondary/50 rounded-md p-3">
        <span className="text-[10px] text-muted-foreground font-mono uppercase">Objective</span>
        <p className="text-sm text-foreground mt-1 leading-relaxed">{objective}</p>
      </div>

      {/* What was accomplished */}
      <div>
        <span className="text-[10px] text-muted-foreground font-mono uppercase mb-2 block">Key Accomplishments</span>
        <ul className="space-y-2">
          {accomplishments.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-chart-emerald mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Significance */}
      {significance && (
        <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
          <span className="text-[10px] text-muted-foreground font-mono uppercase">Scientific Significance</span>
          <p className="text-sm text-foreground mt-1 leading-relaxed">{significance}</p>
        </div>
      )}

      {/* Next Step */}
      {nextStep && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <ArrowRight className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground font-mono">NEXT →</span>
          {nextStep.onClick ? (
            <button onClick={nextStep.onClick} className="text-sm text-primary hover:underline font-medium">
              {nextStep.label}
            </button>
          ) : (
            <span className="text-sm text-primary font-medium">{nextStep.label}</span>
          )}
        </div>
      )}
    </div>
  </div>
);

export default AnalysisSummaryFooter;
