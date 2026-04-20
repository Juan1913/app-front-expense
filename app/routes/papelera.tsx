import { DashboardLayout } from "~/components/templates";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, RotateCcw, Loader2, CreditCard, Tag, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { accounts, categories, formatCOP, type AccountDTO, type CategoryDTO } from "~/services/api";

type TrashKind = "account" | "category";

export default function Papelera() {
  const [trashAccounts, setTrashAccounts] = useState<AccountDTO[]>([]);
  const [trashCategories, setTrashCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([accounts.trash(), categories.trash()]);
      setTrashAccounts(a);
      setTrashCategories(c);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function restore(kind: TrashKind, id: string) {
    setBusy(id);
    try {
      if (kind === "account") {
        await accounts.restore(id);
        setTrashAccounts((prev) => prev.filter((a) => a.id !== id));
      } else {
        await categories.restore(id);
        setTrashCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function destroy(kind: TrashKind, id: string, name: string) {
    if (!confirm(`Eliminar permanentemente "${name}"? Esta acción no se puede deshacer.`)) return;
    setBusy(id);
    try {
      if (kind === "account") {
        await accounts.removePermanent(id);
        setTrashAccounts((prev) => prev.filter((a) => a.id !== id));
      } else {
        await categories.removePermanent(id);
        setTrashCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  const totalItems = trashAccounts.length + trashCategories.length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Papelera</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {totalItems === 0
                  ? "No hay elementos eliminados"
                  : `${totalItems} ${totalItems === 1 ? "elemento" : "elementos"} en papelera`}
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">La papelera está vacía</p>
          </div>
        ) : (
          <>
            {/* Accounts section */}
            {trashAccounts.length > 0 && (
              <TrashSection
                title="Cuentas"
                icon={<CreditCard className="h-4 w-4 text-cyan-400" />}
                count={trashAccounts.length}
              >
                <AnimatePresence>
                  {trashAccounts.map((acc) => (
                    <TrashRow
                      key={acc.id}
                      id={acc.id}
                      busy={busy === acc.id}
                      title={acc.name}
                      subtitle={
                        <>
                          <span className="text-cyan-400">{acc.bank}</span>
                          {acc.cardNumber && <span className="text-gray-500 ml-2">· {acc.cardNumber}</span>}
                          <span className="text-gray-500 ml-2">· {formatCOP(acc.balance)} {acc.currency}</span>
                        </>
                      }
                      accent="cyan"
                      icon={<CreditCard className="h-4 w-4" />}
                      onRestore={() => restore("account", acc.id)}
                      onPermanent={() => destroy("account", acc.id, acc.name)}
                    />
                  ))}
                </AnimatePresence>
              </TrashSection>
            )}

            {/* Categories section */}
            {trashCategories.length > 0 && (
              <TrashSection
                title="Categorías"
                icon={<Tag className="h-4 w-4 text-violet-400" />}
                count={trashCategories.length}
              >
                <AnimatePresence>
                  {trashCategories.map((cat) => (
                    <TrashRow
                      key={cat.id}
                      id={cat.id}
                      busy={busy === cat.id}
                      title={cat.name}
                      subtitle={
                        <span className={cat.type === "EXPENSE" ? "text-rose-400" : "text-emerald-400"}>
                          {cat.type === "EXPENSE" ? "Gasto" : "Ingreso"}
                          {cat.description && <span className="text-gray-500 ml-2">· {cat.description}</span>}
                        </span>
                      }
                      accent="violet"
                      icon={<Tag className="h-4 w-4" />}
                      onRestore={() => restore("category", cat.id)}
                      onPermanent={() => destroy("category", cat.id, cat.name)}
                    />
                  ))}
                </AnimatePresence>
              </TrashSection>
            )}

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Al <span className="font-semibold">restaurar</span> una cuenta o categoría, sus transacciones y
                presupuestos relacionados también se restauran.
                La <span className="font-semibold">eliminación permanente</span> borra todo en cascada
                y no se puede deshacer.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrashSection({
  title, icon, count, children,
}: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary rounded-2xl border border-white/[0.04] overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-gray-500 bg-white/[0.05] px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div>{children}</div>
    </motion.div>
  );
}

function TrashRow({
  id, busy, title, subtitle, icon, accent, onRestore, onPermanent,
}: {
  id: string;
  busy: boolean;
  title: string;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  accent: "cyan" | "violet";
  onRestore: () => void;
  onPermanent: () => void;
}) {
  const accentBg  = accent === "cyan" ? "bg-cyan-500/15 text-cyan-400" : "bg-violet-500/15 text-violet-400";
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <p className="text-[11px] mt-0.5 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onRestore}
          disabled={busy}
          title="Restaurar"
          className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        </button>
        <button
          onClick={onPermanent}
          disabled={busy}
          title="Eliminar permanentemente"
          className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
