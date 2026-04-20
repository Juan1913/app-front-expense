import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
// Week starts on Monday
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

interface Props {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}

function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()   === b.getMonth()
      && a.getDate()    === b.getDate();
}

export function DatePicker({
  value, onChange, placeholder = "Elige una fecha", allowClear = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = value ? new Date(value + "T00:00:00") : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Re-sync view month when external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  const year  = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday = 0
  const startDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selected = value ? new Date(value + "T00:00:00") : null;

  function handleSelect(d: Date) {
    onChange(toISO(d));
    setOpen(false);
  }

  const display = value
    ? new Date(value + "T00:00:00").toLocaleDateString("es-CO", {
        day: "numeric", month: "long", year: "numeric",
      })
    : placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 bg-secondary text-white px-3 py-2.5 rounded-xl border border-gray-700 hover:border-gray-600 text-sm text-left transition-colors"
      >
        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className={value ? "text-white flex-1 truncate" : "text-gray-500 flex-1"}>
          {display}
        </span>
        {value && allowClear && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1f] border border-white/[0.08] rounded-xl shadow-2xl p-3 z-30"
          >
            {/* Month navigator */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-white">
                {MONTHS_ES[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="text-center text-[10px] text-gray-600 font-semibold uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const isToday    = sameDay(d, today);
                const isSelected = selected ? sameDay(d, selected) : false;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(d)}
                    className={`h-8 rounded-md text-xs font-medium transition-colors tabular-nums ${
                      isSelected
                        ? "bg-cyan-500 text-white"
                        : isToday
                        ? "bg-white/[0.06] text-white ring-1 ring-cyan-500/40"
                        : "text-gray-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.05]">
              <button
                type="button"
                onClick={() => handleSelect(today)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Hoy
              </button>
              {value && allowClear && (
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); }}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
