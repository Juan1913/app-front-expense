import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { motion } from "framer-motion"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"

const chartData = [
  {
    month: "Ene",
    ahorro: 45,
    meta: 100
  },
  {
    month: "Feb", 
    ahorro: 60,
    meta: 100
  },
  {
    month: "Mar",
    ahorro: 55,
    meta: 100
  },
  {
    month: "Abr",
    ahorro: 75,
    meta: 100
  },
  {
    month: "May",
    ahorro: 65,
    meta: 100
  },
  {
    month: "Jun",
    ahorro: 80,
    meta: 100
  },
]

const chartConfig = {
  ahorro: {
    label: "Ahorro Actual",
    color: "hsl(var(--color-chart-cyan))",
  },
  meta: {
    label: "Meta",
    color: "hsl(var(--color-chart-purple))",
  },
} satisfies ChartConfig

export function ExpensePieChart() {
  const averageProgress = chartData.reduce((acc, curr) => acc + curr.ahorro, 0) / chartData.length

  return (
    <motion.div 
      className="bg-secondary rounded-2xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h3 className="text-white text-lg font-semibold mb-4">Meta de Ahorro Mensual</h3>
      <div className="text-gray-400 text-sm mb-4">
        Progreso de ahorro últimos 6 meses
      </div>
      <div className="h-64 flex items-center justify-center">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <AreaChart 
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-cyan)" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="var(--color-chart-cyan)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-gray)" strokeOpacity={0.3} />
            <XAxis 
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-chart-gray-light)' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: 'var(--color-chart-gray-dark)' }}
              domain={[0, 100]}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Area
              type="monotone"
              dataKey="ahorro"
              stroke="var(--color-chart-cyan)"
              strokeWidth={2}
              fill="url(#areaGradient)"
              dot={{ fill: "var(--color-chart-cyan)", r: 3 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
      <div className="flex-col gap-2 text-sm mt-4">
        <div className="flex items-center gap-2 font-medium leading-none text-white">
          Ahorro aumentó 15% este mes <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-gray-400 mt-2">
          Promedio mensual: 63% de la meta
        </div>
      </div>
    </motion.div>
  )
}