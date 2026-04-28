import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, TrendingUp, TrendingDown, ArrowRightLeft, PiggyBank } from "lucide-react";
import {
  formatCOPShort,
  type AccountDTO, type CategoryDTO, type CreateTransactionDTO,
  type TransactionDTO, type TransactionType,
} from "~/services/api";

interface Props {
  open: boolean;
  editing: TransactionDTO | null;
  form: CreateTransactionDTO;
  saving: boolean;
  accounts: AccountDTO[];
  categories: CategoryDTO[];
  onClose: () => void;
  onChange: (f: CreateTransactionDTO) => void;
  onSave: () => void;
}

export function TransactionModal({
  open, editing, form, saving, accounts, categories,
  onClose, onChange, onSave,
}: Props) {
  const isTransfer = form.type === "TRANSFER";
  const sourceAccount = accounts.find((a) => a.id === form.accountId);
  const sourceBalance = sourceAccount ? parseFloat(sourceAccount.balance) : 0;
  const amountNum = parseFloat(form.amount || "0");

  // Para EXPENSE/TRANSFER (origen), el monto no puede superar el saldo disponible.
  const needsBalance = form.type === "EXPENSE" || isTransfer;
  const overdraft = needsBalance && amountNum > 0 && amountNum > sourceBalance;

  const canSave = !!form.amount && amountNum > 0 && !!form.accountId && !overdraft && (
    isTransfer
      ? !!form.transferToAccountId && form.transferToAccountId !== form.accountId
      : !!form.categoryId
  );

  function pickType(t: TransactionType) {
    if (t === "TRANSFER") {
      onChange({ ...form, type: t, categoryId: undefined });
    } else {
      onChange({ ...form, type: t, transferToAccountId: undefined, categoryId: "" });
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141418] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editing ? "Editar transacción" : "Nueva transacción"}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <TypeButton
                  active={form.type === "EXPENSE"}
                  onClick={() => pickType("EXPENSE")}
                  activeClass="bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40"
                  icon={<TrendingDown className="h-4 w-4" />}
                  label="Gasto"
                />
                <TypeButton
                  active={form.type === "INCOME"}
                  onClick={() => pickType("INCOME")}
                  activeClass="bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Ingreso"
                />
                <TypeButton
                  active={form.type === "TRANSFER"}
                  onClick={() => pickType("TRANSFER")}
                  activeClass="bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                  icon={<ArrowRightLeft className="h-4 w-4" />}
                  label="Mover"
                />
              </div>

              {isTransfer && (
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-3 py-2 flex items-start gap-2">
                  <PiggyBank className="h-3.5 w-3.5 text-cyan-300 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-cyan-200/90">
                    Mueve plata entre tus propias cuentas. No cuenta como ingreso ni gasto;
                    si la cuenta destino es de ahorro, suma a tu "Ahorrado".
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Monto *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => onChange({ ...form, amount: e.target.value })}
                    placeholder="0"
                    className="w-full bg-secondary text-white placeholder-gray-500 px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Fecha *</label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => onChange({ ...form, date: e.target.value })}
                    className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Descripción</label>
                <input
                  value={form.description ?? ""}
                  onChange={(e) => onChange({ ...form, description: e.target.value })}
                  placeholder="Opcional"
                  className="w-full bg-secondary text-white placeholder-gray-500 px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label className="text-sm text-gray-400">
                    {isTransfer ? "Cuenta origen *" : "Cuenta *"}
                  </label>
                  {sourceAccount && needsBalance && (
                    <span className={`text-[11px] tabular-nums ${overdraft ? "text-rose-400" : "text-gray-500"}`}>
                      Disponible: {formatCOPShort(sourceBalance)}
                    </span>
                  )}
                </div>
                <select
                  value={form.accountId}
                  onChange={(e) => onChange({ ...form, accountId: e.target.value })}
                  className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.savings ? "🏦 " : ""}{a.name} · {a.bank} · {formatCOPShort(a.balance)}
                    </option>
                  ))}
                </select>
                {overdraft && (
                  <p className="text-[11px] text-rose-400 mt-1">
                    Saldo insuficiente. Te falta {formatCOPShort(amountNum - sourceBalance)}.
                  </p>
                )}
              </div>

              {isTransfer ? (
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Cuenta destino *</label>
                  <select
                    value={form.transferToAccountId ?? ""}
                    onChange={(e) => onChange({ ...form, transferToAccountId: e.target.value || undefined })}
                    className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar destino</option>
                    {accounts
                      .filter((a) => a.id !== form.accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.savings ? "🏦 " : ""}{a.name} · {a.bank}
                        </option>
                      ))}
                  </select>
                  {form.transferToAccountId && form.accountId === form.transferToAccountId && (
                    <p className="text-[11px] text-rose-400 mt-1">Las cuentas deben ser distintas</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Categoría *</label>
                  <select
                    value={form.categoryId ?? ""}
                    onChange={(e) => onChange({ ...form, categoryId: e.target.value })}
                    className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.filter((c) => c.type === form.type).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={saving || !canSave}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
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

function TypeButton({
  active, onClick, activeClass, icon, label,
}: {
  active: boolean; onClick: () => void; activeClass: string;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
        active ? activeClass : "bg-secondary text-gray-500 hover:text-white border border-white/[0.04]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
