import { motion } from "framer-motion";
import type { TransactionDTO } from "~/services/api";
import { formatCOPShort } from "~/services/api";

const WEEKDAYS = ["D", "L", "M", "M", "J", "V", "S"];

const LEVEL_BG = [
  "bg-gray-800/50",
  "bg-violet-500/20",
  "bg-violet-500/40",
  "bg-violet-500/65",
  "bg-violet-500",
];

interface Props {
  transactions: TransactionDTO[];
}

export function SpendingHeatmap({ transactions }: Props) {
  // Aggregate expenses by day
  const daily: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE") continue;
    const key = tx.date.slice(0, 10);
    daily[key] = (daily[key] ?? 0) + parseFloat(tx.amount);
  }

  // 35-day grid ending at the Saturday of current week
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

  const days: { date: Date; amount: number; isFuture: boolean }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(endOfWeek);
    d.setDate(endOfWeek.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: d,
      amount: daily[key] ?? 0,
      isFuture: d > today,
    });
  }

  const amounts = days.filter((d) => !d.isFuture && d.amount > 0).map((d) => d.amount);
  const max = amounts.length > 0 ? Math.max(...amounts) : 0;
  const total = days.reduce((s, d) => s + d.amount, 0);
  const activeDays = days.filter((d) => !d.isFuture && d.amount > 0).length;

  function getLevel(amount: number, isFuture: boolean): number {
    if (isFuture || amount === 0 || max === 0) return 0;
    const ratio = amount / max;
    if (ratio > 0.75) return 4;
    if (ratio > 0.5) return 3;
    if (ratio > 0.25) return 2;
    return 1;
  }

  const weeks: typeof days[] = [];
  for (let w = 0; w < 5; w++) {
    weeks.push(days.slice(w * 7, (w + 1) * 7));
  }

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-4 border border-white/[0.04]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
        <h3 className="text-sm font-semibold text-white">Actividad Diaria</h3>
      </div>

      {/* Summary line */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-base font-bold text-white">{formatCOPShort(total)}</div>
          <div className="text-[10px] text-gray-500">últimas 5 semanas</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-violet-400">{activeDays}</div>
          <div className="text-[10px] text-gray-500">días activos</div>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-[3px] mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-[9px] text-gray-600 text-center font-semibold">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-[3px]">
            {week.map((day, di) => {
              const level = getLevel(day.amount, day.isFuture);
              const label = day.date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
              const title = day.isFuture
                ? label
                : `${label}: ${day.amount > 0 ? formatCOPShort(day.amount) : "Sin gasto"}`;
              return (
                <motion.div
                  key={di}
                  title={title}
                  className={`aspect-square rounded-sm ${LEVEL_BG[level]} ${day.isFuture ? "opacity-30" : ""} cursor-default hover:ring-1 hover:ring-white/30 transition-all`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: day.isFuture ? 0.3 : 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: (wi * 7 + di) * 0.006 }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
        <span className="text-[10px] text-gray-500">Menos</span>
        <div className="flex items-center gap-[3px]">
          {LEVEL_BG.map((bg, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${bg}`} />
          ))}
        </div>
        <span className="text-[10px] text-gray-500">Más</span>
      </div>
    </motion.div>
  );
}
