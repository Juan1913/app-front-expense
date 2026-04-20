import { motion } from "framer-motion";
import { Edit3, Trash2, CalendarClock, CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import type { WishlistDTO } from "~/services/api";
import { formatCOPShort } from "~/services/api";

function wishColor(name: string): string {
  const COLORS = ["#22d3ee","#a78bfa","#fb7185","#fbbf24","#34d399","#60a5fa","#f97316","#e879f9"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function daysUntil(deadline: string | null): { days: number; expired: boolean } | null {
  if (!deadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(deadline + "T00:00:00");
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  return { days: diff, expired: diff < 0 };
}

function deadlineStyle(days: number, expired: boolean) {
  if (expired)    return { bg: "bg-rose-500/15",   text: "text-rose-400",    label: `hace ${Math.abs(days)}d` };
  if (days === 0) return { bg: "bg-rose-500/15",   text: "text-rose-400",    label: "vence hoy" };
  if (days <= 7)  return { bg: "bg-rose-500/15",   text: "text-rose-400",    label: `${days}d restantes` };
  if (days <= 30) return { bg: "bg-amber-500/15",  text: "text-amber-400",   label: `${days}d restantes` };
  return          { bg: "bg-gray-700/30",   text: "text-gray-400",    label: `${days}d restantes` };
}

interface Props {
  wish: WishlistDTO;
  delay: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function WishlistCard({ wish, delay, onOpen, onEdit, onDelete }: Props) {
  const color = wishColor(wish.name);
  const pct = Math.min(parseFloat(wish.progressPercentage), 100);
  const remaining = parseFloat(wish.targetAmount) - parseFloat(wish.currentAmount);
  const deadline = daysUntil(wish.deadline);
  const dStyle = deadline ? deadlineStyle(deadline.days, deadline.expired) : null;
  const isCompleted = wish.status === "COMPLETED";
  const isCancelled = wish.status === "CANCELLED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onOpen}
      className={`bg-secondary rounded-2xl p-5 border border-white/[0.04] group cursor-pointer hover:border-white/[0.1] transition-colors relative overflow-hidden ${isCancelled ? "opacity-60" : ""}`}
    >
      {/* Accent gradient bg */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }}
      />

      <div className="relative">
        {/* Top row: icon + status */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold select-none flex-shrink-0"
            style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}
          >
            {wish.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex items-center gap-1.5">
            {isCompleted && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" /> Completado
              </span>
            )}
            {isCancelled && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 border border-white/[0.04]">
                <XCircle className="h-3 w-3" /> Cancelado
              </span>
            )}
            <div
              className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onEdit}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Name + description */}
        <h3 className="text-white font-bold text-base truncate mb-0.5">{wish.name}</h3>
        <p className="text-xs text-gray-500 truncate mb-4 min-h-[16px]">
          {wish.description || <span className="italic text-gray-600">Sin descripción</span>}
        </p>

        {/* Amounts */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Ahorrado</div>
            <div className="text-xl font-bold text-white tabular-nums">{formatCOPShort(wish.currentAmount)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Meta {formatCOPShort(wish.targetAmount)}</div>
            <div className="text-lg font-bold tabular-nums" style={{ color }}>
              {pct.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700/40 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-2 rounded-full"
            style={{ background: isCompleted ? "#34d399" : color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, delay: delay + 0.2 }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            {dStyle ? (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${dStyle.bg} ${dStyle.text}`}>
                <CalendarClock className="h-3 w-3" />
                {dStyle.label}
              </span>
            ) : (
              <span className="text-[10px] text-gray-600">Sin fecha límite</span>
            )}
            {!isCompleted && !isCancelled && remaining > 0 && (
              <span className="text-[10px] text-gray-500 tabular-nums">
                faltan <span className="text-white font-semibold">{formatCOPShort(remaining)}</span>
              </span>
            )}
          </div>
          <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            {isCompleted ? <><Sparkles className="h-3 w-3" /> Ver</> : <>Ver <ArrowRight className="h-3 w-3" /></>}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
