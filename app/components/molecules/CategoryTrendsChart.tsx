import { motion } from "framer-motion";
import { LineChart as LineChartIcon } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatCOPShort } from "~/services/api";

const LINE_COLORS = ["#22d3ee", "#a78bfa", "#fb7185", "#fbbf24"];

export interface CategoryTrendPoint {
  label: string;                       // month label
  [categoryName: string]: number | string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 font-semibold mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300 truncate max-w-[120px]">{p.dataKey}:</span>
          <span className="text-white font-semibold tabular-nums">{formatCOPShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  data: CategoryTrendPoint[];
  categories: string[]; // top N category names that are keys in each point
}

export function CategoryTrendsChart({ data, categories }: Props) {
  const hasData = data.length > 1 && categories.length > 0;

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-start gap-2 mb-3">
        <LineChartIcon className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <h3 className="text-white text-base font-semibold">Top categorías en el tiempo</h3>
          <p className="text-gray-500 text-xs mt-0.5">Cómo evoluciona tu gasto por categoría</p>
        </div>
      </div>

      <div className="h-52">
        {!hasData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-600">Necesitas al menos 2 meses de datos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <YAxis
                tickFormatter={(v) => formatCOPShort(v)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "#6b7280" }}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
              {categories.map((cat, i) => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: LINE_COLORS[i % LINE_COLORS.length], r: 3, stroke: "#0f0f12", strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {hasData && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.05] flex-wrap">
          {categories.map((cat, i) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: LINE_COLORS[i % LINE_COLORS.length] }} />
              <span className="text-[11px] text-gray-400 truncate max-w-[100px]">{cat}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
