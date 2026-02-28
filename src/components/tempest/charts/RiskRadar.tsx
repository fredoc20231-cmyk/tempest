import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";

const defaultData = [
  { axis: "TMB", patient: 82, cohort: 55 },
  { axis: "MSI", patient: 45, cohort: 60 },
  { axis: "CNV", patient: 70, cohort: 40 },
  { axis: "Clonal", patient: 88, cohort: 50 },
  { axis: "Immune", patient: 60, cohort: 65 },
  { axis: "Neo-Ag", patient: 75, cohort: 48 },
];

interface Props {
  data?: typeof defaultData;
}

const RiskRadar = ({ data }: Props) => {
  const chartData = data || defaultData;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
        <PolarGrid stroke="hsl(216 20% 85%)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Patient" dataKey="patient" stroke="hsl(216 100% 21%)" fill="hsl(216 100% 21% / 0.2)" strokeWidth={2} />
        <Radar name="Cohort Avg" dataKey="cohort" stroke="hsl(292 80% 60%)" fill="hsl(292 80% 60% / 0.1)" strokeWidth={1.5} strokeDasharray="4 4" />
        <Legend wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default RiskRadar;
