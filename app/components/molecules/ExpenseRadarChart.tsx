import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import type { ChartConfig } from "~/components/ui/chart";

const radarData = [
  {
    category: "Alimentación",
    actual: 85,
    presupuesto: 90,
  },
  {
    category: "Transporte",
    actual: 65,
    presupuesto: 70,
  },
  {
    category: "Entretenimiento", 
    actual: 40,
    presupuesto: 50,
  },
  {
    category: "Servicios",
    actual: 95,
    presupuesto: 80,
  },
  {
    category: "Compras",
    actual: 30,
    presupuesto: 60,
  },
  {
    category: "Salud",
    actual: 20,
    presupuesto: 40,
  },
];

const chartConfig = {
  actual: {
    label: "Gasto Real",
    color: "#139af5",
  },
  presupuesto: {
    label: "Presupuesto",
    color: "#10b981",
  },
} satisfies ChartConfig;

export function ExpenseRadarChart() {
  return (
    <div className="bg-secondary rounded-2xl p-6 text-white">
      <h3 className="text-xl font-semibold mb-4">Gastos vs Presupuesto por Categoría</h3>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <PolarGrid className="fill-[#334155] stroke-[#475569]" />
            <PolarAngleAxis 
              dataKey="category" 
              className="fill-white text-sm"
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]}
              className="fill-gray-400 text-xs"
            />
            <Radar
              name="Gasto Real"
              dataKey="actual"
              stroke="#139af5"
              fill="#139af5"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Presupuesto"
              dataKey="presupuesto"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}