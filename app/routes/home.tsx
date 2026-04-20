import type { Route } from "./+types/home";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "~/components/templates";
import {
  AccountBanner,
  BudgetVsActualChart,
  IncomeExpenseBarChart,
  SpendingDonutChart,
  SpendingHeatmap,
} from "~/components/molecules";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, TrendingUp, TrendingDown, PiggyBank,
  Calendar, ArrowRight, Layers, X,
} from "lucide-react";
import {
  dashboard,
  accounts as accountsApi,
  transactions as txnApi,
  formatCOPShort, formatCOP, daysLeftInMonth,
  type DashboardSummary, type AccountDTO, type TransactionDTO,
} from "~/services/api";
import { useAuthStore } from "~/store/authStore";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard · FINZ" },
    { name: "description", content: "Gestiona tus finanzas personales" },
  ];
}

// ─── Period config ────────────────────────────────────────────────────────────

type Period = "7D" | "30D" | "3M" | "6M" | "ALL";

const PERIODS: { label: string; value: Period; months?: number }[] = [
  { label: "7D",   value: "7D",   months: 1 },
  { label: "30D",  value: "30D",  months: 1 },
  { label: "3M",   value: "3M",   months: 3 },
  { label: "6M",   value: "6M",   months: 6 },
  { label: "Todo", value: "ALL"             },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function formatTxDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function categoryColor(name: string) {
  const COLORS = ["#22d3ee","#a78bfa","#fb7185","#fbbf24","#34d399","#60a5fa","#f97316","#e879f9"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

// ─── Small components ─────────────────────────────────────────────────────────

function StatCard({ delay, icon, gradient, accentColor, label, value, subtext }: {
  delay: number; icon: React.ReactNode; gradient: string;
  accentColor: string; label: string; value: string; subtext?: string;
}) {
  return (
    <motion.div
      className={`bg-secondary rounded-xl p-4 text-white border-l-[3px] ${accentColor} relative overflow-hidden`}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.025] to-transparent pointer-events-none" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">{label}</div>
          <div className="text-[22px] font-bold leading-tight truncate">{value}</div>
          {subtext && <div className="text-[11px] text-gray-500 mt-1">{subtext}</div>}
        </div>
        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function SidebarCard({ delay, children, className }: {
  delay: number; children: React.ReactNode; className?: string;
}) {
  return (
    <motion.div
      className={`bg-secondary rounded-2xl p-4 text-white border border-white/[0.04] ${className ?? ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <h3 className="text-sm font-semibold">{text}</h3>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-800/70 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function AccountContextChip({
  selectedAccount, onClear,
}: { selectedAccount: AccountDTO | null; onClear: () => void }) {
  if (!selectedAccount) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 rounded-lg border border-white/[0.04]">
        <Layers className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs text-gray-300 font-medium">Todas las cuentas</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 pl-3 pr-1 py-1 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
      <CreditCard className="h-3.5 w-3.5 text-cyan-400" />
      <span className="text-xs text-cyan-200 font-semibold">{selectedAccount.name}</span>
      <button
        onClick={onClear}
        title="Ver todas las cuentas"
        className="w-5 h-5 flex items-center justify-center rounded text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-500/15 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [summary, setSummary]                 = useState<DashboardSummary | null>(null);
  const [accountList, setAccountList]         = useState<AccountDTO[]>([]);
  const [allTxns, setAllTxns]                 = useState<TransactionDTO[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [txnLoading, setTxnLoading]           = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [period, setPeriod]                   = useState<Period>("3M");
  const [selectedAccount, setSelectedAccount] = useState<AccountDTO | null>(null);

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    accountsApi.list().then(setAccountList).catch(() => {});
  }, []);

  useEffect(() => {
    const months = PERIODS.find((p) => p.value === period)?.months;
    setLoading(true);
    dashboard
      .getSummary({ accountId: selectedAccount?.id, months })
      .then(setSummary)
      .catch((e) => setError(e.message ?? "Error cargando datos"))
      .finally(() => setLoading(false));
  }, [period, selectedAccount]);

  useEffect(() => {
    setTxnLoading(true);
    txnApi
      .list({ size: 100, page: 0, accountId: selectedAccount?.id })
      .then((r) => setAllTxns(r.content))
      .catch(() => {})
      .finally(() => setTxnLoading(false));
  }, [selectedAccount]);

  const recentTxns = allTxns.slice(0, 6);

  const latestSavings   = summary?.monthlySavingsProgress?.slice(-1)[0];
  const savingsGoalPct  = latestSavings ? parseFloat(latestSavings.progressPercentage) : 0;
  const daysLeft        = daysLeftInMonth();
  const totalIncome     = parseFloat(summary?.totalIncome ?? "0");
  const totalExpenses   = parseFloat(summary?.totalExpenses ?? "0");
  const expenseRatio    = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0;
  const balancePositive = parseFloat(summary?.totalSavings ?? "0") >= 0;

  return (
    <DashboardLayout>
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* ── Greeting ── */}
      <motion.div
        className="mb-5"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-white text-2xl font-bold tracking-tight">
          {getGreeting()}, {user?.username ?? "Usuario"}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Resumen de tus finanzas personales</p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* ── Main content ── */}
        <div className="xl:col-span-9 space-y-4 min-w-0">

          {/* Account Banner */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            {loading && accountList.length === 0 ? (
              <Skeleton className="h-[240px]" />
            ) : (
              <AccountBanner
                accounts={accountList}
                username={user?.username}
                onAccountChange={setSelectedAccount}
              />
            )}
          </motion.div>

          {/* Stat Cards — 2 cols on most screens, 4 only on 2xl (wide desktop) */}
          <div className="grid grid-cols-2 2xl:grid-cols-4 gap-3">
            {loading ? (
              <>
                <Skeleton className="h-[88px]" /><Skeleton className="h-[88px]" />
                <Skeleton className="h-[88px]" /><Skeleton className="h-[88px]" />
              </>
            ) : (
              <>
                <StatCard delay={0.10} gradient="from-sky-400 to-blue-600"     accentColor="border-sky-500"     label="Transacciones" value={String(summary?.totalTransactions ?? 0)}       subtext="registradas"    icon={<CreditCard   className="h-5 w-5 text-white" />} />
                <StatCard delay={0.20} gradient="from-emerald-400 to-teal-600" accentColor="border-emerald-500" label="Ingresos"       value={formatCOPShort(summary?.totalIncome    ?? "0")} subtext="acumulados"     icon={<TrendingUp   className="h-5 w-5 text-white" />} />
                <StatCard delay={0.30} gradient="from-rose-400 to-red-600"     accentColor="border-rose-500"    label="Egresos"        value={formatCOPShort(summary?.totalExpenses  ?? "0")} subtext="acumulados"     icon={<TrendingDown className="h-5 w-5 text-white" />} />
                <StatCard delay={0.40} gradient="from-violet-400 to-purple-600" accentColor="border-violet-500" label="Ahorro Neto"    value={formatCOPShort(summary?.totalSavings   ?? "0")} subtext="balance actual" icon={<PiggyBank    className="h-5 w-5 text-white" />} />
              </>
            )}
          </div>

          {/* ── Filter toolbar ── */}
          <motion.div
            className="bg-secondary rounded-xl border border-white/[0.04] p-2.5 flex items-center justify-between gap-3 flex-wrap"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.48 }}
          >
            {/* Vista */}
            <div className="flex items-center gap-3 pl-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.18em] font-semibold hidden sm:block">Vista</span>
              <AccountContextChip
                selectedAccount={selectedAccount}
                onClear={() => setSelectedAccount(null)}
              />
              {!selectedAccount && accountList.length > 0 && (
                <span className="text-[11px] text-gray-600 hidden md:block">
                  · usa la tarjeta para filtrar por cuenta
                </span>
              )}
            </div>

            {/* Período */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.18em] font-semibold hidden sm:block">Período</span>
              <div className="flex items-center gap-0.5 bg-black/20 rounded-lg p-0.5 border border-white/[0.03]">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
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

          {/* Charts row 1: bar chart + savings area */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.55 }}
          >
            {loading ? (
              <><Skeleton className="h-64" /><Skeleton className="h-64" /></>
            ) : (
              <>
                <IncomeExpenseBarChart data={summary?.monthlySummaries ?? []} />
                <BudgetVsActualChart data={summary?.budgetComparisons ?? []} />
              </>
            )}
          </motion.div>

          {/* ── Recent Transactions ── */}
          <motion.div
            className="bg-secondary rounded-2xl border border-white/[0.04] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.7 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Transacciones recientes</h3>
                {selectedAccount && (
                  <span className="text-[11px] text-gray-500 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06]">
                    {selectedAccount.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate("/transacciones")}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {txnLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : recentTxns.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Layers className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Sin transacciones registradas</p>
              </div>
            ) : (
              <div>
                <AnimatePresence>
                  {recentTxns.map((tx, i) => {
                    const color = categoryColor(tx.categoryName);
                    const isIncome = tx.type === "INCOME";
                    return (
                      <motion.div
                        key={tx.id}
                        className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-default"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, delay: i * 0.05 }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold select-none"
                          style={{
                            background: `${color}18`,
                            border: `1px solid ${color}35`,
                            color,
                          }}
                        >
                          {tx.categoryName[0]?.toUpperCase() ?? "?"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {tx.categoryName}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">
                            {tx.description ? tx.description : tx.accountName} · {formatTxDate(tx.date)}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-bold mb-1 ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
                            {isIncome ? "+" : "−"}{formatCOPShort(tx.amount)}
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isIncome
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}>
                            {isIncome ? "INGRESO" : "GASTO"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Right sidebar ── */}
        <motion.div
          className="xl:col-span-3 space-y-3 min-w-0"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {loading ? (
            <>
              <Skeleton className="h-20" /><Skeleton className="h-20" />
              <Skeleton className="h-64" /><Skeleton className="h-40" />
            </>
          ) : (
            <>
              {/* Income */}
              <SidebarCard delay={0.42}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-gray-400 uppercase tracking-widest">Total Ingresos</span>
                  <div className="w-6 h-6 bg-emerald-500/15 rounded-md flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  </div>
                </div>
                <div className="text-xl font-bold text-emerald-400 truncate">{formatCOP(summary?.totalIncome ?? "0")}</div>
                <div className="mt-2.5 w-full bg-gray-700/50 rounded-full h-[3px]">
                  <div className="bg-emerald-500 h-[3px] rounded-full w-full" />
                </div>
              </SidebarCard>

              {/* Expenses */}
              <SidebarCard delay={0.5}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-gray-400 uppercase tracking-widest">Total Egresos</span>
                  <div className="w-6 h-6 bg-rose-500/15 rounded-md flex items-center justify-center">
                    <TrendingDown className="h-3 w-3 text-rose-400" />
                  </div>
                </div>
                <div className="text-xl font-bold text-rose-400 truncate">{formatCOP(summary?.totalExpenses ?? "0")}</div>
                <div className="mt-2.5 w-full bg-gray-700/50 rounded-full h-[3px]">
                  <motion.div
                    className="bg-rose-500 h-[3px] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${expenseRatio}%` }}
                    transition={{ duration: 1, delay: 0.85 }}
                  />
                </div>
              </SidebarCard>

              {/* Spending Donut */}
              <SpendingDonutChart data={summary?.expensesByCategory ?? []} />

              {/* Spending Heatmap — compact, below donut */}
              {txnLoading
                ? <Skeleton className="h-64" />
                : <SpendingHeatmap transactions={allTxns} />}

              {/* Resumen Mensual */}
              <SidebarCard delay={0.7}>
                <SectionLabel color="bg-cyan-400" text="Resumen Mensual" />
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs text-gray-400">Balance</span>
                    <span className={`text-sm font-bold truncate ${balancePositive ? "text-emerald-400" : "text-rose-400"}`}>
                      {balancePositive ? "+" : ""}{formatCOP(summary?.totalSavings ?? "0")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Ahorro Meta</span>
                    <span className="text-sm font-bold">{savingsGoalPct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700/60 rounded-full h-[3px]">
                    <motion.div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-[3px] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(savingsGoalPct, 100)}%` }}
                      transition={{ duration: 1.4, delay: 1.0 }}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-400">Días restantes</span>
                    </div>
                    <span className="text-sm font-bold">{daysLeft}</span>
                  </div>
                </div>
              </SidebarCard>
            </>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
