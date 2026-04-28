import { DashboardLayout } from "~/components/templates";
import { MetricsKpiCard } from "~/components/molecules";
import { motion } from "framer-motion";
import {
  Loader2, Activity, Gauge, Zap, Calendar, PiggyBank,
  TrendingUp, Sigma, Scale, FlaskConical,
} from "lucide-react";
import {
  Area, Line, ComposedChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import {
  transactions, accounts, formatCOP, formatCOPShort,
  type TransactionDTO, type AccountDTO,
} from "~/services/api";
import {
  buildDailySeries,
  movingAverage,
  firstDerivative,
  secondDerivative,
  linearRegression,
  breakEvenDay,
  runwayDays,
  savingsRate as computeSavingsRate,
  incomeElasticity,
  projectLinear,
  mean,
  type DailySeriesPoint,
  type RegressionResult,
} from "~/lib/finance-math";

type Period = "1M" | "3M" | "6M" | "12M";

const PERIODS: { value: Period; label: string; days: number }[] = [
  { value: "1M",  label: "1 mes",   days: 30  },
  { value: "3M",  label: "3 meses", days: 90  },
  { value: "6M",  label: "6 meses", days: 180 },
  { value: "12M", label: "1 año",   days: 365 },
];

function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function shortDate(d: Date): string {
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function Analisis() {
  const [period, setPeriod] = useState<Period>("3M");
  const [txns, setTxns] = useState<TransactionDTO[]>([]);
  const [accountList, setAccountList] = useState<AccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    const now = new Date();
    const p = PERIODS.find((x) => x.value === period)!;
    const from = new Date(now); from.setDate(from.getDate() - p.days);
    return { from, to: now, days: p.days };
  }, [period]);

  useEffect(() => {
    setLoading(true);
    const filters = { fromDate: toISO(range.from), toDate: toISO(range.to) };
    Promise.all([
      transactions.list({ ...filters, size: 2000, page: 0 }),
      accounts.list(),
    ])
      .then(([r, a]) => { setTxns(r.content); setAccountList(a); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  const currentBalance = useMemo(
    () => accountList.reduce((s, a) => s + parseFloat(a.balance || "0"), 0),
    [accountList],
  );

  const analysis = useMemo(() => compute(txns, range.from, range.to), [txns, range.from, range.to]);

  const burnRate = analysis.avgDailyExpense - analysis.avgDailyIncome; // neto (positivo = quemas)
  const runway = runwayDays(currentBalance, burnRate);
  const be = breakEvenDay(analysis.series);
  const projection = useMemo(() => {
    if (analysis.series.length < 2) return [] as ReturnType<typeof projectLinear>;
    const lastT = analysis.series[analysis.series.length - 1].t;
    return projectLinear(analysis.regBalance, lastT, 30);
  }, [analysis]);

  const cumulativeChartData = useMemo(() => {
    const real = analysis.series.map((p) => ({
      label: shortDate(p.date),
      t: p.t,
      real: p.cumNet,
      fit: analysis.regBalance.slope * p.t + analysis.regBalance.intercept,
    }));
    const start = analysis.series.length > 0 ? analysis.series[analysis.series.length - 1].date : new Date();
    const future = projection.slice(1).map((p, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i + 1);
      return {
        label: shortDate(d),
        t: p.t,
        proj: p.yhat,
        lo: p.lo,
        hi: p.hi,
      };
    });
    return [...real, ...future];
  }, [analysis, projection]);

  const dailyChartData = useMemo(
    () => analysis.series.map((p, i) => ({
      label: shortDate(p.date),
      expense: p.expense,
      ma: analysis.expenseMA[i],
      velocity: analysis.expenseVelocity[i],
    })),
    [analysis],
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-cyan-400" /> Análisis
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Cómo evoluciona tu plata: ritmo de gasto, cuánto te alcanza, y a qué le metés más cuando ganás más
            </p>
          </div>
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
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : analysis.series.length < 3 ? (
          <div className="text-center py-16">
            <Sigma className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Datos insuficientes para el análisis</p>
            <p className="text-xs text-gray-600 mt-1">Registra más transacciones o elige un período más amplio</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <MetricsKpiCard
                delay={0.05}
                icon={<Gauge className="h-4 w-4 text-white" />}
                gradient="from-rose-400 to-red-600"
                label="Gasto diario"
                value={`${formatCOPShort(analysis.avgDailyExpense)}/día`}
                subtext={`promedio en los últimos ${analysis.series.length} días`}
                change={analysis.velocityTrendPct}
                invertColors
              />
              <MetricsKpiCard
                delay={0.08}
                icon={<Zap className="h-4 w-4 text-white" />}
                gradient={analysis.accelerationSign >= 0 ? "from-rose-400 to-red-600" : "from-emerald-400 to-teal-600"}
                label="Tendencia del gasto"
                value={trendVerbal(analysis.avgAcceleration)}
                subtext={trendHint(analysis.avgAcceleration)}
              />
              <MetricsKpiCard
                delay={0.11}
                icon={<Calendar className="h-4 w-4 text-white" />}
                gradient={runway === null ? "from-emerald-400 to-teal-600" : runway < 30 ? "from-rose-400 to-red-600" : "from-amber-400 to-orange-600"}
                label="Te alcanza para"
                value={runway === null ? "∞" : `${Math.floor(runway)} días`}
                subtext={runway === null ? "estás ahorrando, no gastas más de lo que entra" : "con tu saldo actual al ritmo de hoy"}
              />
              <MetricsKpiCard
                delay={0.14}
                icon={<PiggyBank className="h-4 w-4 text-white" />}
                gradient="from-amber-400 to-orange-600"
                label="Ahorras"
                value={`${(analysis.savingsRatePct * 100).toFixed(1)}%`}
                subtext="de cada peso que entra"
              />
              <MetricsKpiCard
                delay={0.17}
                icon={<Scale className="h-4 w-4 text-white" />}
                gradient="from-violet-400 to-purple-600"
                label="Punto de equilibrio"
                value={formatBreakEven(be.day, analysis.series)}
                subtext={confidenceLabel(analysis.regBalance.r2)}
              />
            </div>

            <ModelSummary analysis={analysis} currentBalance={currentBalance} burnRate={burnRate} runway={runway} />

            <ChartCard
              icon={<Activity className="h-4 w-4 text-cyan-400" />}
              title="¿Cómo está cambiando tu gasto?"
              subtitle="Lo que gastaste cada día, la línea suavizada (promedio de los últimos 7 días) y qué tan rápido sube o baja"
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expenseG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#fb7185" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tickLine={false} axisLine={false}
                      tick={{ fontSize: 9, fill: "#6b7280" }}
                      interval="preserveStartEnd" minTickGap={25}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(v) => formatCOPShort(v)}
                      tickLine={false} axisLine={false}
                      tick={{ fontSize: 9, fill: "#6b7280" }} width={48}
                    />
                    <YAxis
                      yAxisId="right" orientation="right"
                      tickFormatter={(v) => formatCOPShort(v)}
                      tickLine={false} axisLine={false}
                      tick={{ fontSize: 9, fill: "#22d3ee" }} width={48}
                    />
                    <Tooltip content={<DailyTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                    <ReferenceLine yAxisId="right" y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <Area yAxisId="left" type="monotone" dataKey="expense" stroke="#fb7185" strokeWidth={1} fill="url(#expenseG)" dot={false} name="Gasto diario" />
                    <Line yAxisId="left" type="monotone" dataKey="ma" stroke="#fbbf24" strokeWidth={2} dot={false} name="MA 7d" />
                    <Line yAxisId="right" type="monotone" dataKey="velocity" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="dE/dt" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <ChartLegend items={[
                { color: "#fb7185", label: "Gasto diario" },
                { color: "#fbbf24", label: "Promedio 7 días" },
                { color: "#22d3ee", label: "Qué tan rápido cambia", dashed: true },
              ]} />
            </ChartCard>

            <ChartCard
              icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
              title="Tu balance en el tiempo"
              subtitle={`Ritmo: ${analysis.regBalance.slope >= 0 ? "+" : "−"}${formatCOPShort(Math.abs(analysis.regBalance.slope))}/día · ${confidenceLabel(analysis.regBalance.r2)} · proyección a 30 días con margen de error`}
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cumulativeChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tickLine={false} axisLine={false}
                      tick={{ fontSize: 9, fill: "#6b7280" }}
                      interval="preserveStartEnd" minTickGap={25}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCOPShort(v)}
                      tickLine={false} axisLine={false}
                      tick={{ fontSize: 9, fill: "#6b7280" }} width={56}
                    />
                    <Tooltip content={<CumulativeTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ value: "equilibrio", fill: "#6b7280", fontSize: 9, position: "right" }} />
                    <Area type="monotone" dataKey="hi" stroke="none" fill="#8b5cf6" fillOpacity={0.08} name="banda+" />
                    <Area type="monotone" dataKey="lo" stroke="none" fill="#8b5cf6" fillOpacity={0.08} name="banda−" />
                    <Line type="monotone" dataKey="real" stroke="#34d399" strokeWidth={2} dot={false} name="Real" />
                    <Line type="monotone" dataKey="fit" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Ajuste lineal" />
                    <Line type="monotone" dataKey="proj" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Proyección 30d" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <ChartLegend items={[
                { color: "#34d399", label: "Tu balance real" },
                { color: "#fbbf24", label: "Tendencia", dashed: true },
                { color: "#8b5cf6", label: "Proyección 30 días", dashed: true },
              ]} />
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CategoryGrowthTable growth={analysis.categoryGrowth} />
              <ElasticityTable elasticity={analysis.categoryElasticity} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function ChartCard({
  icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-white text-base font-semibold">{title}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function ChartLegend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <div className="flex items-center gap-4 flex-wrap mt-3 pt-3 border-t border-white/[0.04]">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-[2px] w-4 rounded"
            style={{
              background: it.dashed
                ? `repeating-linear-gradient(90deg, ${it.color} 0 3px, transparent 3px 6px)`
                : it.color,
            }}
          />
          <span className="text-[11px] text-gray-400">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function ModelSummary({
  analysis, currentBalance, burnRate, runway,
}: { analysis: AnalysisResult; currentBalance: number; burnRate: number; runway: number | null }) {
  const slope = analysis.regBalance.slope;
  const projected30 = slope * 30;
  const trend = trendVerbal(analysis.avgAcceleration);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04] grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <ModelLine
        label="Tu balance va"
        value={
          slope >= 0
            ? `+${formatCOPShort(slope)}/día`
            : `−${formatCOPShort(Math.abs(slope))}/día`
        }
        valueClass={slope >= 0 ? "text-emerald-300" : "text-rose-300"}
        hint={
          slope >= 0
            ? `Si seguís así, en 30 días sumás ~${formatCOPShort(projected30)}. Estás ahorrando.`
            : `Si seguís así, en 30 días perdés ~${formatCOPShort(Math.abs(projected30))}. Estás consumiendo ahorros.`
        }
      />
      <ModelLine
        label="Cuánto te dura el saldo"
        value={
          burnRate > 0
            ? runway === null ? "∞" : `${Math.floor(runway)} días`
            : "no aplica"
        }
        valueClass={
          burnRate <= 0 ? "text-emerald-300"
            : runway !== null && runway < 30 ? "text-rose-300"
            : "text-amber-300"
        }
        hint={
          burnRate > 0
            ? `Tu saldo de ${formatCOP(currentBalance)} dividido por lo que gastás de más cada día (${formatCOPShort(burnRate)}/día).`
            : `Tus ingresos superan a tus gastos en este período. No estás quemando saldo.`
        }
      />
      <ModelLine
        label="Tu gasto"
        value={`${formatCOPShort(analysis.avgDailyExpense)}/día`}
        valueClass="text-white"
        hint={`En promedio. La tendencia indica que el gasto está ${trend.toLowerCase()}.`}
      />
    </motion.div>
  );
}

function ModelLine({
  label, value, valueClass, hint,
}: { label: string; value: string; valueClass?: string; hint: string }) {
  return (
    <div>
      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">{label}</div>
      <div className={`text-xl font-bold tabular-nums leading-tight ${valueClass ?? "text-white"}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-1.5 leading-snug">{hint}</div>
    </div>
  );
}

function CategoryGrowthTable({ growth }: { growth: CategoryGrowth[] }) {
  return (
    <div className="bg-secondary rounded-2xl p-5 border border-white/[0.04]">
      <div className="flex items-start gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-white text-base font-semibold">Categorías que más crecen o bajan</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Cuánto sube o baja tu gasto en cada categoría, mes a mes. En rojo lo que crece, en verde lo que baja.
          </p>
        </div>
      </div>
      {growth.length === 0 ? (
        <p className="text-xs text-gray-600 py-6 text-center">Necesitas al menos 2 meses de datos para ver tendencias</p>
      ) : (
        <div className="space-y-2">
          {growth.map((g) => {
            const positive = g.slope > 0;
            const magnitude = Math.min(100, Math.abs(g.slope) / (growth[0].maxAbs || 1) * 100);
            return (
              <div key={g.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-white truncate">{g.name}</span>
                    <span className={`text-xs font-semibold tabular-nums ${positive ? "text-rose-400" : "text-emerald-400"}`}>
                      {positive ? "+" : "−"}{formatCOPShort(Math.abs(g.slope))}/mes
                    </span>
                  </div>
                  <div className="h-1.5 bg-black/30 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full ${positive ? "bg-rose-500/60" : "bg-emerald-500/60"}`}
                      style={{ width: `${magnitude}%` }}
                    />
                  </div>
                </div>
                <span
                  title={`Confianza estadística (qué tan claro es el patrón): ${(g.r2 * 100).toFixed(0)}%`}
                  className="text-[10px] text-gray-600 tabular-nums w-14 text-right"
                >
                  {confidenceShort(g.r2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ElasticityTable({ elasticity }: { elasticity: CategoryElasticity[] }) {
  return (
    <div className="bg-secondary rounded-2xl p-5 border border-white/[0.04]">
      <div className="flex items-start gap-2 mb-3">
        <Scale className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-white text-base font-semibold">A qué le metés más cuando ganás más</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Cuando entran más ingresos, ¿en qué categorías sube tu gasto? Las "de lujo" suben más rápido que el ingreso, las "esenciales" no se mueven.
          </p>
        </div>
      </div>
      {elasticity.length === 0 ? (
        <p className="text-xs text-gray-600 py-6 text-center">Necesitas al menos 3 meses con ingresos y gastos</p>
      ) : (
        <div className="space-y-1.5">
          {elasticity.map((e) => (
            <div key={e.name} className="flex items-center gap-3 py-1.5 border-b border-white/[0.03] last:border-0">
              <span className="text-sm text-white flex-1 truncate">{e.name}</span>
              <span
                title={`Sensibilidad numérica: ${e.elasticity.toFixed(2)}`}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${elasticityClass(e.elasticity)}`}
              >
                {elasticityLabel(e.elasticity)}
              </span>
              <span
                title={`Confianza estadística: ${(e.r2 * 100).toFixed(0)}%`}
                className="text-[10px] text-gray-600 w-14 text-right"
              >
                {confidenceShort(e.r2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function elasticityClass(e: number): string {
  if (e > 1.2) return "bg-rose-500/15 text-rose-300";
  if (e < 0) return "bg-violet-500/15 text-violet-300";
  if (e < 0.5) return "bg-emerald-500/15 text-emerald-300";
  return "bg-cyan-500/15 text-cyan-300";
}

function elasticityLabel(e: number): string {
  if (e > 1.2) return "De lujo";
  if (e < 0) return "Baja al ganar más";
  if (e < 0.5) return "Esencial";
  return "Proporcional";
}

function DailyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const get = (k: string) => payload.find((p: any) => p.dataKey === k)?.value as number | undefined;
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="text-gray-400 font-semibold mb-1">{label}</p>
      <p className="text-rose-400 tabular-nums">Gasto: {formatCOP(get("expense") ?? 0)}</p>
      <p className="text-amber-400 tabular-nums">MA 7d: {formatCOP(get("ma") ?? 0)}</p>
      <p className="text-cyan-400 tabular-nums">dE/dt: {((get("velocity") ?? 0) >= 0 ? "+" : "")}{formatCOP(get("velocity") ?? 0)}</p>
    </div>
  );
}

function CumulativeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const get = (k: string) => payload.find((p: any) => p.dataKey === k)?.value as number | undefined;
  const real = get("real"), fit = get("fit"), proj = get("proj");
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="text-gray-400 font-semibold mb-1">{label}</p>
      {real !== undefined && <p className="text-emerald-400 tabular-nums">Real: {formatCOP(real)}</p>}
      {fit !== undefined && <p className="text-amber-400 tabular-nums">Ajuste: {formatCOP(fit)}</p>}
      {proj !== undefined && <p className="text-violet-400 tabular-nums">Proyección: {formatCOP(proj)}</p>}
    </div>
  );
}

interface CategoryGrowth {
  name: string;
  slope: number;      // $ / mes
  r2: number;
  maxAbs: number;     // para normalizar la barra
}

interface CategoryElasticity {
  name: string;
  elasticity: number;
  r2: number;
}

interface AnalysisResult {
  series: DailySeriesPoint[];
  expenseMA: number[];
  expenseVelocity: number[];
  expenseAcceleration: number[];
  avgDailyExpense: number;
  avgDailyIncome: number;
  avgAcceleration: number;
  accelerationSign: number;
  savingsRatePct: number;
  velocityTrendPct: number | null;
  regBalance: RegressionResult;
  categoryGrowth: CategoryGrowth[];
  categoryElasticity: CategoryElasticity[];
}

function compute(txns: TransactionDTO[], from: Date, to: Date): AnalysisResult {
  const series = buildDailySeries(txns, from, to);

  const expense = series.map((p) => p.expense);
  const expenseMA = movingAverage(expense, 7);
  const expenseVelocity = firstDerivative(expenseMA);
  const expenseAcceleration = secondDerivative(expenseMA);

  const avgDailyExpense = mean(expense);
  const avgDailyIncome = mean(series.map((p) => p.income));
  const avgAcceleration = mean(expenseAcceleration);

  // Tendencia de la velocidad: compara primera mitad vs segunda mitad
  let velocityTrendPct: number | null = null;
  if (expenseVelocity.length >= 6) {
    const half = Math.floor(expenseVelocity.length / 2);
    const a = mean(expense.slice(0, half));
    const b = mean(expense.slice(half));
    if (a > 0) velocityTrendPct = ((b - a) / a) * 100;
  }

  const totalIncome = series.reduce((s, p) => s + p.income, 0);
  const totalExpense = series.reduce((s, p) => s + p.expense, 0);
  const savingsRatePct = computeSavingsRate(totalIncome, totalExpense);

  const regBalance = linearRegression(series.map((p) => p.t), series.map((p) => p.cumNet));

  const categoryGrowth = computeCategoryGrowth(txns, from, to);
  const categoryElasticity = computeCategoryElasticity(txns);

  return {
    series, expenseMA, expenseVelocity, expenseAcceleration,
    avgDailyExpense, avgDailyIncome, avgAcceleration,
    accelerationSign: avgAcceleration >= 0 ? 1 : -1,
    savingsRatePct,
    velocityTrendPct,
    regBalance,
    categoryGrowth,
    categoryElasticity,
  };
}

/** Regresión lineal del gasto mensual por categoría → pendiente en $/mes. */
function computeCategoryGrowth(txns: TransactionDTO[], from: Date, to: Date): CategoryGrowth[] {
  // agrupa por (categoría, año-mes)
  const map = new Map<string, Map<string, number>>();
  for (const t of txns) {
    if (t.type !== "EXPENSE") continue;
    const catName = t.categoryName ?? "Sin categoría";
    const d = new Date(t.date);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(catName)) map.set(catName, new Map());
    const inner = map.get(catName)!;
    inner.set(ym, (inner.get(ym) ?? 0) + parseFloat(t.amount));
  }
  const months: string[] = [];
  {
    const d = new Date(from.getFullYear(), from.getMonth(), 1);
    const end = new Date(to.getFullYear(), to.getMonth(), 1);
    while (d <= end) {
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      d.setMonth(d.getMonth() + 1);
    }
  }
  if (months.length < 2) return [];

  const xs = months.map((_, i) => i);
  const results: CategoryGrowth[] = [];
  for (const [name, inner] of map) {
    const ys = months.map((m) => inner.get(m) ?? 0);
    if (ys.every((v) => v === 0)) continue;
    const reg = linearRegression(xs, ys);
    results.push({ name, slope: reg.slope, r2: Math.max(0, reg.r2), maxAbs: 0 });
  }
  results.sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope));
  const top = results.slice(0, 8);
  const maxAbs = Math.max(1, ...top.map((r) => Math.abs(r.slope)));
  return top.map((r) => ({ ...r, maxAbs }));
}

/** Elasticidad por categoría: log(gasto_cat_mensual) vs log(ingreso_mensual). */
function computeCategoryElasticity(txns: TransactionDTO[]): CategoryElasticity[] {
  const byMonth = new Map<string, { income: number; catExp: Map<string, number> }>();
  for (const t of txns) {
    if (t.type === "TRANSFER") continue;            // sin flujo
    const d = new Date(t.date);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(ym)) byMonth.set(ym, { income: 0, catExp: new Map() });
    const row = byMonth.get(ym)!;
    const amt = parseFloat(t.amount);
    if (t.type === "INCOME") row.income += amt;
    else {
      const catName = t.categoryName ?? "Sin categoría";
      row.catExp.set(catName, (row.catExp.get(catName) ?? 0) + amt);
    }
  }
  const months = Array.from(byMonth.keys()).sort();
  if (months.length < 3) return [];
  const incomes = months.map((m) => byMonth.get(m)!.income);

  const allCats = new Set<string>();
  for (const m of months) for (const c of byMonth.get(m)!.catExp.keys()) allCats.add(c);

  const results: CategoryElasticity[] = [];
  for (const cat of allCats) {
    const spends = months.map((m) => byMonth.get(m)!.catExp.get(cat) ?? 0);
    const r = incomeElasticity(incomes, spends);
    if (r.n >= 3) results.push({ name: cat, elasticity: r.elasticity, r2: Math.max(0, r.r2) });
  }
  results.sort((a, b) => Math.abs(b.elasticity) - Math.abs(a.elasticity));
  return results.slice(0, 8);
}

function trendVerbal(acceleration: number): string {
  if (acceleration > 50) return "Subiendo";
  if (acceleration < -50) return "Bajando";
  return "Estable";
}

function trendHint(acceleration: number): string {
  if (acceleration > 50) return "tu gasto está aumentando con el tiempo";
  if (acceleration < -50) return "tu gasto está disminuyendo";
  return "tu gasto se mantiene parejo";
}

function confidenceLabel(r2: number): string {
  if (r2 >= 0.7) return "tendencia clara";
  if (r2 >= 0.4) return "tendencia moderada";
  return "tendencia poco definida";
}

function confidenceShort(r2: number): string {
  if (r2 >= 0.7) return "alta";
  if (r2 >= 0.4) return "media";
  return "baja";
}

function formatBreakEven(day: number | null, series: DailySeriesPoint[]): string {
  if (day === null || !isFinite(day) || series.length === 0) return "N/A";
  const lastT = series[series.length - 1].t;
  const delta = day - lastT;
  if (Math.abs(delta) < 1) return "hoy";
  if (delta > 0 && delta < 3650) return `en ${Math.round(delta)}d`;
  if (delta < 0 && delta > -3650) return `hace ${Math.round(-delta)}d`;
  return "—";
}
