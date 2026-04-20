import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import type { ExpenseByCategory } from "~/services/api";
import { formatCOPShort } from "~/services/api";

const PALETTE = [
  "#22d3ee", // cyan
  "#a78bfa", // violet
  "#fb7185", // rose
  "#fbbf24", // amber
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f97316", // orange
];

interface Props {
  data: ExpenseByCategory[];
}

export function SpendingDonutChart({ data }: Props) {
  const chartData = data.map((d, i) => ({
    name: d.category,
    value: parseFloat(d.amount),
    percentage: parseFloat(d.percentage),
    color: PALETTE[i % PALETTE.length],
  }));

  const top = chartData[0];

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-4 text-white border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
        <h3 className="text-sm font-semibold">Gastos por Categoría</h3>
      </div>

      {chartData.length === 0 ? (
        <div className="py-10 text-center text-gray-500 text-xs">Sin gastos registrados</div>
      ) : (
        <>
          {/* Donut */}
          <div className="relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height={168}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={400}
                  animationDuration={900}
                  strokeWidth={0}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [formatCOPShort(v), ""]}
                  contentStyle={{
                    background: "#1c1c1c",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "#fff",
                    padding: "6px 10px",
                  }}
                  itemStyle={{ color: "#e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            {top && (
              <div className="absolute text-center pointer-events-none select-none">
                <div className="text-2xl font-bold" style={{ color: top.color }}>
                  {top.percentage.toFixed(0)}%
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 max-w-[64px] truncate leading-tight">
                  {top.name}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="space-y-2 border-t border-white/[0.05] pt-3 mt-1">
            {chartData.slice(0, 5).map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-gray-400 truncate flex-1">{d.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">{formatCOPShort(d.value)}</span>
                <span className="text-xs font-semibold w-8 text-right flex-shrink-0" style={{ color: d.color }}>
                  {d.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
