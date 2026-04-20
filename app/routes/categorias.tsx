import { DashboardLayout } from "~/components/templates";
import { DeleteConfirmModal } from "~/components/molecules";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, X, Loader2, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { categories, type CategoryDTO, type CategoryImpact } from "~/services/api";

interface FormState {
  name: string;
  description: string;
  type: string;
}

const emptyForm: FormState = { name: "", description: "", type: "EXPENSE" };

export default function Categorias() {
  const [list, setList] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<CategoryDTO | null>(null);
  const [impact, setImpact] = useState<CategoryImpact | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    categories.list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(cat: CategoryDTO) {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? "", type: cat.type });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await categories.update(editing.id, form);
        setList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await categories.create(form);
        setList((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm(cat: CategoryDTO) {
    setDeleteTarget(cat);
    setImpact(null);
    setImpactLoading(true);
    categories.impact(cat.id)
      .then(setImpact)
      .catch((e) => setError(e.message))
      .finally(() => setImpactLoading(false));
  }

  async function handleSoftDelete() {
    if (!deleteTarget) return;
    try {
      await categories.remove(deleteTarget.id);
      setList((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleHardDelete() {
    if (!deleteTarget) return;
    try {
      await categories.removePermanent(deleteTarget.id);
      setList((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const filtered = filterType === "ALL" ? list : list.filter((c) => c.type === filterType);

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Categorías</h1>
            <p className="text-sm text-gray-400 mt-0.5">{list.length} categorías registradas</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Nueva categoría
          </button>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {["ALL", "EXPENSE", "INCOME"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === t
                  ? "bg-cyan-600 text-white"
                  : "bg-secondary text-gray-400 hover:text-white"
              }`}
            >
              {t === "ALL" ? "Todas" : t === "EXPENSE" ? "Gastos" : "Ingresos"}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            <AnimatePresence>
              {filtered.map((cat) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-secondary rounded-xl p-4 flex flex-col gap-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      cat.type === "EXPENSE"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-cyan-500/20 text-cyan-400"
                    }`}>
                      <Tag className="h-4 w-4" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(cat)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{cat.name}</p>
                    {cat.description && (
                      <p className="text-gray-500 text-xs mt-0.5 truncate">{cat.description}</p>
                    )}
                  </div>
                  <span className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${
                    cat.type === "EXPENSE"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-cyan-500/20 text-cyan-400"
                  }`}>
                    {cat.type === "EXPENSE" ? "Gasto" : "Ingreso"}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="col-span-4 text-center py-16 text-gray-500 text-sm">
                Sin categorías. Crea la primera.
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">
                  {editing ? "Editar categoría" : "Nueva categoría"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nombre *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Alimentación"
                    className="w-full bg-secondary text-white placeholder-gray-500 px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Descripción</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descripción opcional"
                    className="w-full bg-secondary text-white placeholder-gray-500 px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm"
                  >
                    <option value="EXPENSE">Gasto</option>
                    <option value="INCOME">Ingreso</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
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

      {/* Delete confirmation with impact */}
      <DeleteConfirmModal
        open={deleteTarget !== null}
        title={`Eliminar "${deleteTarget?.name ?? ""}"`}
        description={deleteTarget?.type === "EXPENSE" ? "Categoría de gasto" : "Categoría de ingreso"}
        impact={[
          { label: "Transacciones", count: impact?.transactions ?? 0 },
          { label: "Presupuestos",  count: impact?.budgets ?? 0 },
        ]}
        impactLoading={impactLoading}
        onClose={() => setDeleteTarget(null)}
        onTrash={handleSoftDelete}
        onPermanent={handleHardDelete}
      />
    </DashboardLayout>
  );
}
