import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Trash2, TrendingUp, TrendingDown, Calendar, Tag, CreditCard } from "lucide-react";
import type { TransactionDTO } from "~/services/api";
import { formatCOP } from "~/services/api";

interface Props {
  tx: TransactionDTO | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionDrawer({ tx, onClose, onEdit, onDelete }: Props) {
  return (
    <AnimatePresence>
      {tx && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0f0f12] border-l border-white/[0.06] h-full overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-[#0f0f12]/95 backdrop-blur-sm border-b border-white/[0.04] px-5 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Detalle de transacción</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Hero */}
              <div
                className="rounded-2xl p-6 text-center"
                style={{
                  background: tx.type === "INCOME"
                    ? "radial-gradient(circle at top, rgba(52,211,153,0.18), transparent 70%), #121215"
                    : "radial-gradient(circle at top, rgba(251,113,133,0.18), transparent 70%), #121215",
                }}
              >
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 ${
                  tx.type === "INCOME"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}>
                  {tx.type === "INCOME" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {tx.type === "INCOME" ? "Ingreso" : "Gasto"}
                </div>
                <div className={`text-3xl font-bold tabular-nums ${tx.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}`}>
                  {tx.type === "INCOME" ? "+" : "−"}{formatCOP(tx.amount)}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {tx.description || <span className="italic text-gray-600">Sin descripción</span>}
                </p>
              </div>

              {/* Info rows */}
              <div className="bg-secondary rounded-xl border border-white/[0.04] divide-y divide-white/[0.04]">
                <InfoRow label="Categoría" value={tx.categoryName} icon={<Tag className="h-3.5 w-3.5 text-gray-500" />} />
                <InfoRow label="Cuenta"    value={tx.accountName}  icon={<CreditCard className="h-3.5 w-3.5 text-gray-500" />} />
                <InfoRow
                  label="Fecha"
                  value={new Date(tx.date).toLocaleString("es-CO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  icon={<Calendar className="h-3.5 w-3.5 text-gray-500" />}
                />
                <InfoRow
                  label="Registrada"
                  value={new Date(tx.createdAt).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onEdit}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/20 transition-colors"
                >
                  <Edit3 className="h-4 w-4" /> Editar
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/15 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Eliminar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm text-white font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
