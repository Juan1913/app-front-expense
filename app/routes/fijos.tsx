import { DashboardLayout } from "~/components/templates";
import { DeleteConfirmModal } from "~/components/molecules";
import { motion, AnimatePresence } from "framer-motion";
import {
  Repeat, Plus, X, Loader2, Edit3, Trash2, CheckCircle2, Pause, Play,
  Calendar, AlertTriangle, Coins,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  recurringTransactions, accounts, categories, formatCOP, formatCOPShort,
  type RecurringTransactionDTO, type AccountDTO, type CategoryDTO,
  type RecurringFrequency,
} from "~/services/api";

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

interface FormState {
  amount: string;
  description: string;
  type: "EXPENSE" | "INCOME";
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;
  accountId: string;
  categoryId: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: FormState = {
  amount: "",
  description: "",
  type: "EXPENSE",
  frequency: "MONTHLY",
  startDate: today(),
  endDate: "",
  accountId: "",
  categoryId: "",
};

export default function Fijos() {
  const [list, setList] = useState<RecurringTransactionDTO[]>([]);
  const [accountList, setAccountList] = useState<AccountDTO[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RecurringTransactionDTO | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransactionDTO | null>(null);

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    accounts.list().then(setAccountList).catch(() => {});
    categories.list().then(setCategoryList).catch(() => {});
  }, []);

  function reload() {
    setLoading(true);
    recurringTransactions.list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  const stats = useMemo(() => {
    const active = list.filter((r) => r.active);
    const overdue = active.filter((r) => r.nextExecution <= today());
    const monthlyTotal = active.reduce((s, r) => {
      const amt = parseFloat(r.amount);
      const multiplier = r.frequency === "MONTHLY" ? 1
        : r.frequency === "WEEKLY" ? 4.33
        : r.frequency === "DAILY" ? 30
        : 1 / 12;
      const sign = r.type === "INCOME" ? 1 : -1;
      return s + sign * amt * multiplier;
    }, 0);
    return {
      activeCount: active.length,
      overdueCount: overdue.length,
      monthlyTotal,
    };
  }, [list]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, startDate: today() });
    setShowModal(true);
  }
  function openEdit(r: RecurringTransactionDTO) {
    setEditing(r);
    setForm({
      amount: r.amount,
      description: r.description,
      type: r.type === "INCOME" ? "INCOME" : "EXPENSE",
      frequency: r.frequency,
      startDate: r.startDate,
      endDate: r.endDate ?? "",
      accountId: r.accountId,
      categoryId: r.categoryId,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.amount || !form.description.trim() || !form.accountId || !form.categoryId) return;
    setSaving(true);
    try {
      if (editing) {
        await recurringTransactions.update(editing.id, {
          amount: form.amount,
          description: form.description,
          frequency: form.frequency,
          endDate: form.endDate || undefined,
          accountId: form.accountId,
          categoryId: form.categoryId,
        });
      } else {
        await recurringTransactions.create({
          amount: form.amount,
          description: form.description,
          type: form.type,
          frequency: form.frequency,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          accountId: form.accountId,
          categoryId: form.categoryId,
        });
      }
      reload();
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function applyOne(r: RecurringTransactionDTO) {
    setBusy(r.id);
    try {
      await recurringTransactions.apply(r.id);
      reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function applyAllOverdue() {
    setBusy("__all__");
    try {
      const res = await recurringTransactions.applyDue();
      reload();
      if (res.created === 0) {
        setError("No había pagos vencidos para aplicar.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function togglePause(r: RecurringTransactionDTO) {
    setBusy(r.id);
    try {
      await recurringTransactions.update(r.id, { active: !r.active });
      reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleTrash() {
    if (!deleteTarget) return;
    setBusy(deleteTarget.id);
    try {
      await recurringTransactions.remove(deleteTarget.id);
      setList((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
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
              <Repeat className="h-6 w-6 text-cyan-400" /> Gastos fijos
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Plantillas para gastos e ingresos recurrentes — vos los aplicás cuando los pagás
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {stats.overdueCount > 0 && (
              <button
                onClick={applyAllOverdue}
                disabled={busy === "__all__"}
                className="flex items-center gap-2 px-3 py-2.5 bg-amber-500/15 text-amber-200 border border-amber-500/40 hover:bg-amber-500/25 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
              >
                {busy === "__all__" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Aplicar {stats.overdueCount} vencido{stats.overdueCount === 1 ? "" : "s"}
              </button>
            )}
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
            >
              <Plus className="h-4 w-4" /> Nuevo
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Stat label="Activos" value={String(stats.activeCount)} accent="text-cyan-300" />
          <Stat label="Pagos vencidos" value={String(stats.overdueCount)} accent={stats.overdueCount > 0 ? "text-amber-300" : "text-emerald-300"} />
          <Stat
            label="Impacto mensual estimado"
            value={`${stats.monthlyTotal >= 0 ? "+" : "−"}${formatCOPShort(Math.abs(stats.monthlyTotal))}`}
            accent={stats.monthlyTotal >= 0 ? "text-emerald-300" : "text-rose-300"}
          />
        </div>

        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            <Repeat className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Aún no creaste ningún gasto fijo</p>
            <p className="text-xs text-gray-600 mt-1 max-w-[340px] mx-auto">
              Creá plantillas para arriendo, gym, suscripciones, etc. Cuando los pagués, hacés click en
              "Marcar pagado" y se crea la transacción real.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {list.map((r) => (
                <RecurringRow
                  key={r.id}
                  r={r}
                  busy={busy === r.id}
                  onApply={() => applyOne(r)}
                  onTogglePause={() => togglePause(r)}
                  onEdit={() => openEdit(r)}
                  onDelete={() => setDeleteTarget(r)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <FormModal
        open={showModal}
        editing={editing}
        form={form}
        saving={saving}
        accounts={accountList}
        categories={categoryList}
        onClose={() => setShowModal(false)}
        onChange={setForm}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        title="Eliminar gasto fijo"
        description={deleteTarget
          ? `${deleteTarget.description} · ${formatCOP(deleteTarget.amount)} ${FREQ_LABEL[deleteTarget.frequency].toLowerCase()}`
          : ""}
        impact={[]}
        onClose={() => setDeleteTarget(null)}
        onTrash={handleTrash}
        onPermanent={handleTrash}
      />
    </DashboardLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-secondary border border-white/[0.04] rounded-xl p-4">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function RecurringRow({
  r, busy, onApply, onTogglePause, onEdit, onDelete,
}: {
  r: RecurringTransactionDTO;
  busy: boolean;
  onApply: () => void;
  onTogglePause: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = r.active && r.nextExecution <= today();
  const isIncome = r.type === "INCOME";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={`bg-secondary rounded-xl border p-4 ${
        !r.active ? "border-white/[0.04] opacity-60"
          : overdue ? "border-amber-500/40"
          : "border-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base truncate">{r.description}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
              isIncome ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
            }`}>
              {isIncome ? "Ingreso" : "Gasto"}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
              {FREQ_LABEL[r.frequency]}
            </span>
            {!r.active && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-400">
                Pausado
              </span>
            )}
            {overdue && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Vencido
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <Field label="Monto" value={formatCOP(r.amount)} accent={isIncome ? "text-emerald-300" : "text-rose-300"} />
            <Field label="Cuenta" value={r.accountName} accent="text-gray-300" />
            <Field label="Categoría" value={r.categoryName} accent="text-gray-300" />
            <Field
              label="Próximo pago"
              value={new Date(r.nextExecution).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
              accent={overdue ? "text-amber-300" : "text-violet-300"}
            />
          </div>

          {r.lastExecutedAt && (
            <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Último aplicado: {new Date(r.lastExecutedAt).toLocaleDateString("es-CO")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {r.active && (
            <button
              onClick={onApply}
              disabled={busy}
              title="Marcar como pagado (crea transacción)"
              className="p-2 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/15 rounded-lg transition-colors disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={onTogglePause}
            disabled={busy}
            title={r.active ? "Pausar" : "Reanudar"}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors disabled:opacity-40"
          >
            {r.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={onEdit}
            title="Editar"
            className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            title="Eliminar"
            className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
      <div className={`text-sm font-semibold tabular-nums truncate ${accent}`}>{value}</div>
    </div>
  );
}

function FormModal({
  open, editing, form, saving, accounts, categories,
  onClose, onChange, onSave,
}: {
  open: boolean;
  editing: RecurringTransactionDTO | null;
  form: FormState;
  saving: boolean;
  accounts: AccountDTO[];
  categories: CategoryDTO[];
  onClose: () => void;
  onChange: (f: FormState) => void;
  onSave: () => void;
}) {
  const filteredCats = categories.filter((c) => c.type === form.type);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141418] border border-white/[0.06] rounded-2xl w-full max-w-md flex flex-col shadow-2xl max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white">
                {editing ? "Editar gasto fijo" : "Nuevo gasto fijo"}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">Descripción *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => onChange({ ...form, description: e.target.value })}
                  placeholder="Ej. Arriendo, Gym, Netflix"
                  className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm"
                />
              </div>

              {!editing && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onChange({ ...form, type: "EXPENSE", categoryId: "" })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      form.type === "EXPENSE"
                        ? "bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40"
                        : "bg-secondary text-gray-400 hover:text-white border border-white/[0.04]"
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    onClick={() => onChange({ ...form, type: "INCOME", categoryId: "" })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      form.type === "INCOME"
                        ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40"
                        : "bg-secondary text-gray-400 hover:text-white border border-white/[0.04]"
                    }`}
                  >
                    Ingreso
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">Monto *</label>
                  <input
                    type="number" min="0" step="1000"
                    value={form.amount}
                    onChange={(e) => onChange({ ...form, amount: e.target.value })}
                    placeholder="Ej. 1200000"
                    className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">Frecuencia</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => onChange({ ...form, frequency: e.target.value as RecurringFrequency })}
                    className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm"
                  >
                    <option value="DAILY">Diaria</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="MONTHLY">Mensual</option>
                    <option value="YEARLY">Anual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">Cuenta de descuento *</label>
                <select
                  value={form.accountId}
                  onChange={(e) => onChange({ ...form, accountId: e.target.value })}
                  className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm"
                >
                  <option value="">Seleccioná una cuenta</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} {a.bank ? `· ${a.bank}` : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">Categoría *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => onChange({ ...form, categoryId: e.target.value })}
                  className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm"
                >
                  <option value="">Seleccioná una categoría</option>
                  {filteredCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">
                    {editing ? "Inicio" : "Primer pago"} *
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    disabled={!!editing}
                    onChange={(e) => onChange({ ...form, startDate: e.target.value })}
                    className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1.5 block">Fin (opcional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => onChange({ ...form, endDate: e.target.value })}
                    className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-white/[0.06] focus:outline-none focus:border-cyan-500/40 text-sm"
                  />
                </div>
              </div>

              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 flex items-start gap-2">
                <Coins className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Esto crea una <strong>plantilla</strong>, no una transacción.
                  Cuando realmente pagues, marcá "Marcar como pagado" en la lista para descontar de tu cuenta.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-white/[0.06]">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/[0.04]">
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={saving || !form.amount || !form.description.trim() || !form.accountId || !form.categoryId}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
