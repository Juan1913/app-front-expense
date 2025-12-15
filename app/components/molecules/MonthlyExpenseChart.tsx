import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart"
import type { ChartConfig } from "~/components/ui/chart"
import { motion } from "framer-motion"

const chartData = [
  {
    category: "Alimentación",
    amount: 275,
    fullMark: 300
  },
  {
    category: "Transporte", 
    amount: 200,
    fullMark: 300
  },
  {
    category: "Entretenimiento",
    amount: 187,
    fullMark: 300
  },
  {
    category: "Servicios",
    amount: 173,
    fullMark: 300
  },
  {
    category: "Otros",
    amount: 90,
    fullMark: 300
  },
]

const chartConfig = {
  amount: {
    label: "Monto (miles)",
    color: "#8b5cf6",
  },
} satisfies ChartConfig

export function MonthlyExpenseChart() {
  const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0) * 1000

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
          <RadarChart data={chartData}>
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <PolarGrid stroke="#374151" strokeOpacity={0.3} />
            <PolarAngleAxis 
              dataKey="category"
              tick={{ fontSize: 8, fill: '#9CA3AF' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 300]}
              tick={{ fontSize: 6, fill: '#6B7280' }}
              tickCount={3}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Radar
              dataKey="amount"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#radarGradient)"
              fillOpacity={0.6}
              dot={{ fill: "#8b5cf6", r: 2 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="flex-col gap-1 text-xs mt-3">
        <div className="flex items-center gap-2 font-medium leading-none text-white">
          Gastos aumentaron 5.2% <TrendingUp className="h-3 w-3" />
        </div>
        <div className="leading-none text-gray-400 mt-1">
          Total: ${totalAmount.toLocaleString()} COP
        </div>
      </div>
    </motion.div>
  );
}