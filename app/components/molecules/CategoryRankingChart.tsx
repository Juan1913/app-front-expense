import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCOPShort } from "~/services/api";

export interface CategoryRankItem {
  name: string;
  total: number;
  /** Total in the previous period (same duration). Undefined → no comparison. */
  previousTotal?: number | null;
}

function catColor(name: string): string {
  const COLORS = ["#22d3ee","#a78bfa","#fb7185","#fbbf24","#34d399","#60a5fa","#f97316","#e879f9"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

interface Props {
  items: CategoryRankItem[];
  /** How many top items to render. */
  limit?: number;
  /** Title & subtitle for the card. */
  title?: string;
  subtitle?: string;
}

export function CategoryRankingChart({
  items, limit = 8,
  title = "Top categorías de gasto",
  subtitle = "Dónde está yendo tu dinero",
}: Props) {
  const sorted = [...items].sort((a, b) => b.total - a.total).slice(0, limit);
  const max = sorted[0]?.total ?? 1;
  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-4">
        <h3 className="text-white text-base font-semibold">{title}</h3>
        <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
      </div>

      {sorted.length === 0 ? (
        <div className="py-10 text-center text-xs text-gray-600">Sin gastos en este período</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, i) => {
            const color = catColor(item.name);
            const width = max > 0 ? (item.total / max) * 100 : 0;
            const pctOfTotal = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
            const prev = item.previousTotal;
            const delta = prev != null && prev > 0
              ? ((item.total - prev) / prev) * 100
              : null;
            const Icon = delta == null ? null : (Math.abs(delta) < 0.5 ? Minus : (delta > 0 ? TrendingUp : TrendingDown));

            return (
              <div key={item.name}>
                <div className="flex items-center justify-between gap-2 mb-1 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-gray-200 font-medium truncate">{item.name}</span>
                    <span className="text-gray-600 tabular-nums flex-shrink-0">
                      {pctOfTotal.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {Icon && delta != null && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${
                        Math.abs(delta) < 0.5 ? "text-gray-500"
                          : delta > 0 ? "text-rose-400"   // spending more → bad
                                      : "text-emerald-400" // spending less → good
                      }`}>
                        <Icon className="h-3 w-3" />
                        {Math.abs(delta).toFixed(0)}%
                      </span>
                    )}
                    <span className="text-white font-semibold tabular-nums">
                      {formatCOPShort(item.total)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-700/40 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-1.5 rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 + 0.2 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > limit && (
        <p className="text-[11px] text-gray-600 text-center mt-4 pt-3 border-t border-white/[0.05]">
          +{items.length - limit} categorías más
        </p>
      )}
    </motion.div>
  );
}
