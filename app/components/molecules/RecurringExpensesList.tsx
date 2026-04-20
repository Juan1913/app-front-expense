import { motion } from "framer-motion";
import { Repeat, TrendingDown } from "lucide-react";
import type { TransactionDTO } from "~/services/api";
import { formatCOPShort } from "~/services/api";

export interface RecurringItem {
  key: string;
  label: string;         // display label (description or category)
  categoryName: string;
  amount: number;        // typical amount
  occurrences: number;
  totalSpent: number;    // occurrences * amount (approx)
  lastDate: string;      // ISO date of latest occurrence
}

function catColor(name: string): string {
  const COLORS = ["#22d3ee","#a78bfa","#fb7185","#fbbf24","#34d399","#60a5fa","#f97316","#e879f9"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

interface Props {
  items: RecurringItem[];
  limit?: number;
}

export function RecurringExpensesList({ items, limit = 5 }: Props) {
  const top = [...items]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);

  return (
    <motion.div
      className="bg-secondary rounded-2xl border border-white/[0.04] overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-start gap-2">
        <Repeat className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <h3 className="text-white text-base font-semibold">Gastos recurrentes detectados</h3>
          <p className="text-gray-500 text-xs mt-0.5">Posibles suscripciones o pagos fijos</p>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <TrendingDown className="h-8 w-8 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No se detectaron pagos recurrentes</p>
          <p className="text-[10px] text-gray-600 mt-1 max-w-[240px] mx-auto">
            Buscamos gastos con la misma descripción y monto que se repiten al menos 2 veces
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {top.map((r) => {
            const color = catColor(r.categoryName);
            return (
              <div key={r.key} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}
                >
                  {r.categoryName[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{r.label}</p>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 flex-shrink-0">
                      ×{r.occurrences}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {r.categoryName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold tabular-nums text-rose-400">
                    −{formatCOPShort(r.amount)}
                  </div>
                  <div className="text-[10px] text-gray-500 tabular-nums">
                    c/u · total {formatCOPShort(r.totalSpent)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
