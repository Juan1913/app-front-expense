import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import type {
  AccountDTO, CategoryDTO, CreateTransactionDTO, TransactionDTO,
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
              {/* Type toggle */}
              <div className="flex gap-2">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onChange({ ...form, type: t, categoryId: "" })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      form.type === t
                        ? t === "INCOME"
                          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40"
                        : "bg-secondary text-gray-500 hover:text-white border border-white/[0.04]"
                    }`}
                  >
                    {t === "INCOME" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {t === "INCOME" ? "Ingreso" : "Gasto"}
                  </button>
                ))}
              </div>

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
                  value={form.description}
                  onChange={(e) => onChange({ ...form, description: e.target.value })}
                  placeholder="Opcional"
                  className="w-full bg-secondary text-white placeholder-gray-500 px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Cuenta *</label>
                <select
                  value={form.accountId}
                  onChange={(e) => onChange({ ...form, accountId: e.target.value })}
                  className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.bank}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Categoría *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => onChange({ ...form, categoryId: e.target.value })}
                  className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.filter((c) => c.type === form.type).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
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
                disabled={saving || !form.amount || !form.accountId || !form.categoryId}
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
