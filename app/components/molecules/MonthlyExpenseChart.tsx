import { TrendingUp, TrendingDown } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart"
import { motion } from "framer-motion"
import type { ExpenseByCategory } from "~/services/api"
import { formatCOP } from "~/services/api"

const chartConfig = {
  amount: { label: "Monto", color: "var(--color-chart-purple)" },
} satisfies ChartConfig

interface Props {
  data: ExpenseByCategory[];
}

export function MonthlyExpenseChart({ data }: Props) {
  const maxAmount = data.length > 0
    ? Math.max(...data.map((d) => parseFloat(d.amount)))
    : 300;

  const chartData = data.map((d) => ({
    category: d.category,
    amount: parseFloat(d.amount),
    fullMark: maxAmount,
  }));

  const total = data.reduce((s, d) => s + parseFloat(d.amount), 0);

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-4 text-white"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="text-sm font-semibold mb-3">Egresos mensuales por categoría</h3>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height={120}>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-xs">Sin datos</p>
            </div>
          ) : (
            <RadarChart data={chartData}>
              <defs>
                <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-cyan)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="var(--color-chart-purple)" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <PolarGrid stroke="var(--color-chart-gray)" strokeOpacity={0.3} />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 8, fill: "var(--color-chart-gray-light)" }} />
              <PolarRadiusAxis angle={90} domain={[0, maxAmount]} tick={{ fontSize: 6, fill: "var(--color-chart-gray-dark)" }} tickCount={3} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Radar
                dataKey="amount"
                stroke="var(--color-chart-cyan)"
                strokeWidth={2}
                fill="url(#radarGradient)"
                fillOpacity={0.6}
                dot={{ fill: "var(--color-chart-purple)", r: 2 }}
              />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>
      <div className="flex-col gap-1 text-xs mt-3">
        <div className="flex items-center gap-2 font-medium leading-none text-white">
          {data.length > 0 ? `${data.length} categorías activas este mes` : "Sin gastos registrados"}
        </div>
        <div className="leading-none text-gray-400 mt-1">
          Total: {formatCOP(total)}
        </div>
      </div>
    </motion.div>
  );
}
