import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { generateClonalData } from "@/lib/seededRandom";

const defaultData = generateClonalData(123);

interface Props {
  data?: typeof defaultData;
}

const ClonalDynamicsChart = ({ data }: Props) => {
  const chartData = data || defaultData;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 20% 88%)" />
        <XAxis dataKey="timepoint" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "hsl(216 20% 85%)" }} />
        <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "hsl(216 20% 85%)" }} />
        <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(216 20% 88%)", borderRadius: 6, fontFamily: "IBM Plex Mono", fontSize: 11 }} />
        <Area type="monotone" dataKey="clone1" stackId="1" stroke="hsl(216 100% 21%)" fill="hsl(216 100% 21% / 0.3)" name="Clone A" />
        <Area type="monotone" dataKey="clone2" stackId="1" stroke="hsl(292 80% 60%)" fill="hsl(292 80% 60% / 0.3)" name="Clone B" />
        <Area type="monotone" dataKey="clone3" stackId="1" stroke="hsl(38 100% 55%)" fill="hsl(38 100% 55% / 0.3)" name="Clone C" />
        <Area type="monotone" dataKey="clone4" stackId="1" stroke="hsl(160 84% 45%)" fill="hsl(160 84% 45% / 0.3)" name="Clone D" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ClonalDynamicsChart;
