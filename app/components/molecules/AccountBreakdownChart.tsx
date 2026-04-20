import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCOPShort } from "~/services/api";

const PALETTE = ["#22d3ee","#a78bfa","#fb7185","#fbbf24","#34d399","#60a5fa","#f97316","#e879f9"];

export interface AccountBreakdownItem {
  name: string;
  total: number;
}

interface Props {
  items: AccountBreakdownItem[];
  /** Override title/subtitle/icon for reuse (e.g. income sources). */
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  emptyLabel?: string;
}

export function AccountBreakdownChart({
  items,
  title = "Gasto por cuenta",
  subtitle = "En qué cuenta mueves más dinero",
  icon = <CreditCard className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />,
  emptyLabel = "Sin datos en este período",
}: Props) {
  const sorted = [...items].sort((a, b) => b.total - a.total);
  const grandTotal = sorted.reduce((s, i) => s + i.total, 0);

  const chartData = sorted.map((item, i) => ({
    name: item.name,
    value: item.total,
    percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
    color: PALETTE[i % PALETTE.length],
  }));

  const top = chartData[0];

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-start gap-2 mb-3">
        {icon}
        <div className="min-w-0">
          <h3 className="text-white text-base font-semibold">{title}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-600">{emptyLabel}</div>
      ) : (
        <>
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
                  strokeWidth={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
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
            {top && (
              <div className="absolute text-center pointer-events-none select-none">
                <div className="text-xl font-bold" style={{ color: top.color }}>
                  {top.percentage.toFixed(0)}%
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 max-w-[70px] truncate leading-tight">
                  {top.name}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.05] space-y-2">
            {chartData.slice(0, 4).map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-gray-300 truncate flex-1">{d.name}</span>
                <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">{formatCOPShort(d.value)}</span>
                <span className="text-xs font-semibold w-8 text-right tabular-nums flex-shrink-0" style={{ color: d.color }}>
                  {d.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
            {chartData.length > 4 && (
              <p className="text-[10px] text-gray-600 text-center pt-1">
                +{chartData.length - 4} cuentas más
              </p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
