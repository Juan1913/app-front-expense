import { DashboardLayout } from "~/components/templates";
import { motion } from "framer-motion";
import {
  Loader2, Sliders, RotateCcw, TrendingUp, TrendingDown,
  Calendar, Gift, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import {
  Area, Line, ComposedChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import {
  transactions, accounts, categories, wishlist, formatCOP, formatCOPShort,
  type TransactionDTO, type AccountDTO, type CategoryDTO, type WishlistDTO,
} from "~/services/api";
import {
  buildDailySeries,
  linearRegression,
  applyScenario,
  daysToGoal,
  NEUTRAL_SCENARIO,
  type DailySeriesPoint,
  type ScenarioParams,
} from "~/lib/finance-math";

// ─── Period config ──────────────────────────────────────────────────────────

type Period = "1M" | "3M" | "6M";

const PERIODS: { value: Period; label: string; days: number }[] = [
  { value: "1M", label: "1 mes",   days: 30  },
  { value: "3M", label: "3 meses", days: 90  },
  { value: "6M", label: "6 meses", days: 180 },
];

const HORIZON_DAYS = 180; // proyectamos 6 meses hacia adelante

function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function shortDate(d: Date): string {
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Simulador() {
  const [period, setPeriod] = useState<Period>("3M");
  const [txns, setTxns] = useState<TransactionDTO[]>([]);
  const [cats, setCats] = useState<CategoryDTO[]>([]);
  const [accountList, setAccountList] = useState<AccountDTO[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scenario, setScenario] = useState<ScenarioParams>(NEUTRAL_SCENARIO);
  const [showAllCats, setShowAllCats] = useState(false);

  const range = useMemo(() => {
    const now = new Date();
    const p = PERIODS.find((x) => x.value === period)!;
    const from = new Date(now); from.setDate(from.getDate() - p.days);
    return { from, to: now };
  }, [period]);

  useEffect(() => {
    setLoading(true);
    const filters = { fromDate: toISO(range.from), toDate: toISO(range.to) };
    Promise.all([
      transactions.list({ ...filters, size: 2000, page: 0 }),
      accounts.list(),
      categories.list(),
      wishlist.list({ status: "ACTIVE" }),
    ])
      .then(([r, a, c, w]) => {
        setTxns(r.content);
        setAccountList(a);
        setCats(c);
        setWishlistItems(w);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  const currentBalance = useMemo(
    () => accountList.reduce((s, a) => s + parseFloat(a.balance || "0"), 0),
    [accountList],
  );

  // Series y modelos
  const baseline = useMemo(() => buildDailySeries(txns, range.from, range.to), [txns, range.from, range.to]);
  const scenarioSeries = useMemo(
    () => applyScenario(txns, scenario, range.from, range.to),
    [txns, scenario, range.from, range.to],
  );

  const baselineModel = useModel(baseline);
  const scenarioModel = useModel(scenarioSeries);

  // Datos del gráfico: real + proyección baseline + proyección escenario
  const chartData = useMemo(() => {
    if (baseline.length === 0) return [] as ChartRow[];
    const lastDate = baseline[baseline.length - 1].date;
    const lastT = baseline[baseline.length - 1].t;

    const rows: ChartRow[] = baseline.map((p, i) => ({
      label: shortDate(p.date),
      real: p.cumNet,
      baseProj: undefined,
      scenProj: undefined,
      delta: scenarioSeries[i] ? scenarioSeries[i].cumNet - p.cumNet : 0,
    }));

    const baseLast = baseline[baseline.length - 1].cumNet;
    const scenLast = scenarioSeries[scenarioSeries.length - 1].cumNet;

    for (let i = 1; i <= HORIZON_DAYS; i++) {
      const d = new Date(lastDate); d.setDate(d.getDate() + i);
      const t = lastT + i;
      const baseY = baselineModel.reg.slope * t + baselineModel.reg.intercept;
      const scenY = scenarioModel.reg.slope * t + scenarioModel.reg.intercept;
      // Anclamos las proyecciones al último valor real para que no salten visualmente.
      const baseAdj = baseY - (baselineModel.reg.slope * lastT + baselineModel.reg.intercept) + baseLast;
      const scenAdj = scenY - (scenarioModel.reg.slope * lastT + scenarioModel.reg.intercept) + scenLast;
      rows.push({
        label: shortDate(d),
        real: undefined,
        baseProj: baseAdj,
        scenProj: scenAdj,
        delta: scenAdj - baseAdj,
      });
    }
    return rows;
  }, [baseline, scenarioSeries, baselineModel, scenarioModel]);

  // ── Categorías candidatas para recortar (top por gasto, sólo EXPENSE) ─────
  const topExpenseCats = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of txns) {
      if (t.type !== "EXPENSE") continue;
      if (!t.categoryId) continue;
      const amt = parseFloat(t.amount);
      if (!isFinite(amt)) continue;
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + amt);
    }
    const items = cats
      .filter((c) => c.type === "EXPENSE")
      .map((c) => ({ id: c.id, name: c.name, total: totals.get(c.id) ?? 0 }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
    return items;
  }, [cats, txns]);

  const visibleCats = showAllCats ? topExpenseCats : topExpenseCats.slice(0, 6);
  const hiddenCount = Math.max(0, topExpenseCats.length - 6);

  // ─── Wishlist projections ────────────────────────────────────────────────
  const wishlistProjection = useMemo(() => {
    const baseDaily = baselineModel.dailyNet;
    const scenDaily = scenarioModel.dailyNet;
    return wishlistItems
      .map((w) => {
        const target = parseFloat(w.targetAmount);
        const current = parseFloat(w.currentAmount);
        const remaining = Math.max(0, target - current);
        return {
          id: w.id,
          name: w.name,
          remaining,
          baseDays: daysToGoal(remaining, baseDaily),
          scenDays: daysToGoal(remaining, scenDaily),
        };
      })
      .sort((a, b) => (a.scenDays ?? Infinity) - (b.scenDays ?? Infinity));
  }, [wishlistItems, baselineModel, scenarioModel]);

  // ─── Métricas comparativas ───────────────────────────────────────────────
  const baseRunway = computeRunway(currentBalance, baselineModel.dailyNet);
  const scenRunway = computeRunway(currentBalance, scenarioModel.dailyNet);
  const baseSavingsPct = computeSavingsPct(baselineModel.totalIncome, baselineModel.totalExpense);
  const scenSavingsPct = computeSavingsPct(scenarioModel.totalIncome, scenarioModel.totalExpense);

  const monthlyImpact = (scenarioModel.dailyNet - baselineModel.dailyNet) * 30;
  const yearlyImpact  = (scenarioModel.dailyNet - baselineModel.dailyNet) * 365;
  const isNeutral = scenario.expenseCut === 0
    && scenario.extraIncomeMonthly === 0
    && scenario.incomeBoost === 0
    && Object.values(scenario.categoryCuts).every((v) => !v);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-cyan-400" /> Simulador
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              ¿Qué pasa si recortás gastos, subís ingresos o ajustás categorías? Mové los controles y mirá el impacto en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setScenario(NEUTRAL_SCENARIO)}
              disabled={isNeutral}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-secondary text-gray-400 hover:text-white border border-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </button>
            <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5 border border-white/[0.04]">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    period === p.value
                      ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : baseline.length < 3 ? (
          <div className="text-center py-16">
            <Sliders className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Datos insuficientes para simular</p>
            <p className="text-xs text-gray-600 mt-1">Registrá más transacciones o ampliá el período</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* ── Sliders panel ─────────────────────────────────────────── */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-secondary rounded-2xl p-5 border border-white/[0.04] space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-white text-base font-semibold">Controles</h3>
                </div>

                <SliderField
                  label="Recorte global de gasto"
                  value={scenario.expenseCut * 100}
                  min={0} max={50} step={1} suffix="%"
                  onChange={(v) => setScenario((s) => ({ ...s, expenseCut: v / 100 }))}
                  hint={scenario.expenseCut > 0 ? `Reduce todo el gasto ${(scenario.expenseCut * 100).toFixed(0)}%` : "Recortar parejo todas las categorías"}
                />

                <SliderField
                  label="Aumento de ingreso"
                  value={scenario.incomeBoost * 100}
                  min={0} max={50} step={1} suffix="%"
                  onChange={(v) => setScenario((s) => ({ ...s, incomeBoost: v / 100 }))}
                  hint={scenario.incomeBoost > 0 ? `+${(scenario.incomeBoost * 100).toFixed(0)}% sobre tus ingresos actuales` : "Subida salarial o nuevos ingresos"}
                />

                <SliderField
                  label="Ingreso extra mensual"
                  value={scenario.extraIncomeMonthly}
                  min={0} max={5_000_000} step={50_000} suffix=""
                  formatter={(v) => formatCOPShort(v)}
                  onChange={(v) => setScenario((s) => ({ ...s, extraIncomeMonthly: v }))}
                  hint={scenario.extraIncomeMonthly > 0 ? `+${formatCOP(scenario.extraIncomeMonthly)} cada mes` : "Freelance, renta, side-project…"}
                />
              </div>

              <div className="bg-secondary rounded-2xl p-5 border border-white/[0.04] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-white text-base font-semibold">Recorte por categoría</h3>
                  <span className="text-[10px] text-gray-500">se acumula con el global</span>
                </div>

                {topExpenseCats.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-4">No hay gastos en este período</p>
                ) : (
                  <>
                    {visibleCats.map((c) => (
                      <SliderField
                        key={c.id}
                        label={c.name}
                        sublabel={formatCOPShort(c.total)}
                        value={(scenario.categoryCuts[c.id] ?? 0) * 100}
                        min={0} max={100} step={5} suffix="%"
                        compact
                        onChange={(v) => setScenario((s) => ({
                          ...s,
                          categoryCuts: { ...s.categoryCuts, [c.id]: v / 100 },
                        }))}
                      />
                    ))}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => setShowAllCats((v) => !v)}
                        className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white py-1.5 mt-1 border-t border-white/[0.04] pt-3"
                      >
                        {showAllCats ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {showAllCats ? "Mostrar menos" : `Ver ${hiddenCount} más`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Resultados ────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Impact banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`rounded-2xl p-5 border ${
                  isNeutral
                    ? "bg-secondary border-white/[0.04]"
                    : monthlyImpact >= 0
                      ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30"
                      : "bg-gradient-to-br from-rose-500/10 to-amber-500/5 border-rose-500/30"
                }`}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ImpactStat
                    label="Impacto mensual"
                    value={isNeutral ? "—" : `${monthlyImpact >= 0 ? "+" : "−"}${formatCOPShort(Math.abs(monthlyImpact))}`}
                    color={isNeutral ? "text-gray-300" : monthlyImpact >= 0 ? "text-emerald-400" : "text-rose-400"}
                    hint="diferencia neta vs hoy"
                  />
                  <ImpactStat
                    label="Impacto anual"
                    value={isNeutral ? "—" : `${yearlyImpact >= 0 ? "+" : "−"}${formatCOPShort(Math.abs(yearlyImpact))}`}
                    color={isNeutral ? "text-gray-300" : yearlyImpact >= 0 ? "text-emerald-400" : "text-rose-400"}
                    hint="extrapolado a 12 meses"
                  />
                  <ImpactStat
                    label="Tasa de ahorro"
                    value={`${(scenSavingsPct * 100).toFixed(1)}%`}
                    color={scenSavingsPct >= baseSavingsPct ? "text-emerald-400" : "text-rose-400"}
                    hint={`hoy ${(baseSavingsPct * 100).toFixed(1)}%`}
                  />
                </div>
              </motion.div>

              {/* Comparison KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ComparisonCard
                  icon={<Calendar className="h-4 w-4 text-white" />}
                  gradient="from-amber-400 to-orange-600"
                  label="Runway"
                  baseValue={formatRunway(baseRunway)}
                  scenValue={formatRunway(scenRunway)}
                  delta={runwayDelta(baseRunway, scenRunway)}
                />
                <ComparisonCard
                  icon={<TrendingUp className="h-4 w-4 text-white" />}
                  gradient="from-emerald-400 to-teal-600"
                  label="Ahorro neto / día"
                  baseValue={formatSigned(baselineModel.dailyNet)}
                  scenValue={formatSigned(scenarioModel.dailyNet)}
                  delta={formatDelta(scenarioModel.dailyNet - baselineModel.dailyNet)}
                />
                <ComparisonCard
                  icon={<TrendingDown className="h-4 w-4 text-white" />}
                  gradient="from-rose-400 to-red-600"
                  label="Gasto / día"
                  baseValue={formatCOPShort(baselineModel.dailyExpense)}
                  scenValue={formatCOPShort(scenarioModel.dailyExpense)}
                  delta={formatDelta(scenarioModel.dailyExpense - baselineModel.dailyExpense, true)}
                  invert
                />
              </div>

              {/* Comparison chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
              >
                <div className="flex items-start gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white text-base font-semibold">Proyección comparativa de balance</h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Línea sólida = balance real · trazos = proyección a {HORIZON_DAYS} días con tu ritmo actual vs el escenario
                    </p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tickLine={false} axisLine={false}
                        tick={{ fontSize: 9, fill: "#6b7280" }}
                        interval="preserveStartEnd" minTickGap={30}
                      />
                      <YAxis
                        tickFormatter={(v) => formatCOPShort(v)}
                        tickLine={false} axisLine={false}
                        tick={{ fontSize: 9, fill: "#6b7280" }} width={56}
                      />
                      <Tooltip content={<ScenarioTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="real" stroke="#34d399" strokeWidth={2} fill="#34d399" fillOpacity={0.15} dot={false} name="Real" />
                      <Line type="monotone" dataKey="baseProj" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Proyección actual" connectNulls />
                      <Line type="monotone" dataKey="scenProj" stroke="#22d3ee" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Proyección escenario" connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 flex-wrap mt-3 pt-3 border-t border-white/[0.04]">
                  <Legend color="#34d399" label="Balance real" />
                  <Legend color="#fbbf24" label="Proyección actual" dashed />
                  <Legend color="#22d3ee" label="Proyección escenario" dashed />
                </div>
              </motion.div>

              {/* Wishlist projection */}
              {wishlistProjection.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
                >
                  <div className="flex items-start gap-2 mb-4">
                    <Gift className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-white text-base font-semibold">Lista de deseos — tiempo para alcanzarla</h3>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Días estimados al ritmo de ahorro actual vs escenario
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {wishlistProjection.map((w) => (
                      <WishlistRow key={w.id} item={w} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SliderFieldProps {
  label: string;
  sublabel?: string;
  value: number;
  min: number; max: number; step: number;
  suffix?: string;
  hint?: string;
  compact?: boolean;
  formatter?: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderField({
  label, sublabel, value, min, max, step, suffix, hint, compact, formatter, onChange,
}: SliderFieldProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = formatter ? formatter(value) : `${value.toFixed(0)}${suffix ?? ""}`;
  return (
    <div className={compact ? "" : "space-y-1.5"}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs text-gray-300 truncate">{label}</span>
          {sublabel && <span className="text-[10px] text-gray-600 tabular-nums">{sublabel}</span>}
        </div>
        <span className={`text-xs font-semibold tabular-nums ${value > 0 ? "text-cyan-300" : "text-gray-500"}`}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-black/40"
        style={{
          background: `linear-gradient(to right, rgba(34,211,238,0.7) 0%, rgba(34,211,238,0.7) ${pct}%, rgba(0,0,0,0.4) ${pct}%, rgba(0,0,0,0.4) 100%)`,
        }}
      />
      {!compact && hint && <p className="text-[10px] text-gray-600">{hint}</p>}
    </div>
  );
}

function ImpactStat({ label, value, color, hint }: { label: string; value: string; color: string; hint: string }) {
  return (
    <div>
      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{label}</div>
      <div className={`text-2xl font-bold tabular-nums mt-1 ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{hint}</div>
    </div>
  );
}

function ComparisonCard({
  icon, gradient, label, baseValue, scenValue, delta, invert,
}: {
  icon: React.ReactNode; gradient: string;
  label: string; baseValue: string; scenValue: string;
  delta: { text: string; positive: boolean | null };
  invert?: boolean;
}) {
  const positive = delta.positive === null
    ? null
    : invert ? !delta.positive : delta.positive;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-secondary rounded-xl p-4 border border-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-[11px] text-gray-400 uppercase tracking-widest">{label}</div>
        <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {icon}
        </div>
      </div>
      <div className="space-y-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] text-gray-500">hoy</span>
          <span className="text-sm text-gray-400 tabular-nums">{baseValue}</span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] text-cyan-400">escenario</span>
          <span className="text-base text-white font-bold tabular-nums">{scenValue}</span>
        </div>
        {delta.text && (
          <div className={`text-[11px] font-semibold tabular-nums text-right ${
            positive === null ? "text-gray-500" : positive ? "text-emerald-400" : "text-rose-400"
          }`}>
            {delta.text}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function WishlistRow({ item }: {
  item: { id: string; name: string; remaining: number; baseDays: number | null; scenDays: number | null };
}) {
  const baseLabel = formatDays(item.baseDays);
  const scenLabel = formatDays(item.scenDays);
  const diff = item.baseDays !== null && item.scenDays !== null
    ? item.baseDays - item.scenDays
    : null;
  const speedup = diff !== null && diff > 0;
  const slowdown = diff !== null && diff < 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm text-white truncate">{item.name}</span>
          <span className="text-[11px] text-gray-500 tabular-nums">faltan {formatCOPShort(item.remaining)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">hoy: <span className="text-gray-300 tabular-nums">{baseLabel}</span></span>
          <span className="text-cyan-400">escenario: <span className="font-semibold tabular-nums">{scenLabel}</span></span>
          {diff !== null && diff !== 0 && (
            <span className={`text-[11px] font-semibold tabular-nums ${speedup ? "text-emerald-400" : "text-rose-400"}`}>
              {speedup ? "−" : "+"}{Math.round(Math.abs(diff))}d
            </span>
          )}
          {slowdown === false && diff === null && item.scenDays === null && (
            <span className="text-[11px] text-rose-400 font-semibold">no alcanza</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-[2px] w-4 rounded"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`
            : color,
        }}
      />
      <span className="text-[11px] text-gray-400">{label}</span>
    </div>
  );
}

function ScenarioTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const get = (k: string) => payload.find((p: any) => p.dataKey === k)?.value as number | undefined;
  const real = get("real"), base = get("baseProj"), scen = get("scenProj");
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="text-gray-400 font-semibold mb-1">{label}</p>
      {real !== undefined && <p className="text-emerald-400 tabular-nums">Real: {formatCOP(real)}</p>}
      {base !== undefined && <p className="text-amber-400 tabular-nums">Actual: {formatCOP(base)}</p>}
      {scen !== undefined && <p className="text-cyan-400 tabular-nums">Escenario: {formatCOP(scen)}</p>}
      {base !== undefined && scen !== undefined && (
        <p className={`pt-1 border-t border-white/[0.06] tabular-nums ${scen >= base ? "text-emerald-400" : "text-rose-400"}`}>
          Δ: {scen >= base ? "+" : "−"}{formatCOPShort(Math.abs(scen - base))}
        </p>
      )}
    </div>
  );
}

// ─── Hooks & helpers ─────────────────────────────────────────────────────────

interface SeriesModel {
  reg: ReturnType<typeof linearRegression>;
  dailyNet: number;
  dailyExpense: number;
  totalIncome: number;
  totalExpense: number;
}

function useModel(series: DailySeriesPoint[]): SeriesModel {
  return useMemo(() => {
    if (series.length === 0) {
      return {
        reg: { slope: 0, intercept: 0, r2: 0, stdError: 0, n: 0 },
        dailyNet: 0, dailyExpense: 0, totalIncome: 0, totalExpense: 0,
      };
    }
    const xs = series.map((p) => p.t);
    const ys = series.map((p) => p.cumNet);
    const reg = linearRegression(xs, ys);
    const totalIncome  = series.reduce((s, p) => s + p.income,  0);
    const totalExpense = series.reduce((s, p) => s + p.expense, 0);
    const dailyNet     = (totalIncome - totalExpense) / series.length;
    const dailyExpense = totalExpense / series.length;
    return { reg, dailyNet, dailyExpense, totalIncome, totalExpense };
  }, [series]);
}

interface ChartRow {
  label: string;
  real?: number;
  baseProj?: number;
  scenProj?: number;
  delta: number;
}

function computeRunway(balance: number, dailyNet: number): number | null {
  if (dailyNet >= 0) return null;
  return balance / -dailyNet;
}

function computeSavingsPct(income: number, expense: number): number {
  if (income <= 0) return 0;
  return Math.max(-1, Math.min(1, (income - expense) / income));
}

function formatRunway(r: number | null): string {
  if (r === null) return "∞";
  if (!isFinite(r) || r > 36500) return "∞";
  if (r >= 365) return `${(r / 365).toFixed(1)}a`;
  return `${Math.floor(r)}d`;
}

function runwayDelta(base: number | null, scen: number | null): { text: string; positive: boolean | null } {
  if (base === null && scen === null) return { text: "ambos infinitos", positive: null };
  if (base === null) return { text: "ya no es infinito", positive: false };
  if (scen === null) return { text: "ahora es infinito ∞", positive: true };
  const d = scen - base;
  if (Math.abs(d) < 1) return { text: "sin cambio", positive: null };
  return {
    text: `${d > 0 ? "+" : "−"}${Math.round(Math.abs(d))}d`,
    positive: d > 0,
  };
}

function formatSigned(v: number): string {
  if (Math.abs(v) < 1) return "$0";
  return `${v >= 0 ? "+" : "−"}${formatCOPShort(Math.abs(v))}`;
}

function formatDelta(d: number, _isExpense?: boolean): { text: string; positive: boolean | null } {
  if (Math.abs(d) < 1) return { text: "sin cambio", positive: null };
  return {
    text: `${d >= 0 ? "+" : "−"}${formatCOPShort(Math.abs(d))}`,
    positive: d > 0,
  };
}

function formatDays(d: number | null): string {
  if (d === null) return "no alcanza";
  if (d <= 0) return "ya cumplido";
  if (d < 30) return `${Math.round(d)}d`;
  if (d < 365) return `${(d / 30).toFixed(1)} meses`;
  return `${(d / 365).toFixed(1)} años`;
}
