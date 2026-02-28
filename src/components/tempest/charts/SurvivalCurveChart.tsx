import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = Array.from({ length: 25 }, (_, i) => ({
  month: i * 2,
  treated: Math.max(0, 100 * Math.exp(-0.02 * i) + (Math.random() - 0.5) * 3),
  control: Math.max(0, 100 * Math.exp(-0.05 * i) + (Math.random() - 0.5) * 4),
  combined: Math.max(0, 100 * Math.exp(-0.015 * i) + (Math.random() - 0.5) * 2),
}));

const SurvivalCurveChart = () => (
  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
      <XAxis dataKey="month" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "hsl(222 30% 18%)" }} label={{ value: "Months", position: "insideBottom", offset: -2, fill: "hsl(215 20% 55%)", fontSize: 10 }} />
      <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "hsl(222 30% 18%)" }} domain={[0, 100]} label={{ value: "Survival %", angle: -90, position: "insideLeft", fill: "hsl(215 20% 55%)", fontSize: 10 }} />
      <Tooltip contentStyle={{ background: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 6, fontFamily: "IBM Plex Mono", fontSize: 11 }} />
      <Legend wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
      <Line type="stepAfter" dataKey="treated" stroke="hsl(187 100% 50%)" strokeWidth={2} dot={false} name="Treated" />
      <Line type="stepAfter" dataKey="control" stroke="hsl(292 80% 60%)" strokeWidth={2} dot={false} name="Control" />
      <Line type="stepAfter" dataKey="combined" stroke="hsl(38 100% 55%)" strokeWidth={2} dot={false} name="Combined" />
    </LineChart>
  </ResponsiveContainer>
);

export default SurvivalCurveChart;
