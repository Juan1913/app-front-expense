import { TrendingUp, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from "recharts"
import { motion } from "framer-motion"
import type { MonthlySummary } from "~/services/api"
import { formatCOPShort } from "~/services/api"

interface Props {
  data: MonthlySummary[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-gray-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name === "income" ? "Ingresos" : "Gastos"}:</span>
          <span className="text-white font-semibold">{formatCOPShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function IncomeExpenseBarChart({ data }: Props) {
  const chartData = data.map((m) => ({
    month: m.monthName.slice(0, 3),
    income:   parseFloat(m.income),
    expenses: parseFloat(m.expenses),
  }));

  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const trend =
    last && prev && parseFloat(prev.income) > 0
      ? (((parseFloat(last.income) - parseFloat(prev.income)) / parseFloat(prev.income)) * 100).toFixed(1)
      : null;
  const trendUp = trend !== null && parseFloat(trend) >= 0;

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white text-sm font-semibold">Ingresos vs Gastos</h3>
          <p className="text-gray-500 text-xs mt-0.5">Comparación mensual</p>
        </div>
        {trend !== null && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trendUp ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
          }`}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(parseFloat(trend))}%
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-52">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-600 text-sm">Sin datos disponibles</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="35%" barGap={3}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickMargin={8}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)", radius: 4 }} />
              <Bar dataKey="income"   fill="url(#incomeGrad)"  radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expenses" fill="url(#expenseGrad)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-xs text-gray-400">Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />
          <span className="text-xs text-gray-400">Gastos</span>
        </div>
        {chartData.length > 0 && (
          <span className="text-xs text-gray-600 ml-auto">
            últimos {chartData.length} meses
          </span>
        )}
      </div>
    </motion.div>
  );
}
