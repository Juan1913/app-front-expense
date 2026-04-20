import { motion } from "framer-motion";
import { Coffee, Sun } from "lucide-react";
import { formatCOPShort } from "~/services/api";

interface Props {
  weekdayTotal: number;
  weekdayCount: number;
  weekendTotal: number;
  weekendCount: number;
}

export function WeekendVsWeekday({
  weekdayTotal, weekdayCount, weekendTotal, weekendCount,
}: Props) {
  const hasData = weekdayTotal > 0 || weekendTotal > 0;
  // Per-day average so 5 weekdays vs 2 weekend days is comparable.
  const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;
  const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0;
  const max = Math.max(weekdayAvg, weekendAvg, 1);

  const heavierOnWeekend = weekendAvg > weekdayAvg;
  const diff = weekdayAvg > 0 && weekendAvg > 0
    ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100
    : null;

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04] flex flex-col"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-5">
        <h3 className="text-white text-base font-semibold">Gastos semana vs fin de semana</h3>
        <p className="text-gray-500 text-xs mt-0.5">Cuánto sueles gastar en un día típico</p>
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-xs text-gray-600">Sin gastos en este período</p>
        </div>
      ) : (
        <>
          {/* Weekday row */}
          <DayRow
            icon={<Sun className="h-4 w-4" />}
            label="Entre semana"
            subtitle="Lun a Vie"
            avg={weekdayAvg}
            barPct={(weekdayAvg / max) * 100}
            color="#60a5fa"
            highlighted={!heavierOnWeekend && weekdayAvg > 0}
          />

          <div className="h-3" />

          {/* Weekend row */}
          <DayRow
            icon={<Coffee className="h-4 w-4" />}
            label="Fin de semana"
            subtitle="Sáb y Dom"
            avg={weekendAvg}
            barPct={(weekendAvg / max) * 100}
            color="#fb7185"
            highlighted={heavierOnWeekend && weekendAvg > 0}
          />

          {/* Verdict */}
          {diff != null && Math.abs(diff) >= 5 && (
            <p className="text-xs text-gray-400 text-center mt-5 pt-4 border-t border-white/[0.05]">
              Gastas{" "}
              <span className={`font-bold tabular-nums ${heavierOnWeekend ? "text-rose-400" : "text-cyan-400"}`}>
                {Math.abs(diff).toFixed(0)}%{" "}
                {heavierOnWeekend ? "más" : "menos"}
              </span>{" "}
              los fines de semana
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}

function DayRow({
  icon, label, subtitle, avg, barPct, color, highlighted,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  avg: number;
  barPct: number;
  color: string;
  highlighted: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          highlighted ? "" : "opacity-70"
        }`}
        style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <div>
            <div className="text-sm font-semibold text-white">{label}</div>
            <div className="text-[10px] text-gray-500">{subtitle}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums" style={{ color: highlighted ? color : "#e5e7eb" }}>
              {formatCOPShort(avg)}
            </div>
            <div className="text-[10px] text-gray-500">por día</div>
          </div>
        </div>
        <div className="w-full bg-gray-700/40 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-1.5 rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  );
}
