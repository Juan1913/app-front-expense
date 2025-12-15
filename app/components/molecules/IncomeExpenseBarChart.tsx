import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { motion } from "framer-motion"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"

const chartData = [
  { month: "Enero", income: 186000, expenses: 80000 },
  { month: "Febrero", income: 305000, expenses: 200000 },
  { month: "Marzo", income: 237000, expenses: 120000 },
  { month: "Abril", income: 273000, expenses: 190000 },
  { month: "Mayo", income: 209000, expenses: 130000 },
  { month: "Junio", income: 214000, expenses: 140000 },
]

const chartConfig = {
  income: {
    label: "Ingresos",
  },
  expenses: {
    label: "Gastos",
  },
} satisfies ChartConfig

export function IncomeExpenseBarChart() {
  return (
    <motion.div 
      className="bg-secondary rounded-2xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-white text-lg font-semibold mb-4">Ingresos vs Gastos</h3>
      <div className="text-gray-400 text-sm mb-4">
        Comparación mensual últimos 6 meses
      </div>
      <div className="h-64 flex items-center justify-center">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart accessibilityLayer data={chartData}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.9}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.9}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="income" fill="url(#incomeGradient)" radius={4} />
            <Bar dataKey="expenses" fill="url(#expenseGradient)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="flex-col items-start gap-2 text-sm mt-4">
        <div className="flex gap-2 font-medium leading-none text-white">
          Ingresos aumentaron 5.2% este mes <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-gray-400 mt-2">
          Mostrando datos de los últimos 6 meses
        </div>
      </div>
    </motion.div>
  )
}