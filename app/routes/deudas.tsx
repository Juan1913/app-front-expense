import { DashboardLayout } from "~/components/templates";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Plus, X, Trash2, Edit3, AlertTriangle,
  TrendingDown, Percent, Wallet, Coins, Snowflake, Mountain,
  CheckCircle2, Sparkles, DollarSign, History, ShieldCheck, ShieldAlert,
} from "lucide-react";
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import {
  debts, accounts, formatCOP, formatCOPShort,
  type DebtDTO, type CreateDebtDTO, type StrategyComparisonDTO, type PayoffPlanDTO,
  type DebtPaymentDTO, type DebtSummaryDTO, type DebtQuality,
  type AccountDTO,
} from "~/services/api";

interface DebtFormState {
  name: string;
  description: string;
  creditor: string;
  principal: string;
  currentBalance: string;
  annualRate: string;       // como % visible (18 = 18%) — convertimos a fracción al guardar
  minimumPayment: string;
  startDate: string;
}

const emptyForm: DebtFormState = {
  name: "", description: "", creditor: "",
  principal: "", currentBalance: "",
  annualRate: "", minimumPayment: "", startDate: "",
};

export default function Deudas() {
  const [list, setList] = useState<DebtDTO[]>([]);
  const [comparison, setComparison] = useState<StrategyComparisonDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [extraBudget, setExtraBudget] = useState(0);
  const [extraDebounced, setExtraDebounced] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DebtDTO | null>(null);
  const [form, setForm] = useState<DebtFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DebtDTO | null>(null);

  const [accountList, setAccountList] = useState<AccountDTO[]>([]);
  const [paymentTarget, setPaymentTarget] = useState<DebtDTO | null>(null);
  const [detailTarget, setDetailTarget] = useState<DebtDTO | null>(null);

  function reload() {
    setLoading(true);
    debts.list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  useEffect(() => {
    accounts.list().then(setAccountList).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setExtraDebounced(extraBudget), 250);
    return () => clearTimeout(t);
  }, [extraBudget]);

  useEffect(() => {
    const active = list.filter((d) => d.status === "ACTIVE" && parseFloat(d.currentBalance) > 0);
    if (active.length === 0) { setComparison(null); return; }
    debts.compareStrategies(extraDebounced > 0 ? String(extraDebounced) : undefined)
      .then(setComparison)
      .catch((e) => setError(e.message));
  }, [extraDebounced, list]);

  const stats = useMemo(() => computeStats(list), [list]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }
  function openEdit(d: DebtDTO) {
    setEditing(d);
    setForm({
      name: d.name,
      description: d.description ?? "",
      creditor: d.creditor ?? "",
      principal: d.principal,
      currentBalance: d.currentBalance,
      annualRate: (parseFloat(d.annualRate) * 100).toFixed(2),
      minimumPayment: d.minimumPayment,
      startDate: d.startDate ?? "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    const annualFrac = (parseFloat(form.annualRate) || 0) / 100;
    const payload: CreateDebtDTO = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      creditor: form.creditor.trim() || undefined,
      principal: form.principal,
      currentBalance: form.currentBalance || undefined,
      annualRate: String(annualFrac),
      minimumPayment: form.minimumPayment,
      startDate: form.startDate || undefined,
    };
    setSaving(true);
    try {
      if (editing) await debts.update(editing.id, payload);
      else         await debts.create(payload);
      setShowModal(false);
      reload();
    } catch (e: any) {
      setError(e.message);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await debts.remove(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Coins className="h-6 w-6 text-amber-400" /> Deudas
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestioná tus créditos y compará estrategias snowball vs avalanche con interés compuesto
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" /> Nueva deuda
          </button>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 bg-secondary rounded-2xl border border-white/[0.04]">
            <Coins className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-300 font-medium">Sin deudas registradas</p>
            <p className="text-xs text-gray-500 mt-1 mb-5">Agregá tus créditos, hipoteca, tarjetas o préstamos para empezar a planear su pago</p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus className="h-4 w-4" /> Agregar primera deuda
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard
                icon={<Wallet className="h-5 w-5 text-white" />}
                gradient="from-rose-400 to-red-600"
                label="Deuda total"
                value={formatCOPShort(stats.totalBalance)}
                subtext={`${stats.activeCount} activas · ${stats.paidCount} saldadas`}
              />
              <KpiCard
                icon={<Percent className="h-5 w-5 text-white" />}
                gradient="from-amber-400 to-orange-600"
                label="Tasa promedio"
                value={`${(stats.weightedRate * 100).toFixed(2)}%`}
                subtext="ponderada por saldo"
              />
              <KpiCard
                icon={<TrendingDown className="h-5 w-5 text-white" />}
                gradient="from-violet-400 to-purple-600"
                label="Mínimo mensual"
                value={formatCOPShort(stats.totalMin)}
                subtext="Σ pagos mínimos"
              />
              <KpiCard
                icon={<AlertTriangle className="h-5 w-5 text-white" />}
                gradient="from-rose-500 to-red-700"
                label="Más cara"
                value={stats.mostExpensive ? `${(parseFloat(stats.mostExpensive.annualRate) * 100).toFixed(1)}%` : "—"}
                subtext={stats.mostExpensive?.name ?? "sin datos"}
              />
            </div>

            {comparison && (
              <StrategyComparator
                comparison={comparison}
                extraBudget={extraBudget}
                onChangeExtra={setExtraBudget}
                totalMinimum={parseFloat(comparison.totalMinimum)}
              />
            )}

            <div className="space-y-2.5">
              <h2 className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">
                Tus deudas
              </h2>
              {list.map((d) => (
                <DebtRow
                  key={d.id} debt={d}
                  onPay={() => setPaymentTarget(d)}
                  onDetail={() => setDetailTarget(d)}
                  onEdit={() => openEdit(d)}
                  onDelete={() => setDeleteTarget(d)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <DebtFormModal
        open={showModal}
        editing={editing}
        form={form}
        saving={saving}
        onClose={() => setShowModal(false)}
        onChange={setForm}
        onSave={handleSave}
      />

      <DeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <PaymentModal
        target={paymentTarget}
        accounts={accountList}
        onClose={() => setPaymentTarget(null)}
        onPaid={() => { setPaymentTarget(null); reload(); }}
      />

      <DebtDetailDrawer
        target={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </DashboardLayout>
  );
}

function KpiCard({ icon, gradient, label, value, subtext }: {
  icon: React.ReactNode; gradient: string; label: string; value: string; subtext: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-secondary rounded-xl p-4 border border-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-[11px] text-gray-400 uppercase tracking-widest">{label}</div>
        <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {icon}
        </div>
      </div>
      <div className="text-[22px] font-bold text-white leading-tight truncate tabular-nums">{value}</div>
      <div className="text-[11px] text-gray-500 mt-1 truncate">{subtext}</div>
    </motion.div>
  );
}

function DebtRow({
  debt, onPay, onDetail, onEdit, onDelete,
}: {
  debt: DebtDTO;
  onPay: () => void;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const balance = parseFloat(debt.currentBalance);
  const principal = parseFloat(debt.principal);
  const progress = Math.max(0, Math.min(100, (1 - balance / principal) * 100));
  const ratePct = parseFloat(debt.annualRate) * 100;
  const paid = debt.status === "PAID_OFF" || balance <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-secondary rounded-xl border p-4 ${paid ? "border-emerald-500/30 opacity-80" : "border-white/[0.04]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base truncate">{debt.name}</h3>
            {debt.creditor && <span className="text-[11px] text-gray-500">· {debt.creditor}</span>}
            <QualityBadge quality={debt.qualityBadge} />
            {paid && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                <CheckCircle2 className="h-3 w-3" /> Saldada
              </span>
            )}
          </div>
          {debt.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{debt.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <Field label="Saldo" value={formatCOP(balance)} valueClass="text-rose-300" />
            <Field label="Tasa anual" value={`${ratePct.toFixed(2)}%`} valueClass="text-amber-300" />
            <Field label="Mensual eff." value={`${(parseFloat(debt.monthlyRate) * 100).toFixed(3)}%`} valueClass="text-gray-300" />
            <Field label="Pago mínimo" value={formatCOPShort(debt.minimumPayment)} valueClass="text-violet-300" />
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
              <span>Pagado: {progress.toFixed(1)}%</span>
              <span>{formatCOPShort(principal - balance)} de {formatCOPShort(principal)}</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {!paid && (
            <button onClick={onPay} title="Registrar pago"
              className="p-2 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/15 rounded-lg transition-colors">
              <DollarSign className="h-4 w-4" />
            </button>
          )}
          <button onClick={onDetail} title="Ver detalle e historial"
            className="p-2 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 rounded-lg transition-colors">
            <History className="h-4 w-4" />
          </button>
          <button onClick={onEdit} title="Editar"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
            <Edit3 className="h-4 w-4" />
          </button>
          <button onClick={onDelete} title="Eliminar"
            className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!paid && debt.qualityHint && (
        <p className="text-[11px] text-gray-500 mt-2 italic">{debt.qualityHint}</p>
      )}
    </motion.div>
  );
}

function QualityBadge({ quality }: { quality: DebtQuality }) {
  if (quality === "GOOD") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded">
        <ShieldCheck className="h-3 w-3" /> Buena
      </span>
    );
  }
  if (quality === "BAD") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded">
        <ShieldAlert className="h-3 w-3" /> Cara
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
      <AlertTriangle className="h-3 w-3" /> Atenta
    </span>
  );
}

function Field({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
      <div className={`text-sm font-semibold tabular-nums truncate ${valueClass ?? "text-white"}`}>{value}</div>
    </div>
  );
}

function StrategyComparator({
  comparison, extraBudget, onChangeExtra, totalMinimum,
}: {
  comparison: StrategyComparisonDTO;
  extraBudget: number;
  onChangeExtra: (v: number) => void;
  totalMinimum: number;
}) {
  const chartData = useMemo(() => {
    const min = comparison.minimumOnly.trajectory;
    const snw = comparison.snowball.trajectory;
    const ava = comparison.avalanche.trajectory;
    const len = Math.max(min.length, snw.length, ava.length);
    const out: { month: number; min?: number; snw?: number; ava?: number }[] = [];
    for (let i = 0; i < len; i++) {
      out.push({
        month: i,
        min: min[i] ? parseFloat(min[i].balance) : undefined,
        snw: snw[i] ? parseFloat(snw[i].balance) : undefined,
        ava: ava[i] ? parseFloat(ava[i].balance) : undefined,
      });
    }
    return out;
  }, [comparison]);

  const recommended = comparison.recommended;
  const interestSaved = parseFloat(comparison.interestSavedVsMinimum);
  const monthsSaved = comparison.monthsSavedVsMinimum;
  const sliderMax = Math.max(2_000_000, totalMinimum * 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04] space-y-5"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-cyan-400 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-white text-base font-semibold">Comparador de estrategias</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Snowball (saldo más bajo primero) vs Avalanche (mayor tasa primero) vs solo mínimos · simulación con interés compuesto mensual
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <span className="text-xs text-gray-300">Extra mensual sobre los mínimos</span>
          <span className="text-sm font-bold text-cyan-300 tabular-nums">
            {extraBudget > 0 ? `+${formatCOP(extraBudget)}` : "$0"}
          </span>
        </div>
        <input
          type="range"
          min={0} max={sliderMax} step={50_000}
          value={extraBudget}
          onChange={(e) => onChangeExtra(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgba(34,211,238,0.7) 0%, rgba(34,211,238,0.7) ${(extraBudget / sliderMax) * 100}%, rgba(0,0,0,0.4) ${(extraBudget / sliderMax) * 100}%, rgba(0,0,0,0.4) 100%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>$0</span>
          <span>Mínimos: {formatCOPShort(totalMinimum)}/mes</span>
          <span>{formatCOPShort(sliderMax)}</span>
        </div>
      </div>

      {extraBudget > 0 && interestSaved > 0 && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold mb-1">
            <CheckCircle2 className="h-4 w-4" />
            Recomendado: {strategyLabel(recommended)}
          </div>
          <p className="text-sm text-white">
            Con esta estrategia ahorrás <span className="font-bold text-emerald-300 tabular-nums">{formatCOP(interestSaved)}</span> en intereses
            {monthsSaved > 0 && <> y terminás <span className="font-bold text-emerald-300 tabular-nums">{monthsSaved}</span> meses antes</>}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StrategyCard
          plan={comparison.minimumOnly}
          icon={<TrendingDown className="h-4 w-4" />}
          accent="text-gray-300"
          accentBg="from-gray-700 to-gray-800"
          isRecommended={recommended === "MINIMUM_ONLY"}
        />
        <StrategyCard
          plan={comparison.snowball}
          icon={<Snowflake className="h-4 w-4" />}
          accent="text-cyan-300"
          accentBg="from-cyan-500/30 to-blue-600/20"
          isRecommended={recommended === "SNOWBALL"}
        />
        <StrategyCard
          plan={comparison.avalanche}
          icon={<Mountain className="h-4 w-4" />}
          accent="text-violet-300"
          accentBg="from-violet-500/30 to-purple-600/20"
          isRecommended={recommended === "AVALANCHE"}
        />
      </div>

      <div>
        <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-2">
          Trayectoria del saldo total
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tickLine={false} axisLine={false}
                tick={{ fontSize: 9, fill: "#6b7280" }}
                tickFormatter={(m) => m === 0 ? "hoy" : m % 12 === 0 ? `${m / 12}a` : `m${m}`}
                interval="preserveStartEnd" minTickGap={30}
              />
              <YAxis
                tickFormatter={(v) => formatCOPShort(v)}
                tickLine={false} axisLine={false}
                tick={{ fontSize: 9, fill: "#6b7280" }} width={56}
              />
              <Tooltip content={<TrajectoryTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
              <Line type="monotone" dataKey="min" stroke="#9ca3af" strokeWidth={1.5} dot={false} name="Solo mínimos" />
              <Line type="monotone" dataKey="snw" stroke="#22d3ee" strokeWidth={2} dot={false} name="Snowball" />
              <Line type="monotone" dataKey="ava" stroke="#a78bfa" strokeWidth={2} dot={false} name="Avalanche" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 flex-wrap mt-3 pt-3 border-t border-white/[0.04]">
          <Legend color="#9ca3af" label="Solo mínimos" />
          <Legend color="#22d3ee" label="Snowball" />
          <Legend color="#a78bfa" label="Avalanche" />
        </div>
      </div>

      {comparison[recommended === "SNOWBALL" ? "snowball" : recommended === "AVALANCHE" ? "avalanche" : "minimumOnly"]
        .order.length > 1 && (
        <div>
          <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-2">
            Orden de pago — {strategyLabel(recommended)}
          </h4>
          <div className="space-y-1.5">
            {comparison[recommended === "SNOWBALL" ? "snowball" : recommended === "AVALANCHE" ? "avalanche" : "minimumOnly"]
              .order.map((o, i) => (
                <div key={o.debtId} className="flex items-center gap-3 bg-black/20 rounded-lg px-3 py-2 border border-white/[0.04]">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-white truncate">{o.name}</span>
                  <span className="text-xs text-gray-500 tabular-nums">
                    intereses: {formatCOPShort(o.interestPaid)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-300 tabular-nums w-20 text-right">
                    {o.payoffMonth < 0 ? "no liquida" : formatMonths(o.payoffMonth)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StrategyCard({
  plan, icon, accent, accentBg, isRecommended,
}: {
  plan: PayoffPlanDTO; icon: React.ReactNode; accent: string; accentBg: string; isRecommended: boolean;
}) {
  return (
    <div className={`relative bg-secondary rounded-xl border p-4 ${
      isRecommended ? "border-emerald-500/40 ring-1 ring-emerald-500/30" : "border-white/[0.04]"
    }`}>
      {isRecommended && (
        <span className="absolute -top-2 right-3 text-[9px] font-bold uppercase tracking-widest text-emerald-300 bg-[#141418] border border-emerald-500/40 px-1.5 py-0.5 rounded">
          Recomendada
        </span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accentBg} flex items-center justify-center ${accent}`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold ${accent}`}>{strategyLabel(plan.strategy)}</span>
      </div>
      <div className="space-y-1.5">
        <Stat label="Tiempo" value={formatMonths(plan.monthsToFreedom)} />
        <Stat label="Pago/mes" value={formatCOPShort(plan.monthlyTotal)} />
        <Stat label="Total pagado" value={formatCOPShort(plan.totalPaid)} />
        <Stat label="Intereses" value={formatCOPShort(plan.totalInterest)} highlight />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${highlight ? "text-rose-300" : "text-white"}`}>{value}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-[2px] w-4 rounded" style={{ background: color }} />
      <span className="text-[11px] text-gray-400">{label}</span>
    </div>
  );
}

function TrajectoryTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="text-gray-400 font-semibold mb-1">
        {label === 0 ? "Hoy" : `Mes ${label}`}
      </p>
      {payload.map((p: any) => (
        p.value !== undefined && (
          <p key={p.dataKey} className="tabular-nums" style={{ color: p.stroke }}>
            {p.name}: {formatCOP(p.value)}
          </p>
        )
      ))}
    </div>
  );
}

function DebtFormModal({
  open, editing, form, saving, onClose, onChange, onSave,
}: {
  open: boolean; editing: DebtDTO | null; form: DebtFormState; saving: boolean;
  onClose: () => void; onChange: (f: DebtFormState) => void; onSave: () => void;
}) {
  const canSave = form.name.trim().length > 0
    && parseFloat(form.principal || "0") > 0
    && parseFloat(form.minimumPayment || "0") >= 0
    && form.annualRate.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141418] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editing ? "Editar deuda" : "Nueva deuda"}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Input label="Nombre *" value={form.name} onChange={(v) => onChange({ ...form, name: v })} placeholder="Ej. Tarjeta Visa" />
              <Input label="Acreedor" value={form.creditor} onChange={(v) => onChange({ ...form, creditor: v })} placeholder="Banco, entidad…" />
              <Input label="Descripción" value={form.description} onChange={(v) => onChange({ ...form, description: v })} placeholder="Opcional" />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Principal *" type="number" value={form.principal} onChange={(v) => onChange({ ...form, principal: v })} placeholder="0" />
                <Input label="Saldo actual" type="number" value={form.currentBalance} onChange={(v) => onChange({ ...form, currentBalance: v })} placeholder={form.principal || "= principal"} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Tasa anual % *" type="number" step="0.01" value={form.annualRate} onChange={(v) => onChange({ ...form, annualRate: v })} placeholder="18.00" />
                <Input label="Pago mínimo *" type="number" value={form.minimumPayment} onChange={(v) => onChange({ ...form, minimumPayment: v })} placeholder="0" />
              </div>

              <Input label="Fecha de inicio" type="date" value={form.startDate} onChange={(v) => onChange({ ...form, startDate: v })} />
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-white/[0.04]">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={!canSave || saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editing ? "Guardar cambios" : "Crear deuda"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeleteModal({ target, onClose, onConfirm }: {
  target: DebtDTO | null; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141418] border border-rose-500/30 rounded-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center gap-2 text-rose-400 mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-white font-semibold">Eliminar deuda</h3>
            </div>
            <p className="text-sm text-gray-400">
              ¿Seguro que querés eliminar <span className="text-white font-semibold">{target.name}</span>?
              Se moverá a la papelera y podés restaurarla luego.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Input({
  label, value, onChange, type = "text", placeholder, step,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; step?: string;
}) {
  return (
    <div>
      <label className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1 block">{label}</label>
      <input
        type={type} value={value} step={step}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/30 text-white px-3 py-2 rounded-lg border border-white/[0.06] focus:outline-none focus:border-amber-500/40 text-sm"
      />
    </div>
  );
}

interface DebtStats {
  totalBalance: number;
  totalMin: number;
  weightedRate: number;
  activeCount: number;
  paidCount: number;
  mostExpensive: DebtDTO | null;
}

function computeStats(list: DebtDTO[]): DebtStats {
  let totalBalance = 0, totalMin = 0, rateNum = 0, activeCount = 0, paidCount = 0;
  let mostExpensive: DebtDTO | null = null;
  for (const d of list) {
    if (d.status === "PAID_OFF") { paidCount++; continue; }
    if (d.status === "ACTIVE") activeCount++;
    const bal = parseFloat(d.currentBalance);
    if (bal <= 0) continue;
    totalBalance += bal;
    totalMin += parseFloat(d.minimumPayment);
    rateNum += bal * parseFloat(d.annualRate);
    if (!mostExpensive || parseFloat(d.annualRate) > parseFloat(mostExpensive.annualRate)) {
      mostExpensive = d;
    }
  }
  return {
    totalBalance, totalMin,
    weightedRate: totalBalance > 0 ? rateNum / totalBalance : 0,
    activeCount, paidCount, mostExpensive,
  };
}

function strategyLabel(s: string): string {
  switch (s) {
    case "SNOWBALL": return "Snowball";
    case "AVALANCHE": return "Avalanche";
    default: return "Solo mínimos";
  }
}

function formatMonths(m: number): string {
  if (m <= 0) return "—";
  if (m >= 600) return ">50 años";
  if (m < 12) return `${m} meses`;
  const y = Math.floor(m / 12);
  const rem = m % 12;
  if (rem === 0) return `${y} ${y === 1 ? "año" : "años"}`;
  return `${y}a ${rem}m`;
}

function PaymentModal({
  target, accounts, onClose, onPaid,
}: {
  target: DebtDTO | null;
  accounts: AccountDTO[];
  onClose: () => void;
  onPaid: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setAmount("");
      setAccountId("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setErr(null);
    }
  }, [target?.id]);

  if (!target) return null;

  const balance = parseFloat(target.currentBalance);
  const monthlyRate = parseFloat(target.monthlyRate);
  const estimatedMonthlyInterest = balance * monthlyRate;
  const amt = parseFloat(amount || "0");
  const interestEstimate = Math.min(amt, estimatedMonthlyInterest);
  const capitalEstimate = Math.max(0, amt - interestEstimate);

  async function submit() {
    if (!amount || !accountId) return;
    setBusy(true); setErr(null);
    try {
      await debts.recordPayment(target!.id, {
        amount,
        accountId,
        paymentDate,
      });
      onPaid();
    } catch (e: any) {
      setErr(e.message ?? "Error al registrar pago");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#141418] border border-white/[0.08] rounded-2xl w-full max-w-md flex flex-col shadow-2xl max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Registrar pago</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            <div className="bg-secondary border border-white/[0.04] rounded-xl p-3">
              <div className="text-[11px] text-gray-500 uppercase tracking-widest">Deuda</div>
              <div className="text-white font-semibold">{target.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">Saldo actual: {formatCOP(target.currentBalance)}</div>
            </div>

            {err && (
              <div className="p-2.5 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-xs">{err}</div>
            )}

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">Monto a pagar *</label>
              <input
                type="number" min="0" step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={target.minimumPayment}
                className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm tabular-nums"
              />
              <div className="text-[10px] text-gray-500 mt-1">
                Pago mínimo de referencia: {formatCOP(target.minimumPayment)}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">Cuenta origen *</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm"
              >
                <option value="">Seleccioná una cuenta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.bank ? `· ${a.bank}` : ""} ({formatCOPShort(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">Fecha del pago</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm"
              />
            </div>

            {amt > 0 && (
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-1.5">
                <div className="text-[10px] text-cyan-300 uppercase tracking-widest font-semibold">Estimación del pago</div>
                <Row k="Pago total" v={formatCOP(amt)} />
                <Row k="Interés (estimado)" v={`−${formatCOP(interestEstimate)}`} vClass="text-rose-300" />
                <Row k="Capital (reduce saldo)" v={`−${formatCOP(capitalEstimate)}`} vClass="text-emerald-300" />
                <div className="border-t border-white/[0.06] pt-1.5 mt-1.5">
                  <Row k="Saldo después" v={formatCOP(Math.max(0, balance - capitalEstimate))} bold />
                </div>
                <p className="text-[10px] text-gray-500 italic mt-2">
                  Estimación basada en tu tasa mensual. El cálculo real ajusta por días desde tu último pago.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-white/[0.06]">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={busy || !amount || !accountId || amt <= 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar pago
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ k, v, vClass, bold }: { k: string; v: string; vClass?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{k}</span>
      <span className={`tabular-nums ${bold ? "text-white font-bold" : ""} ${vClass ?? "text-gray-200"}`}>{v}</span>
    </div>
  );
}

function DebtDetailDrawer({ target, onClose }: { target: DebtDTO | null; onClose: () => void }) {
  const [summary, setSummary] = useState<DebtSummaryDTO | null>(null);
  const [payments, setPayments] = useState<DebtPaymentDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    Promise.all([
      debts.summary(target.id),
      debts.listPayments(target.id),
    ])
      .then(([s, p]) => { setSummary(s); setPayments(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [target?.id]);

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0f0f12] border-l border-white/[0.06] h-full overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-[#0f0f12]/95 backdrop-blur border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">{target.name}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                </div>
              ) : summary && (
                <>
                  <div className="bg-secondary border border-white/[0.04] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <QualityBadge quality={summary.qualityBadge} />
                      <span className="text-xs text-gray-400">{(parseFloat(target.annualRate) * 100).toFixed(2)}% E.A.</span>
                    </div>
                    <p className="text-sm text-gray-300">{summary.qualityHint}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <StatBig label="Saldo actual" value={formatCOP(summary.currentBalance)} accent="text-rose-300" />
                    <StatBig label="% capital pagado" value={`${parseFloat(summary.capitalProgressPercentage).toFixed(1)}%`} accent="text-emerald-300" />
                    <StatBig label="Capital pagado" value={formatCOP(summary.totalCapitalPaid)} accent="text-emerald-300" />
                    <StatBig label="Intereses pagados" value={formatCOP(summary.totalInterestPaid)} accent="text-rose-300" />
                    <StatBig label="Próximo mes interés" value={formatCOP(summary.nextMonthInterestEstimate)} accent="text-amber-300" />
                    <StatBig label="Pagos registrados" value={String(summary.paymentsCount)} accent="text-white" />
                  </div>

                  <div className="bg-secondary border border-white/[0.04] rounded-2xl">
                    <div className="px-4 py-3 border-b border-white/[0.04]">
                      <h3 className="text-sm font-semibold text-white">Historial de pagos</h3>
                    </div>
                    {payments.length === 0 ? (
                      <p className="text-xs text-gray-500 px-4 py-6 text-center">Aún no registrás pagos para esta deuda</p>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                        {payments.map((p) => (
                          <div key={p.id} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-white tabular-nums">{formatCOP(p.amountTotal)}</span>
                              <span className="text-[11px] text-gray-500">
                                {new Date(p.paymentDate).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-emerald-300 tabular-nums">Capital: {formatCOPShort(p.amountCapital)}</span>
                              <span className="text-rose-300 tabular-nums">Interés: {formatCOPShort(p.amountInterest)}</span>
                              {p.accountName && <span className="text-gray-500">· {p.accountName}</span>}
                            </div>
                            <div className="text-[10px] text-gray-600 mt-0.5">Saldo después: {formatCOPShort(p.balanceAfter)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatBig({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-secondary border border-white/[0.04] rounded-xl p-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}
