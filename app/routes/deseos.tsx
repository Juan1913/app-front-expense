import { DashboardLayout } from "~/components/templates";
import {
  WishlistCard, WishlistDrawer, WishlistModal,
  emptyWishlistForm, type WishlistFormState,
} from "~/components/molecules";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Gift, Search, X,
  Target, TrendingUp, CheckCircle2, Sparkles,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  wishlist, formatCOPShort,
  type WishlistDTO, type WishlistStatus,
} from "~/services/api";

type StatusFilter = "ALL" | WishlistStatus;
type SortBy = "progress" | "createdAt" | "deadline" | "name";

const STATUS_OPTIONS: { value: StatusFilter; label: string; dot: string }[] = [
  { value: "ALL",       label: "Todos",      dot: "bg-gray-500" },
  { value: "ACTIVE",    label: "Activos",    dot: "bg-cyan-500" },
  { value: "COMPLETED", label: "Completados", dot: "bg-emerald-500" },
  { value: "CANCELLED", label: "Cancelados", dot: "bg-rose-500" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "progress",  label: "Progreso" },
  { value: "createdAt", label: "Más recientes" },
  { value: "deadline",  label: "Fecha límite" },
  { value: "name",      label: "Nombre" },
];

export default function Deseos() {
  const [list, setList] = useState<WishlistDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("progress");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WishlistDTO | null>(null);
  const [form, setForm] = useState<WishlistFormState>(emptyWishlistForm);
  const [saving, setSaving] = useState(false);
  const [detailTarget, setDetailTarget] = useState<WishlistDTO | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    wishlist.list(statusFilter !== "ALL" ? { status: statusFilter } : undefined)
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = useMemo(() => {
    let result = list;
    if (searchDebounced.trim()) {
      const s = searchDebounced.toLowerCase();
      result = result.filter((w) =>
        w.name.toLowerCase().includes(s) ||
        (w.description ?? "").toLowerCase().includes(s)
      );
    }
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "progress":  return parseFloat(b.progressPercentage) - parseFloat(a.progressPercentage);
        case "createdAt": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "deadline":  {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        case "name":      return a.name.localeCompare(b.name);
      }
    });
  }, [list, searchDebounced, sortBy]);

  const stats = useMemo(() => {
    const count        = list.length;
    const activeSum    = list.filter(w => w.status === "ACTIVE").reduce((s, w) => s + parseFloat(w.currentAmount), 0);
    const activeTarget = list.filter(w => w.status === "ACTIVE").reduce((s, w) => s + parseFloat(w.targetAmount), 0);
    const completed    = list.filter(w => w.status === "COMPLETED").length;
    return { count, activeSum, activeTarget, completed };
  }, [list]);

  function openCreate() {
    setEditing(null);
    setForm(emptyWishlistForm);
    setShowModal(true);
  }
  function openEdit(w: WishlistDTO) {
    setEditing(w);
    setForm({
      name: w.name,
      description: w.description ?? "",
      targetAmount: w.targetAmount,
      deadline: w.deadline ?? "",
    });
    setShowModal(true);
  }

  async function reloadList() {
    const fresh = await wishlist.list(statusFilter !== "ALL" ? { status: statusFilter } : undefined);
    setList(fresh);
  }

  async function handleSave() {
    if (!form.name.trim() || !parseFloat(form.targetAmount || "0")) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        targetAmount: form.targetAmount,
        deadline: form.deadline || undefined,
      };
      if (editing) await wishlist.update(editing.id, payload);
      else         await wishlist.create(payload);
      await reloadList();
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally { setSaving(false); }
  }

  async function handleDelete(w: WishlistDTO) {
    if (!confirm(`¿Eliminar "${w.name}"?`)) return;
    try {
      await wishlist.remove(w.id);
      setList((prev) => prev.filter(x => x.id !== w.id));
      setDetailTarget(null);
    } catch (e: any) { setError(e.message); }
  }

  async function patchStatus(w: WishlistDTO, status: WishlistStatus) {
    const updated = await wishlist.update(w.id, { status });
    setList((prev) => prev.map(x => x.id === w.id ? updated : x));
    setDetailTarget(updated);
  }

  async function handleAddSavings(w: WishlistDTO, newCurrent: string) {
    const updated = await wishlist.update(w.id, { currentAmount: newCurrent });
    setList((prev) => prev.map(x => x.id === w.id ? updated : x));
    setDetailTarget(updated);
  }

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
            <h1 className="text-2xl font-bold text-white tracking-tight">Lista de Deseos</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Fija metas de ahorro y ve tu progreso hasta cumplirlas
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            Nuevo deseo
          </button>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard delay={0.05} icon={<Gift className="h-5 w-5 text-white" />}         gradient="from-cyan-400 to-blue-600"    label="Deseos"       value={String(stats.count)}                   subtext={stats.count === 1 ? "registrado" : "registrados"} />
          <StatCard delay={0.10} icon={<TrendingUp className="h-5 w-5 text-white" />}   gradient="from-emerald-400 to-teal-600" label="Ahorrado"     value={formatCOPShort(stats.activeSum)}       subtext="en deseos activos" />
          <StatCard delay={0.15} icon={<Target className="h-5 w-5 text-white" />}       gradient="from-violet-400 to-purple-600" label="Meta total"   value={formatCOPShort(stats.activeTarget)}    subtext="suma de metas activas" />
          <StatCard delay={0.20} icon={<CheckCircle2 className="h-5 w-5 text-white" />} gradient="from-amber-400 to-orange-600" label="Completados" value={String(stats.completed)}                subtext={stats.completed === 1 ? "deseo cumplido" : "deseos cumplidos"} />
        </div>

        {/* Filter toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary rounded-xl border border-white/[0.04] p-2.5 flex items-center gap-3 flex-wrap"
        >
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar deseo…"
              className="w-full bg-black/20 text-white placeholder-gray-500 pl-9 pr-8 py-2 rounded-lg border border-white/[0.04] focus:outline-none focus:border-cyan-500/40 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/[0.06]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-0.5 bg-black/20 rounded-lg p-0.5 border border-white/[0.04]">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setStatusFilter(o.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === o.value
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${o.dot}`} />
                {o.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-black/20 text-white px-3 py-2 rounded-lg border border-white/[0.04] text-xs font-medium cursor-pointer focus:outline-none focus:border-cyan-500/40 appearance-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Orden: {o.label}</option>
            ))}
          </select>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              {list.length === 0 ? "Aún no tienes deseos" : "No hay deseos con esos filtros"}
            </p>
            <p className="text-xs text-gray-600 mt-1 max-w-[320px] mx-auto">
              {list.length === 0
                ? "Crea tu primer deseo — una meta de ahorro con nombre y monto"
                : "Prueba ajustar los filtros"}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filtered.map((w, i) => (
                <WishlistCard
                  key={w.id}
                  wish={w}
                  delay={i * 0.04}
                  onOpen={() => setDetailTarget(w)}
                  onEdit={() => openEdit(w)}
                  onDelete={() => handleDelete(w)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <WishlistModal
        open={showModal}
        editing={editing}
        form={form}
        saving={saving}
        onClose={() => setShowModal(false)}
        onChange={setForm}
        onSave={handleSave}
      />

      <WishlistDrawer
        wish={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={() => { if (detailTarget) { openEdit(detailTarget); setDetailTarget(null); } }}
        onDelete={() => { if (detailTarget) handleDelete(detailTarget); }}
        onAddSavings={(v) => detailTarget ? handleAddSavings(detailTarget, v) : Promise.resolve()}
        onMarkComplete={() => detailTarget ? patchStatus(detailTarget, "COMPLETED") : Promise.resolve()}
        onMarkCancelled={() => detailTarget ? patchStatus(detailTarget, "CANCELLED") : Promise.resolve()}
        onReactivate={() => detailTarget ? patchStatus(detailTarget, "ACTIVE") : Promise.resolve()}
      />
    </DashboardLayout>
  );
}

function StatCard({
  delay, icon, gradient, label, value, subtext,
}: { delay: number; icon: React.ReactNode; gradient: string; label: string; value: string; subtext?: string }) {
  return (
    <motion.div
      className="bg-secondary rounded-xl p-4 border border-white/[0.04] relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">{label}</div>
          <div className="text-[22px] font-bold text-white leading-tight truncate tabular-nums">{value}</div>
          {subtext && <div className="text-[11px] text-gray-500 mt-1 truncate">{subtext}</div>}
        </div>
        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
