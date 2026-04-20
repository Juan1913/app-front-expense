import { motion } from "framer-motion";
import { Target, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import type { BudgetComparison } from "~/services/api";
import { formatCOPShort } from "~/services/api";

interface Props {
  data: BudgetComparison[];
}

function getBudgetLevel(pct: number) {
  if (pct >= 100) return { bar: "bg-rose-500",    text: "text-rose-400",    badge: "bg-rose-500/15 text-rose-400" };
  if (pct >= 90)  return { bar: "bg-orange-500",  text: "text-orange-400",  badge: "bg-orange-500/15 text-orange-400" };
  if (pct >= 75)  return { bar: "bg-amber-500",   text: "text-amber-400",   badge: "bg-amber-500/15 text-amber-400" };
  return            { bar: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" };
}

export function BudgetVsActualChart({ data }: Props) {
  const navigate = useNavigate();
  const totalBudgeted = data.reduce((s, b) => s + parseFloat(b.budgeted), 0);
  const totalActual   = data.reduce((s, b) => s + parseFloat(b.actual),   0);
  const overallPct    = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;

  const sorted = [...data].sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  const top = sorted.slice(0, 5);
  const overallLevel = getBudgetLevel(overallPct);

  return (
    <motion.div
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white text-sm font-semibold">Presupuesto vs Real</h3>
          <p className="text-gray-500 text-xs mt-0.5">Cumplimiento por categoría</p>
        </div>
        {data.length > 0 && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${overallLevel.badge}`}>
            {overallPct.toFixed(0)}%
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="h-52 flex flex-col items-center justify-center text-center">
          <Target className="h-10 w-10 text-gray-700 mb-3" />
          <p className="text-sm text-gray-400 font-medium">Sin presupuestos configurados</p>
          <p className="text-xs text-gray-600 mt-1 mb-3 max-w-[220px]">
            Crea un presupuesto por categoría para ver tu cumplimiento aquí
          </p>
          <button
            onClick={() => navigate("/presupuestos")}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/15 transition-colors"
          >
            Crear presupuesto
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <>
          {/* Totals row */}
          <div className="flex items-center gap-4 mb-4 pb-3 border-b border-white/[0.05]">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Real</div>
              <div className="text-white font-bold text-sm">{formatCOPShort(totalActual)}</div>
            </div>
            <div className="text-gray-600 text-lg">/</div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Presupuesto</div>
              <div className="text-gray-400 font-semibold text-sm">{formatCOPShort(totalBudgeted)}</div>
            </div>
            <div className="flex-1" />
            {overallPct >= 100 && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
                Excedido
              </span>
            )}
          </div>

          {/* Category bars */}
          <div className="space-y-3">
            {top.map((b, i) => {
              const pct = parseFloat(b.percentage);
              const level = getBudgetLevel(pct);
              const displayPct = Math.min(pct, 100);
              return (
                <div key={b.categoryId}>
                  <div className="flex items-center justify-between mb-1 text-xs gap-2">
                    <span className="text-gray-300 font-medium truncate flex-1 min-w-0">{b.category}</span>
                    <span className="text-gray-500 flex-shrink-0 tabular-nums">
                      {formatCOPShort(b.actual)}
                      <span className="text-gray-600"> / {formatCOPShort(b.budgeted)}</span>
                    </span>
                    <span className={`font-semibold flex-shrink-0 w-10 text-right tabular-nums ${level.text}`}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/40 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className={`h-1.5 rounded-full ${level.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${displayPct}%` }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.08 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {data.length > 5 && (
            <p className="text-xs text-gray-600 mt-3 text-center">
              +{data.length - 5} categorías más
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}
