import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCOPShort } from "~/services/api";

// Week starts on Monday for this visualization
const WEEKDAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const { total, count, avg } = payload[0].payload;
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-gray-400 mb-1.5 font-semibold">{label}</p>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-300">Total:</span>
          <span className="text-white font-semibold tabular-nums">{formatCOPShort(total)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-300">Transacciones:</span>
          <span className="text-white font-semibold tabular-nums">{count}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-300">Promedio:</span>
          <span className="text-white font-semibold tabular-nums">{formatCOPShort(avg)}</span>
        </div>
      </div>
    </div>
  );
}

export interface WeekdayPoint {
  /** 0 = Mon, 6 = Sun */
  day: number;
  total: number;
  count: number;
}

interface Props {
  data: WeekdayPoint[];
}

export function WeekdayHistogram({ data }: Props) {
  // Ensure all 7 days present (fill zeros)
  const filled = Array.from({ length: 7 }, (_, i) => {
    const found = data.find((d) => d.day === i);
    return {
      day: i,
      label: WEEKDAYS_ES[i],
      total: found?.total ?? 0,
      count: found?.count ?? 0,
      avg:   found && found.count > 0 ? found.total / found.count : 0,
    };
  });

  const max = Math.max(...filled.map((d) => d.total));
  const hasData = max > 0;
  const peakDay = hasData ? filled.reduce((a, b) => (b.total > a.total ? b : a)) : null;

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <h3 className="text-white text-base font-semibold">Gasto por día de la semana</h3>
          <p className="text-gray-500 text-xs mt-0.5">En qué días gastas más</p>
        </div>
        {peakDay && peakDay.total > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Flame className="h-3 w-3" />
            Pico: {peakDay.label}
          </span>
        )}
      </div>

      <div className="h-56">
        {!hasData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-600">Sin gastos en este período</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filled} barCategoryGap="18%">
              <defs>
                <linearGradient id="weekdayNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a78bfa" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id="weekdayPeak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#fb7185" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#be123c" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickMargin={6}
              />
              <YAxis
                tickFormatter={(v) => formatCOPShort(v)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)", radius: 4 }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {filled.map((d) => (
                  <Cell
                    key={d.day}
                    fill={peakDay && d.day === peakDay.day ? "url(#weekdayPeak)" : "url(#weekdayNormal)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
