import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";

// Generates bifurcation-style trajectory data based on the manuscript's
// dynamical systems framework: single attractor → branch point → multi-attractor
function generateBifurcationData() {
  const timepoints = [
    { day: 0, label: "D0" },
    { day: 20, label: "D20" },
    { day: 21, label: "D21" },
    { day: 52, label: "D52" },
    { day: 88, label: "D88" },
    { day: 99, label: "D99" },
    { day: 109, label: "D109" },
    { day: 122, label: "D122" },
  ];

  return timepoints.map(({ day, label }) => {
    const t = day / 122;
    // Main trajectory (attractor 1) — dominant clone path
    const main = 0.1 + 0.85 * Math.pow(t, 1.3);
    // Branch trajectory (attractor 2) — divergent path post-bifurcation
    const branch = day >= 88 ? 0.1 + 0.6 * Math.pow((day - 88) / 34, 1.5) : null;
    // Entropy (heterogeneity) — peaks at branch point
    const entropy = 0.15 + 0.55 * Math.exp(-Math.pow((day - 95) / 25, 2));
    // Epigenetic potential (landscape barrier) — drops at bifurcation
    const potential = Math.max(0.1, 0.9 - 0.7 * Math.pow(t, 0.8));

    return {
      timepoint: label,
      day,
      mainTrajectory: Math.round(main * 100) / 100,
      branchTrajectory: branch !== null ? Math.round(branch * 100) / 100 : undefined,
      entropy: Math.round(entropy * 100) / 100,
      potential: Math.round(potential * 100) / 100,
    };
  });
}

const defaultData = generateBifurcationData();

interface Props {
  data?: typeof defaultData;
}

const BifurcationChart = ({ data }: Props) => {
  const chartData = data || defaultData;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 20% 88%)" />
        <ReferenceArea
          x1="D88"
          x2="D99"
          fill="hsl(38 100% 55% / 0.08)"
          label={{ value: "Bifurcation Window", position: "insideTop", fontSize: 9, fill: "hsl(38 100% 45%)", fontFamily: "IBM Plex Mono" }}
        />
        <ReferenceLine
          x="D99"
          stroke="hsl(38 100% 55% / 0.5)"
          strokeDasharray="4 4"
          label={{ value: "μ > 0", position: "top", fontSize: 9, fill: "hsl(38 100% 55%)", fontFamily: "IBM Plex Mono" }}
        />
        <XAxis
          dataKey="timepoint"
          tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
          axisLine={{ stroke: "hsl(216 20% 85%)" }}
        />
        <YAxis
          tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
          axisLine={{ stroke: "hsl(216 20% 85%)" }}
          domain={[0, 1]}
          tickFormatter={(v) => v.toFixed(1)}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(216 20% 88%)",
            borderRadius: 6,
            fontFamily: "IBM Plex Mono",
            fontSize: 11,
          }}
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              mainTrajectory: "Attractor 1 (Dominant)",
              branchTrajectory: "Attractor 2 (Divergent)",
              entropy: "Transcriptomic Entropy S(t)",
              potential: "Epigenetic Barrier U(x)",
            };
            return [value?.toFixed(3) || "—", labels[name] || name];
          }}
        />
        <Line
          type="monotone"
          dataKey="mainTrajectory"
          stroke="hsl(216 100% 21%)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "hsl(216 100% 21%)" }}
          name="mainTrajectory"
        />
        <Line
          type="monotone"
          dataKey="branchTrajectory"
          stroke="hsl(292 80% 60%)"
          strokeWidth={2.5}
          strokeDasharray="6 3"
          dot={{ r: 4, fill: "hsl(292 80% 60%)" }}
          connectNulls={false}
          name="branchTrajectory"
        />
        <Line
          type="monotone"
          dataKey="entropy"
          stroke="hsl(38 100% 55%)"
          strokeWidth={1.5}
          dot={{ r: 3, fill: "hsl(38 100% 55%)" }}
          name="entropy"
        />
        <Line
          type="monotone"
          dataKey="potential"
          stroke="hsl(160 84% 45%)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          dot={{ r: 3, fill: "hsl(160 84% 45%)" }}
          name="potential"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BifurcationChart;
