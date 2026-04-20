import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatCOPShort } from "~/services/api";

export interface CumulativePoint {
  label: string; // short date label e.g. "12 abr"
  net: number;   // cumulative net (income - expense) up to this date
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value as number;
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 font-semibold">{label}</p>
      <p className={`font-semibold tabular-nums mt-0.5 ${value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
        {value >= 0 ? "+" : "−"}{formatCOPShort(Math.abs(value))}
      </p>
    </div>
  );
}

interface Props {
  data: CumulativePoint[];
}

export function CumulativeTrendChart({ data }: Props) {
  const hasData = data.length > 1;
  const last = data.length > 0 ? data[data.length - 1].net : 0;
  const positive = last >= 0;

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <Activity className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-white text-base font-semibold">Balance acumulado</h3>
            <p className="text-gray-500 text-xs mt-0.5">Sube = ahorras · Baja = gastas más</p>
          </div>
        </div>
        {hasData && (
          <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full flex-shrink-0 ${
            positive
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-rose-500/15 text-rose-400"
          }`}>
            {positive ? "+" : "−"}{formatCOPShort(Math.abs(last))}
          </span>
        )}
      </div>

      <div className="h-52">
        {!hasData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-600">Sin datos suficientes</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cumPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="cumNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#fb7185" stopOpacity={0.0} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "#6b7280" }}
                interval="preserveStartEnd"
                minTickGap={25}
              />
              <YAxis
                tickFormatter={(v) => formatCOPShort(v)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "#6b7280" }}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="net"
                stroke={positive ? "#34d399" : "#fb7185"}
                strokeWidth={2}
                fill={positive ? "url(#cumPos)" : "url(#cumNeg)"}
                dot={false}
                activeDot={{ r: 4, fill: positive ? "#34d399" : "#fb7185", stroke: "#0f0f12", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
