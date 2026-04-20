import { DashboardLayout } from "~/components/templates";
import {
  MetricsKpiCard,
  CategoryRankingChart, type CategoryRankItem,
  WeekdayHistogram,     type WeekdayPoint,
  TopTransactionsList,
  AccountBreakdownChart, type AccountBreakdownItem,
  DayOfMonthChart,       type DayOfMonthPoint,
  CumulativeTrendChart,  type CumulativePoint,
  SavingsRateTrend,      type SavingsRatePoint,
  CategoryTrendsChart,   type CategoryTrendPoint,
  WeekendVsWeekday,
  RecurringExpensesList, type RecurringItem,
} from "~/components/molecules";
import { TrendingUp as TrendingUpIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  Loader2, TrendingUp, TrendingDown, Wallet, PiggyBank, GitCompareArrows,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  transactions, formatCOPShort,
  type TransactionDTO, type TransactionSummary,
} from "~/services/api";

// ─── Period config ───────────────────────────────────────────────────────────

type Period = "1M" | "3M" | "6M" | "12M" | "ALL";

const PERIODS: { value: Period; label: string }[] = [
  { value: "1M",  label: "1 mes"   },
  { value: "3M",  label: "3 meses" },
  { value: "6M",  label: "6 meses" },
  { value: "12M", label: "1 año"   },
  { value: "ALL", label: "Todo"    },
];

function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function getPeriodRange(period: Period): {
  from: Date | null; to: Date | null;
  prevFrom: Date | null; prevTo: Date | null;
} {
  const now = new Date();
  if (period === "ALL") return { from: null, to: null, prevFrom: null, prevTo: null };
  const months = period === "1M" ? 1 : period === "3M" ? 3 : period === "6M" ? 6 : 12;
  const from = new Date(now); from.setMonth(from.getMonth() - months);
  const prevTo = new Date(from);
  const prevFrom = new Date(prevTo); prevFrom.setMonth(prevFrom.getMonth() - months);
  return { from, to: now, prevFrom, prevTo };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Metricas() {
  const [period, setPeriod] = useState<Period>("3M");
  const [compare, setCompare] = useState(true);

  const [txns, setTxns] = useState<TransactionDTO[]>([]);
  const [prevTxns, setPrevTxns] = useState<TransactionDTO[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [summaryPrev, setSummaryPrev] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => getPeriodRange(period), [period]);

  useEffect(() => {
    setLoading(true);
    const filters = {
      fromDate: range.from ? toISO(range.from) : undefined,
      toDate:   range.to   ? toISO(range.to)   : undefined,
    };
    const reqs: Promise<any>[] = [
      transactions.list({ ...filters, size: 500, page: 0 }),
      transactions.summary(filters),
    ];
    if (compare && range.prevFrom && range.prevTo) {
      const prevFilters = { fromDate: toISO(range.prevFrom), toDate: toISO(range.prevTo) };
      reqs.push(transactions.list({ ...prevFilters, size: 500, page: 0 }));
      reqs.push(transactions.summary(prevFilters));
    }
    Promise.all(reqs)
      .then((results) => {
        setTxns(results[0].content);
        setSummary(results[1]);
        if (results.length === 4) {
          setPrevTxns(results[2].content);
          setSummaryPrev(results[3]);
        } else {
          setPrevTxns([]);
          setSummaryPrev(null);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period, compare, range.from?.getTime(), range.to?.getTime()]);

  // ── Metrics derived from transactions ────────────────────────────────────
  const metrics = useMemo(() => computeMetrics(txns), [txns]);
  const metricsPrev = useMemo(() => computeMetrics(prevTxns), [prevTxns]);

  // Cash flow merged: current by month, with prev categories map for delta
  const catItems: CategoryRankItem[] = metrics.categoryTotals.map((c) => ({
    name: c.name,
    total: c.total,
    previousTotal: summaryPrev != null
      ? (metricsPrev.categoryTotals.find((x) => x.name === c.name)?.total ?? 0)
      : null,
  }));

  // KPI deltas
  const incomeChange   = summaryPrev ? percentChange(parseFloat(summary?.totalIncome ?? "0"),   parseFloat(summaryPrev.totalIncome))    : null;
  const expenseChange  = summaryPrev ? percentChange(parseFloat(summary?.totalExpense ?? "0"),  parseFloat(summaryPrev.totalExpense))   : null;
  const netChange      = summaryPrev ? percentChange(parseFloat(summary?.netBalance ?? "0"),    parseFloat(summaryPrev.netBalance))     : null;
  const savingsRate      = summary && parseFloat(summary.totalIncome) > 0 ? (parseFloat(summary.netBalance) / parseFloat(summary.totalIncome)) * 100 : 0;
  const savingsRatePrev  = summaryPrev && parseFloat(summaryPrev.totalIncome) > 0 ? (parseFloat(summaryPrev.netBalance) / parseFloat(summaryPrev.totalIncome)) * 100 : null;
  const savingsChange    = savingsRatePrev != null ? savingsRate - savingsRatePrev : null;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Métricas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Analiza patrones de gasto, comparaciones y tendencias
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCompare(!compare)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                compare
                  ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                  : "bg-secondary text-gray-400 hover:text-white border border-white/[0.04]"
              }`}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              Comparar vs período previo
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
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricsKpiCard
                delay={0.05}
                icon={<TrendingUp className="h-4 w-4 text-white" />}
                gradient="from-emerald-400 to-teal-600"
                label="Ingresos"
                value={formatCOPShort(summary?.totalIncome ?? "0")}
                subtext={`${summary?.incomeCount ?? 0} transacciones`}
                change={incomeChange}
              />
              <MetricsKpiCard
                delay={0.10}
                icon={<TrendingDown className="h-4 w-4 text-white" />}
                gradient="from-rose-400 to-red-600"
                label="Gastos"
                value={formatCOPShort(summary?.totalExpense ?? "0")}
                subtext={`${summary?.expenseCount ?? 0} transacciones`}
                change={expenseChange}
                invertColors
              />
              <MetricsKpiCard
                delay={0.15}
                icon={<Wallet className="h-4 w-4 text-white" />}
                gradient={parseFloat(summary?.netBalance ?? "0") >= 0 ? "from-violet-400 to-purple-600" : "from-rose-400 to-red-600"}
                label="Balance neto"
                value={formatCOPShort(summary?.netBalance ?? "0")}
                subtext="ingresos − gastos"
                change={netChange}
              />
              <MetricsKpiCard
                delay={0.20}
                icon={<PiggyBank className="h-4 w-4 text-white" />}
                gradient="from-amber-400 to-orange-600"
                label="Tasa de ahorro"
                value={`${savingsRate.toFixed(1)}%`}
                subtext="% de ingresos ahorrados"
                change={savingsChange}
              />
            </div>

            {/* Flagship — balance acumulado a lo largo del período */}
            <CumulativeTrendChart data={metrics.cumulative} />

            {/* Row 1: distribución del gasto */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CategoryRankingChart items={catItems} limit={6} />
              <WeekdayHistogram data={metrics.weekdaySpend} />
              <AccountBreakdownChart items={metrics.accountBreakdown} />
            </div>

            {/* Row 2: patrones temporales y anomalías */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TopTransactionsList transactions={txns} limit={5} />
              <DayOfMonthChart data={metrics.dayOfMonth} />
              <SavingsRateTrend data={metrics.savingsRate} />
            </div>

            {/* Row 3: contexto financiero y comparaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AccountBreakdownChart
                items={metrics.incomeSources}
                title="Fuentes de ingreso"
                subtitle="De dónde proviene tu dinero"
                icon={<TrendingUpIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />}
                emptyLabel="Sin ingresos en este período"
              />
              <CategoryTrendsChart
                data={metrics.categoryTrends}
                categories={metrics.topCategoryNames}
              />
              <WeekendVsWeekday
                weekdayTotal={metrics.weekendVsWeekday.weekdayTotal}
                weekdayCount={metrics.weekendVsWeekday.weekdayCount}
                weekendTotal={metrics.weekendVsWeekday.weekendTotal}
                weekendCount={metrics.weekendVsWeekday.weekendCount}
              />
            </div>

            {/* Row 4: gastos recurrentes (full width, list format) */}
            <RecurringExpensesList items={metrics.recurring} limit={5} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function percentChange(current: number, prev: number): number | null {
  if (prev === 0) return current === 0 ? 0 : null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

const MONTH_SHORT_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function computeMetrics(txns: TransactionDTO[]): {
  categoryTotals: { name: string; total: number }[];
  weekdaySpend: WeekdayPoint[];
  accountBreakdown: AccountBreakdownItem[];
  dayOfMonth: DayOfMonthPoint[];
  cumulative: CumulativePoint[];
  incomeSources: AccountBreakdownItem[];
  savingsRate: SavingsRatePoint[];
  categoryTrends: CategoryTrendPoint[];
  topCategoryNames: string[];
  weekendVsWeekday: { weekdayTotal: number; weekdayCount: number; weekendTotal: number; weekendCount: number };
  recurring: RecurringItem[];
} {
  const byMonth        = new Map<string, { income: number; expenses: number; date: Date }>();
  const byCategory     = new Map<string, number>();
  const byDayOfWeek    = new Map<number, { total: number; count: number }>();
  const byAccount      = new Map<string, number>();
  const byDayOfMonth   = new Map<number, { total: number; count: number }>();
  const byIncomeCat    = new Map<string, number>();
  // (month-key) → (categoryName → total)
  const byCatPerMonth  = new Map<string, Map<string, number>>();
  // (description|category, amount-rounded) → { count, lastDate, categoryName, label }
  const recurringMap   = new Map<string, { count: number; amount: number; lastDate: string; categoryName: string; label: string }>();

  let weekdayTotal = 0, weekdayCount = 0, weekendTotal = 0, weekendCount = 0;

  for (const t of txns) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const amount = parseFloat(t.amount);

    if (!byMonth.has(key)) byMonth.set(key, { income: 0, expenses: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) });
    const bucket = byMonth.get(key)!;
    if (t.type === "INCOME") {
      bucket.income += amount;
      byIncomeCat.set(t.categoryName, (byIncomeCat.get(t.categoryName) ?? 0) + amount);
    } else {
      bucket.expenses += amount;
    }

    if (t.type === "EXPENSE") {
      byCategory.set(t.categoryName, (byCategory.get(t.categoryName) ?? 0) + amount);
      byAccount.set(t.accountName,   (byAccount.get(t.accountName)   ?? 0) + amount);

      const dow = (d.getDay() + 6) % 7; // Mon = 0
      const w = byDayOfWeek.get(dow) ?? { total: 0, count: 0 };
      w.total += amount; w.count += 1;
      byDayOfWeek.set(dow, w);

      // Weekend (Sat=5, Sun=6) vs weekday
      if (dow >= 5) { weekendTotal += amount; weekendCount += 1; }
      else          { weekdayTotal += amount; weekdayCount += 1; }

      const dom = d.getDate();
      const m = byDayOfMonth.get(dom) ?? { total: 0, count: 0 };
      m.total += amount; m.count += 1;
      byDayOfMonth.set(dom, m);

      // Category per month (for trends)
      if (!byCatPerMonth.has(key)) byCatPerMonth.set(key, new Map());
      const catMap = byCatPerMonth.get(key)!;
      catMap.set(t.categoryName, (catMap.get(t.categoryName) ?? 0) + amount);

      // Recurring heuristic: same (description || categoryName) + rounded amount
      const label = t.description?.trim() || t.categoryName;
      const roundedAmount = Math.round(amount / 100) * 100; // bucket nearby amounts
      const recKey = `${label.toLowerCase()}__${roundedAmount}`;
      const rec = recurringMap.get(recKey);
      if (rec) {
        rec.count += 1;
        if (t.date > rec.lastDate) rec.lastDate = t.date;
      } else {
        recurringMap.set(recKey, {
          count: 1,
          amount,
          lastDate: t.date,
          categoryName: t.categoryName,
          label,
        });
      }
    }
  }

  const categoryTotals = Array.from(byCategory.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const weekdaySpend: WeekdayPoint[] = Array.from(byDayOfWeek.entries())
    .map(([day, v]) => ({ day, total: v.total, count: v.count }));

  const accountBreakdown: AccountBreakdownItem[] = Array.from(byAccount.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const dayOfMonth: DayOfMonthPoint[] = Array.from(byDayOfMonth.entries())
    .map(([day, v]) => ({ day, total: v.total, count: v.count }));

  // Cumulative net: running sum of (income − expenses) sorted by date.
  // One point per day for readability.
  const sorted = [...txns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const cumulative: CumulativePoint[] = [];
  let running = 0;
  let lastDayKey = "";
  for (const t of sorted) {
    const d = new Date(t.date);
    const dayKey = d.toISOString().slice(0, 10);
    const delta = (t.type === "INCOME" ? 1 : -1) * parseFloat(t.amount);
    running += delta;
    const label = `${d.getDate()} ${MONTH_SHORT_ES[d.getMonth()].toLowerCase()}`;
    if (dayKey !== lastDayKey) {
      cumulative.push({ label, net: running });
      lastDayKey = dayKey;
    } else {
      cumulative[cumulative.length - 1].net = running; // keep only the EOD value
    }
  }

  // Income sources (by category, only income)
  const incomeSources: AccountBreakdownItem[] = Array.from(byIncomeCat.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  // Savings rate per month
  const savingsRate: SavingsRatePoint[] = Array.from(byMonth.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((b) => ({
      label: `${MONTH_SHORT_ES[b.date.getMonth()]} ${String(b.date.getFullYear()).slice(2)}`,
      rate: b.income > 0 ? ((b.income - b.expenses) / b.income) * 100 : 0,
    }));

  // Category trends: build a series per month including top 3 categories overall
  const topCategoryNames = categoryTotals.slice(0, 3).map((c) => c.name);
  const categoryTrends: CategoryTrendPoint[] = Array.from(byCatPerMonth.keys())
    .sort()
    .map((mKey) => {
      const monthBucket = byMonth.get(mKey);
      const label = monthBucket
        ? `${MONTH_SHORT_ES[monthBucket.date.getMonth()]} ${String(monthBucket.date.getFullYear()).slice(2)}`
        : mKey;
      const catMap = byCatPerMonth.get(mKey)!;
      const point: CategoryTrendPoint = { label };
      for (const name of topCategoryNames) point[name] = catMap.get(name) ?? 0;
      return point;
    });

  // Recurring: at least 2 occurrences with same label+amount bucket
  const recurring: RecurringItem[] = Array.from(recurringMap.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([key, v]) => ({
      key,
      label: v.label,
      categoryName: v.categoryName,
      amount: v.amount,
      occurrences: v.count,
      totalSpent: v.amount * v.count,
      lastDate: v.lastDate,
    }));

  return {
    categoryTotals, weekdaySpend, accountBreakdown, dayOfMonth, cumulative,
    incomeSources, savingsRate, categoryTrends, topCategoryNames,
    weekendVsWeekday: { weekdayTotal, weekdayCount, weekendTotal, weekendCount },
    recurring,
  };
}
