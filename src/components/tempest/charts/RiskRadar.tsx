import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

const defaultData = [
  { axis: "TMB", patient: 82, cohort: 55 },
  { axis: "MSI", patient: 45, cohort: 60 },
  { axis: "CNV", patient: 70, cohort: 40 },
  { axis: "Clonal", patient: 88, cohort: 50 },
  { axis: "Immune", patient: 60, cohort: 65 },
  { axis: "Neo-Ag", patient: 75, cohort: 48 },
];

const axisKey: Record<string, { full: string; symbol: string; description: string; highMeaning: string }> = {
  TMB: {
    full: "Tumor Mutational Burden",
    symbol: "TMB",
    description: "Total number of somatic mutations per megabase of tumor DNA. Higher values indicate greater genomic instability.",
    highMeaning: "May respond better to immune checkpoint inhibitors (ICIs); correlates with neoantigen load.",
  },
  MSI: {
    full: "Microsatellite Instability",
    symbol: "MSI",
    description: "Degree of instability in short tandem repeat regions due to defective mismatch repair (dMMR).",
    highMeaning: "MSI-high tumors often exhibit strong immune infiltration and favorable ICI response.",
  },
  CNV: {
    full: "Copy Number Variation",
    symbol: "CNV",
    description: "Extent of large-scale chromosomal gains or losses across the tumor genome.",
    highMeaning: "High CNV burden is associated with aggressive phenotypes, drug resistance, and chromosomal instability.",
  },
  Clonal: {
    full: "Clonal Architecture Score",
    symbol: "Clonal",
    description: "Measure of subclonal diversity derived from PyClone inference — reflects intra-tumor heterogeneity.",
    highMeaning: "Greater clonal diversity suggests evolutionary branching, treatment resistance risk, and immune evasion potential.",
  },
  Immune: {
    full: "Immune Infiltration Score",
    symbol: "Immune",
    description: "Composite score of immune cell signatures (CD8⁺ T cells, NK cells, macrophages) in the tumor microenvironment.",
    highMeaning: "Higher scores indicate a 'hot' tumor — more likely to benefit from immunotherapy; lower scores suggest immune exclusion.",
  },
  "Neo-Ag": {
    full: "Neoantigen Load",
    symbol: "Neo-Ag",
    description: "Count of predicted tumor-specific peptides (via NetMHCpan) that can be presented by MHC-I to T cells.",
    highMeaning: "Higher neoantigen diversity provides more targets for T cell recognition and vaccine design strategies.",
  },
};

function getInterpretation(data: typeof defaultData) {
  const dominated: string[] = [];
  const elevated: string[] = [];

  data.forEach((d) => {
    const diff = d.patient - d.cohort;
    if (diff >= 15) elevated.push(d.axis);
    if (diff <= -15) dominated.push(d.axis);
  });

  const lines: string[] = [];

  if (elevated.length > 0) {
    lines.push(
      `This patient scores notably above the cohort average in ${elevated.map((e) => `**${axisKey[e]?.full || e}**`).join(", ")}. ` +
      `Elevated ${elevated.includes("TMB") || elevated.includes("Neo-Ag") ? "mutational/neoantigen" : ""} axes suggest a potentially immunogenic tumor profile that may benefit from checkpoint blockade or neoantigen-directed therapy.`
    );
  }

  if (dominated.length > 0) {
    lines.push(
      `Conversely, below-average scores in ${dominated.map((e) => `**${axisKey[e]?.full || e}**`).join(", ")} indicate reduced ${dominated.includes("Immune") ? "immune engagement" : "signal"} relative to cohort, warranting investigation of immune exclusion mechanisms or NAD⁺-mediated T cell suppression pathways.`
    );
  }

  if (elevated.includes("Clonal")) {
    lines.push(
      "The high Clonal Architecture Score is consistent with late-stage evolutionary branching (bifurcation at D88–99), suggesting this tumor may have entered a multi-attractor regime with distinct subclonal programs."
    );
  }

  if (lines.length === 0) {
    lines.push(
      "This patient's risk profile is broadly consistent with the cohort average across all axes. No single dimension is markedly elevated or suppressed, suggesting a balanced risk landscape without clear immunotherapy advantage or exclusion signal."
    );
  }

  return lines;
}

interface Props {
  data?: typeof defaultData;
}

const RiskRadar = ({ data }: Props) => {
  const chartData = data || defaultData;
  const [showKey, setShowKey] = useState(false);
  const interpretation = getInterpretation(chartData);

  return (
    <div className="space-y-3">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Patient" dataKey="patient" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
          <Radar name="Cohort Avg" dataKey="cohort" stroke="hsl(292 80% 60%)" fill="hsl(292 80% 60% / 0.1)" strokeWidth={1.5} strokeDasharray="4 4" />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Symbol Key Toggle */}
      <button
        onClick={() => setShowKey(!showKey)}
        className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="h-3 w-3" />
        Axis Definitions
        {showKey ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {showKey && (
        <div className="border border-border rounded-md bg-muted/30 p-2 space-y-1.5">
          {chartData.map((d) => {
            const info = axisKey[d.axis];
            if (!info) return null;
            return (
              <div key={d.axis} className="grid grid-cols-[56px_1fr] gap-2 text-[10px]">
                <span className="font-mono font-semibold text-foreground">{info.symbol}</span>
                <div>
                  <span className="font-semibold text-foreground">{info.full}</span>
                  <span className="text-muted-foreground"> — {info.description}</span>
                  <div className="text-primary/80 mt-0.5">↑ High: {info.highMeaning}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interpretation */}
      <div className="border-t border-border pt-2 space-y-1.5">
        <p className="text-[10px] font-mono font-semibold text-foreground tracking-wide uppercase">Clinical Interpretation</p>
        {interpretation.map((line, i) => (
          <p key={i} className="text-[10px] leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }}
          />
        ))}
      </div>
    </div>
  );
};

export default RiskRadar;
