import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = Array.from({ length: 20 }, (_, i) => {
  const t = i / 19;
  const clone1 = Math.max(0, 60 * (1 - t) + (Math.random() - 0.5) * 5);
  const clone2 = Math.max(0, 20 + 30 * t * (1 - t * 0.5) + (Math.random() - 0.5) * 3);
  const clone3 = Math.max(0, 5 + 25 * t * t + (Math.random() - 0.5) * 3);
  const clone4 = Math.max(0, 2 + 10 * Math.pow(t, 3) + (Math.random() - 0.5) * 2);
  return { timepoint: `T${i}`, clone1, clone2, clone3, clone4 };
});

const ClonalDynamicsChart = () => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
      <XAxis dataKey="timepoint" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "hsl(222 30% 18%)" }} />
      <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "hsl(222 30% 18%)" }} />
      <Tooltip contentStyle={{ background: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 6, fontFamily: "IBM Plex Mono", fontSize: 11 }} />
      <Area type="monotone" dataKey="clone1" stackId="1" stroke="hsl(187 100% 50%)" fill="hsl(187 100% 50% / 0.3)" name="Clone A" />
      <Area type="monotone" dataKey="clone2" stackId="1" stroke="hsl(292 80% 60%)" fill="hsl(292 80% 60% / 0.3)" name="Clone B" />
      <Area type="monotone" dataKey="clone3" stackId="1" stroke="hsl(38 100% 55%)" fill="hsl(38 100% 55% / 0.3)" name="Clone C" />
      <Area type="monotone" dataKey="clone4" stackId="1" stroke="hsl(160 84% 45%)" fill="hsl(160 84% 45% / 0.3)" name="Clone D" />
    </AreaChart>
  </ResponsiveContainer>
);

export default ClonalDynamicsChart;
