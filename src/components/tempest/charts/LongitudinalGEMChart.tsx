import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Legend } from "recharts";
import { jsd } from "@/lib/stats/jsd";

interface TimepointPoint {
  label: string;
  fTTI: number;
  phi: number;
  jsd: number;
}

function defaultSeries(): TimepointPoint[] {
  // Realistic-looking but clearly demo: rising fTTI, dropping φ, JSD peak mid-trajectory
  const tps = ["D0", "D20", "D44", "D88", "D99", "D109", "D122"];
  return tps.map((t, i) => {
    const x = i / (tps.length - 1);
    const f = 1.5 + 6 * Math.pow(x, 1.4);
    const phi = 0.32 - 0.22 * Math.pow(x, 1.1);
    const j = 0.05 + 0.5 * Math.exp(-Math.pow((x - 0.55) / 0.18, 2));
    return { label: t, fTTI: +f.toFixed(3), phi: +Math.max(0, phi).toFixed(3), jsd: +j.toFixed(3) };
  });
}

export default function LongitudinalGEMChart({ points }: { points?: TimepointPoint[] }) {
  const data = points && points.length ? points : defaultSeries();
  const maxJsdIdx = data.reduce((mi, p, i, a) => (p.jsd > a[mi].jsd ? i : mi), 0);
  const win = [
    data[Math.max(0, maxJsdIdx - 1)].label,
    data[Math.min(data.length - 1, maxJsdIdx + 1)].label,
  ];

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <ReferenceArea x1={win[0]} x2={win[1]} fill="hsl(var(--chart-amber)/0.12)" label={{ value: "Bifurcation window (max JSD)", fontSize: 9, fill: "hsl(var(--chart-amber))" }} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
          <YAxis tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="fTTI" stroke="hsl(var(--primary))" strokeWidth={2.2} dot />
          <Line type="monotone" dataKey="phi" stroke="hsl(var(--chart-emerald))" strokeWidth={1.6} dot />
          <Line type="monotone" dataKey="jsd" stroke="hsl(var(--chart-magenta))" strokeWidth={1.6} dot />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-chart-amber font-mono">
        Retrospective longitudinal evidence; not prospective prediction.
      </p>
    </div>
  );
}

// re-export jsd for callers that want to drive the chart from real timepoint distributions
export { jsd };
