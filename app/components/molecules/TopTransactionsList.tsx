import { motion } from "framer-motion";
import { Flame, TrendingDown } from "lucide-react";
import type { TransactionDTO } from "~/services/api";
import { formatCOPShort } from "~/services/api";

function catColor(name: string): string {
  const COLORS = ["#22d3ee","#a78bfa","#fb7185","#fbbf24","#34d399","#60a5fa","#f97316","#e879f9"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function formatTxDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

interface Props {
  transactions: TransactionDTO[];
  limit?: number;
}

export function TopTransactionsList({ transactions, limit = 5 }: Props) {
  // Only expenses, sorted by amount desc
  const top = transactions
    .filter((t) => t.type === "EXPENSE")
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, limit);

  return (
    <motion.div
      className="bg-secondary rounded-2xl border border-white/[0.04] overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
        <Flame className="h-4 w-4 text-rose-400" />
        <h3 className="text-white text-base font-semibold">Gastos más grandes</h3>
        <span className="text-[11px] text-gray-500">· útil para detectar anomalías</span>
      </div>

      {top.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <TrendingDown className="h-8 w-8 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Sin gastos en este período</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {top.map((tx, i) => {
            const color = catColor(tx.categoryName);
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="text-[11px] font-bold text-gray-600 tabular-nums w-5 flex-shrink-0">
                  #{i + 1}
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}
                >
                  {tx.categoryName[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{tx.categoryName}</p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {tx.description ? tx.description : tx.accountName} · {formatTxDate(tx.date)}
                  </p>
                </div>
                <div className="text-sm font-bold tabular-nums text-rose-400 flex-shrink-0">
                  −{formatCOPShort(tx.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
