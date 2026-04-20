import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCOPShort } from "~/services/api";

export interface DayOfMonthPoint {
  /** 1–31 */
  day: number;
  total: number;
  count: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const { total, count } = payload[0].payload;
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 font-semibold">Día {label}</p>
      <p className="text-white font-semibold tabular-nums mt-0.5">{formatCOPShort(total)}</p>
      <p className="text-gray-500 text-[10px]">{count} {count === 1 ? "transacción" : "transacciones"}</p>
    </div>
  );
}

interface Props {
  data: DayOfMonthPoint[];
}

export function DayOfMonthChart({ data }: Props) {
  const filled = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const found = data.find((d) => d.day === day);
    return {
      day,
      total: found?.total ?? 0,
      count: found?.count ?? 0,
    };
  });

  const max = Math.max(...filled.map((d) => d.total));
  const hasData = max > 0;
  // Highlight days in top 20% of max as "hot" days
  const hotThreshold = max * 0.75;

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-start gap-2 mb-3">
        <Calendar className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <h3 className="text-white text-base font-semibold">Días pico del mes</h3>
          <p className="text-gray-500 text-xs mt-0.5">Detecta días con gasto recurrente alto</p>
        </div>
      </div>

      <div className="h-52">
        {!hasData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-600">Sin gastos en este período</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filled} barCategoryGap={1}>
              <defs>
                <linearGradient id="domNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a78bfa" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="domHot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#fb7185" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#be123c" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                interval={2}
                tick={{ fontSize: 9, fill: "#6b7280" }}
              />
              <YAxis
                tickFormatter={(v) => formatCOPShort(v)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "#6b7280" }}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                {filled.map((d) => (
                  <Cell
                    key={d.day}
                    fill={d.total >= hotThreshold && d.total > 0 ? "url(#domHot)" : "url(#domNormal)"}
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
