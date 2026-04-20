import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  delay?: number;
  icon: React.ReactNode;
  gradient: string;
  label: string;
  value: string;
  subtext?: string;
  /** Percentage change vs previous period. Undefined if no comparison available. */
  change?: number | null;
  /** When true, negative change is "good" (e.g. for expenses). Colors invert. */
  invertColors?: boolean;
}

export function MetricsKpiCard({
  delay = 0, icon, gradient, label, value, subtext, change, invertColors,
}: Props) {
  const hasChange = change !== null && change !== undefined && isFinite(change);
  const up = hasChange && change! > 0;
  const flat = hasChange && Math.abs(change!) < 0.01;
  // For expenses / liabilities, "up" (more spent) is bad → red
  const goodUp    = invertColors ? false : true;
  const trendColor = flat
    ? "text-gray-500"
    : (up === goodUp ? "text-emerald-400" : "text-rose-400");
  const trendBg = flat
    ? "bg-gray-700/40"
    : (up === goodUp ? "bg-emerald-500/10" : "bg-rose-500/10");
  const Icon = flat ? Minus : (up ? TrendingUp : TrendingDown);

  return (
    <motion.div
      className="bg-secondary rounded-xl p-4 border border-white/[0.04] relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-[11px] text-gray-400 uppercase tracking-widest">{label}</div>
        <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {icon}
        </div>
      </div>
      <div className="text-[22px] font-bold text-white leading-tight truncate tabular-nums">{value}</div>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {hasChange && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${trendColor} ${trendBg}`}>
            <Icon className="h-3 w-3" />
            {flat ? "0%" : `${Math.abs(change!).toFixed(1)}%`}
          </span>
        )}
        {subtext && <span className="text-[11px] text-gray-500 truncate">{subtext}</span>}
      </div>
    </motion.div>
  );
}
