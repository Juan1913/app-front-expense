import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
  { month: "Julio", income: 285000, expenses: 165000 },
  { month: "Agosto", income: 310000, expenses: 175000 },
  { month: "Septiembre", income: 295000, expenses: 155000 },
  { month: "Octubre", income: 275000, expenses: 145000 },
  { month: "Noviembre", income: 315000, expenses: 185000 },
  { month: "Diciembre", income: 290000, expenses: 170000 },
]

const chartConfig = {
  income: {
    label: "Ingresos",
  },
  expenses: {
    label: "Egresos",
  },
} satisfies ChartConfig

export function TrendAreaChart() {
  return (
    <div className="bg-secondary rounded-2xl p-6">
      <h3 className="text-white text-lg font-semibold mb-4">Ingresos vs Egresos</h3>
      <div className="text-gray-400 text-sm mb-4">
        Tendencia anual de ingresos y egresos
      </div>
      <div className="h-64 flex items-center justify-center">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="expenses"
              type="natural"
              fill="#ef4444"
              fillOpacity={0.4}
              stroke="#ef4444"
              stackId="a"
            />
            <Area
              dataKey="income"
              type="natural"
              fill="#3b82f6"
              fillOpacity={0.4}
              stroke="#3b82f6"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </div>
      <div className="flex w-full items-start gap-2 text-sm mt-4">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 font-medium leading-none text-white">
            Balance positivo aumentó 12% este año <TrendingUp className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 leading-none text-gray-400">
            Análisis completo del año actual
          </div>
        </div>
      </div>
    </div>
  )
}