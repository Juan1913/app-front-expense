import { motion } from "framer-motion";
import { PiggyBank } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

export interface SavingsRatePoint {
  label: string;
  /** savings rate = (income - expense) / income * 100 */
  rate: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const rate = payload[0].value as number;
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 font-semibold">{label}</p>
      <p className={`font-semibold tabular-nums mt-0.5 ${rate >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
        {rate.toFixed(1)}%
      </p>
    </div>
  );
}

interface Props {
  data: SavingsRatePoint[];
}

export function SavingsRateTrend({ data }: Props) {
  const hasData = data.length > 1;
  const avg = hasData ? data.reduce((s, d) => s + d.rate, 0) / data.length : 0;
  const last = data[data.length - 1]?.rate ?? 0;

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <PiggyBank className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-white text-base font-semibold">Tasa de ahorro</h3>
            <p className="text-gray-500 text-xs mt-0.5">% de ingresos ahorrados por mes</p>
          </div>
        </div>
        {hasData && (
          <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full flex-shrink-0 ${
            avg >= 20 ? "bg-emerald-500/15 text-emerald-400"
              : avg >= 0 ? "bg-amber-500/15 text-amber-400"
              : "bg-rose-500/15 text-rose-400"
          }`}>
            prom {avg.toFixed(0)}%
          </span>
        )}
      </div>

      <div className="h-52">
        {!hasData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-600">Necesitas al menos 2 meses de datos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={last >= 0 ? "#fbbf24" : "#fb7185"} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={last >= 0 ? "#fbbf24" : "#fb7185"} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <YAxis
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                width={38}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#fbbf24"
                strokeWidth={2}
                fill="url(#savingsGrad)"
                dot={{ fill: "#fbbf24", r: 3, stroke: "#0f0f12", strokeWidth: 1 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
