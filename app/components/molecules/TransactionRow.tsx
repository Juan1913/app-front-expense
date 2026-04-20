import { motion } from "framer-motion";
import { Edit3, Trash2 } from "lucide-react";
import type { TransactionDTO } from "~/services/api";
import { formatCOPShort } from "~/services/api";

function categoryColor(name: string): string {
  const COLORS = ["#22d3ee","#a78bfa","#fb7185","#fbbf24","#34d399","#60a5fa","#f97316","#e879f9"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  tx: TransactionDTO;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionRow({ tx, onOpen, onEdit, onDelete }: Props) {
  const isIncome = tx.type === "INCOME";
  const color = categoryColor(tx.categoryName);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onOpen}
      className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer group"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ background: `${color}20`, border: `1px solid ${color}44`, color }}
      >
        {tx.categoryName[0]?.toUpperCase() ?? "?"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{tx.categoryName}</p>
          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
            isIncome ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
          }`}>
            {isIncome ? "IN" : "OUT"}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">
          {tx.description ? tx.description : <span className="italic text-gray-600">Sin descripción</span>}
          <span className="text-gray-600"> · {tx.accountName} · {formatTime(tx.date)}</span>
        </p>
      </div>

      <div className="text-right flex-shrink-0 flex items-center gap-2">
        <span className={`text-sm font-bold tabular-nums ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
          {isIncome ? "+" : "−"}{formatCOPShort(tx.amount)}
        </span>
        <div
          className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            <Edit3 className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
