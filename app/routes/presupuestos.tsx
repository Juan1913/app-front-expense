import { DashboardLayout } from "~/components/templates";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit3, Trash2, X, Loader2, Target, ChevronLeft, ChevronRight,
  CalendarRange, Search, ArrowRight, TrendingDown, TrendingUp,
  AlertTriangle, CheckCircle2, Flame, ChevronDown,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  budgets, categories, transactions as txnApi,
  formatCOP, formatCOPShort,
  type BudgetComparisonItem, type CategoryDTO, type TransactionDTO,
} from "~/services/api";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type StatusFilter = "ALL" | "ON_TRACK" | "WARNING" | "EXCEEDED";
type SortBy = "percentage" | "budgeted" | "actual" | "category";

const STATUS_OPTIONS: { value: StatusFilter; label: string; dot: string }[] = [
  { value: "ALL",       label: "Todos",      dot: "bg-gray-500" },
  { value: "ON_TRACK",  label: "En camino",  dot: "bg-emerald-500" },
  { value: "WARNING",   label: "Atención",   dot: "bg-amber-500" },
  { value: "EXCEEDED",  label: "Excedido",   dot: "bg-rose-500" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "percentage", label: "% cumplimiento" },
  { value: "actual",     label: "Gastado" },
  { value: "budgeted",   label: "Presupuestado" },
  { value: "category",   label: "Categoría" },
];

// Category color from name hash
function categoryColor(name: string): string {
  const COLORS = ["#22d3ee","#a78bfa","#fb7185","#fbbf24","#34d399","#60a5fa","#f97316","#e879f9"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function getStatus(pct: number): "ON_TRACK" | "WARNING" | "EXCEEDED" {
  if (pct >= 100) return "EXCEEDED";
  if (pct >= 75)  return "WARNING";
  return "ON_TRACK";
}

function statusStyle(s: "ON_TRACK" | "WARNING" | "EXCEEDED") {
  if (s === "EXCEEDED") return { bar: "bg-rose-500",    text: "text-rose-400",    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",       label: "Excedido",  Icon: Flame };
  if (s === "WARNING")  return { bar: "bg-amber-500",   text: "text-amber-400",   badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",    label: "Atención",  Icon: AlertTriangle };
  return                { bar: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "En camino", Icon: CheckCircle2 };
}

function daysLeftInMonth(month: number, year: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
  if (!isCurrentMonth) return 0;
  const lastDay = new Date(year, month, 0).getDate();
  return Math.max(0, lastDay - today.getDate());
}

interface FormState {
  categoryId: string;
  amount: string;
}

const emptyForm: FormState = { categoryId: "", amount: "" };

export default function Presupuestos() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  // Data
  const [list, setList] = useState<BudgetComparisonItem[]>([]);
  const [cats, setCats] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("percentage");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BudgetComparisonItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Details drawer
  const [detailTarget, setDetailTarget] = useState<BudgetComparisonItem | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  // Load expense categories
  useEffect(() => {
    categories.list("EXPENSE").then(setCats).catch(() => {});
  }, []);

  // Load comparison data when period changes
  useEffect(() => {
    setLoading(true);
    budgets.comparison({ month, year })
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month, year]);

  function shiftPeriod(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1)  { m = 12; y -= 1; }
    if (m > 12) { m = 1;  y += 1; }
    setMonth(m);
    setYear(y);
  }
  function goToCurrent() {
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  }

  // ── Derived: filtered + sorted list ──
  const filtered = useMemo(() => {
    let result = list;
    if (searchDebounced.trim()) {
      const s = searchDebounced.toLowerCase();
      result = result.filter((b) => b.categoryName.toLowerCase().includes(s));
    }
    if (statusFilter !== "ALL") {
      result = result.filter((b) => getStatus(parseFloat(b.percentage)) === statusFilter);
    }
    if (categoryFilter !== "ALL") {
      result = result.filter((b) => b.categoryId === categoryFilter);
    }
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case "percentage": return parseFloat(b.percentage) - parseFloat(a.percentage);
        case "actual":     return parseFloat(b.actual) - parseFloat(a.actual);
        case "budgeted":   return parseFloat(b.budgeted) - parseFloat(a.budgeted);
        case "category":   return a.categoryName.localeCompare(b.categoryName);
      }
    });
    return sorted;
  }, [list, searchDebounced, statusFilter, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    const count = list.length;
    const totalBudgeted = list.reduce((s, b) => s + parseFloat(b.budgeted), 0);
    const totalActual   = list.reduce((s, b) => s + parseFloat(b.actual),   0);
    const avgPct = count > 0 ? totalActual / Math.max(totalBudgeted, 1) * 100 : 0;
    const exceeded = list.filter((b) => parseFloat(b.percentage) >= 100).length;
    return { count, totalBudgeted, totalActual, avgPct, exceeded };
  }, [list]);

  const usedCategoryIds = useMemo(
    () => new Set(list.filter((b) => !editing || b.id !== editing.id).map((b) => b.categoryId)),
    [list, editing],
  );
  const availableCats = cats.filter((c) => !usedCategoryIds.has(c.id));

  // ── Handlers ──
  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }
  function openEdit(b: BudgetComparisonItem) {
    setEditing(b);
    setForm({ categoryId: b.categoryId, amount: b.budgeted });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.categoryId || !parseFloat(form.amount || "0")) return;
    setSaving(true);
    try {
      if (editing) {
        await budgets.update(editing.id, { amount: form.amount });
      } else {
        await budgets.create({
          categoryId: form.categoryId,
          amount: form.amount,
          month, year,
        });
      }
      // Refetch to recompute actual/pct
      const refreshed = await budgets.comparison({ month, year });
      setList(refreshed);
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    try {
      await budgets.remove(id);
      setList((prev) => prev.filter((b) => b.id !== id));
      setDetailTarget(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Presupuestos</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Controla cuánto gastas vs cuánto planeaste por categoría
            </p>
          </div>
          <button
            onClick={openCreate}
            disabled={availableCats.length === 0}
            title={availableCats.length === 0 ? "Todas las categorías tienen presupuesto este mes" : undefined}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            Nuevo presupuesto
          </button>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ── Period selector ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-secondary rounded-xl border border-white/[0.04] p-2 flex items-center justify-between gap-2"
        >
          <button
            onClick={() => shiftPeriod(-1)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <CalendarRange className="h-4 w-4 text-cyan-400" />
            <span className="text-white font-semibold text-sm tabular-nums">
              {MONTHS_ES[month - 1]} {year}
            </span>
            {!isCurrent && (
              <button
                onClick={goToCurrent}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium px-2 py-0.5 rounded-full hover:bg-cyan-500/10 transition-colors"
              >
                Ir al actual
              </button>
            )}
            {isCurrent && stats.count > 0 && (
              <span className="text-[11px] text-gray-500">
                · {daysLeftInMonth(month, year)} días restantes
              </span>
            )}
          </div>

          <button
            onClick={() => shiftPeriod(1)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            delay={0.05}
            icon={<Target className="h-5 w-5 text-white" />}
            gradient="from-cyan-400 to-blue-600"
            label="Presupuestos"
            value={String(stats.count)}
            subtext={stats.count === 1 ? "categoría" : "categorías"}
          />
          <StatCard
            delay={0.10}
            icon={<TrendingDown className="h-5 w-5 text-white" />}
            gradient="from-violet-400 to-purple-600"
            label="Planeado"
            value={formatCOPShort(stats.totalBudgeted)}
            subtext="suma del mes"
          />
          <StatCard
            delay={0.15}
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            gradient={stats.avgPct >= 100 ? "from-rose-400 to-red-600"
                     : stats.avgPct >= 75  ? "from-amber-400 to-orange-600"
                     : "from-emerald-400 to-teal-600"}
            label="Gastado"
            value={formatCOPShort(stats.totalActual)}
            subtext={`${stats.avgPct.toFixed(0)}% del total`}
          />
          <StatCard
            delay={0.20}
            icon={<AlertTriangle className="h-5 w-5 text-white" />}
            gradient={stats.exceeded > 0 ? "from-rose-400 to-red-600" : "from-emerald-400 to-teal-600"}
            label="Excedidos"
            value={String(stats.exceeded)}
            subtext={stats.exceeded === 1 ? "categoría sobre 100%" : "categorías sobre 100%"}
          />
        </div>

        {/* ── Filter toolbar ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary rounded-xl border border-white/[0.04] p-2.5 flex items-center gap-3 flex-wrap"
        >
          {/* Search */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categoría…"
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

          {/* Status pills */}
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

          {/* Sort dropdown */}
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </motion.div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Target className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              {list.length === 0
                ? `Sin presupuestos para ${MONTHS_ES[month - 1]} ${year}`
                : "No hay presupuestos con esos filtros"}
            </p>
            <p className="text-xs text-gray-600 mt-1 max-w-[320px] mx-auto">
              {list.length === 0
                ? "Crea presupuestos por categoría para controlar tus gastos este mes"
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
              {filtered.map((b, i) => (
                <BudgetCard
                  key={b.id}
                  budget={b}
                  delay={i * 0.04}
                  onOpen={() => setDetailTarget(b)}
                  onEdit={() => openEdit(b)}
                  onDelete={() => handleDelete(b.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Modal ── */}
      <CreateEditModal
        open={showModal}
        editing={editing}
        form={form}
        saving={saving}
        month={month}
        year={year}
        availableCats={editing
          ? cats.filter((c) => c.id === editing.categoryId || !usedCategoryIds.has(c.id))
          : availableCats}
        onClose={() => setShowModal(false)}
        onChange={setForm}
        onSave={handleSave}
      />

      {/* ── Details drawer ── */}
      <BudgetDetailsDrawer
        budget={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={() => { if (detailTarget) { openEdit(detailTarget); setDetailTarget(null); } }}
        onDelete={() => { if (detailTarget) handleDelete(detailTarget.id); }}
      />
    </DashboardLayout>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  delay, icon, gradient, label, value, subtext,
}: {
  delay: number; icon: React.ReactNode; gradient: string;
  label: string; value: string; subtext?: string;
}) {
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
          {subtext && <div className="text-[11px] text-gray-500 mt-1">{subtext}</div>}
        </div>
        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function SortDropdown({
  value, onChange,
}: { value: SortBy; onChange: (v: SortBy) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-black/20 text-white px-3 py-2 rounded-lg border border-white/[0.04] hover:border-white/[0.08] transition-colors text-xs font-medium"
      >
        <span className="text-gray-500">Ordenar:</span>
        <span>{current.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 min-w-[180px] bg-[#1a1a1f] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden z-20"
          >
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  o.value === value
                    ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                    : "text-gray-300 hover:bg-white/[0.04]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BudgetCard({
  budget, delay, onOpen, onEdit, onDelete,
}: {
  budget: BudgetComparisonItem;
  delay: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = parseFloat(budget.percentage);
  const status = getStatus(pct);
  const style = statusStyle(status);
  const color = categoryColor(budget.categoryName);
  const remaining = parseFloat(budget.budgeted) - parseFloat(budget.actual);
  const displayPct = Math.min(pct, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onOpen}
      className="bg-secondary rounded-2xl p-5 border border-white/[0.04] group cursor-pointer hover:border-white/[0.1] transition-colors relative overflow-hidden"
    >
      {/* Accent gradient bg based on status */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }}
      />

      <div className="relative">
        {/* Top row: icon + menu actions */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold select-none flex-shrink-0"
            style={{
              background: `${color}22`,
              border: `1px solid ${color}44`,
              color,
            }}
          >
            {budget.categoryName[0]?.toUpperCase() ?? "?"}
          </div>
          <div
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Name + status badge */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <h3 className="text-white font-bold text-base truncate flex-1 min-w-0">{budget.categoryName}</h3>
          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${style.badge}`}>
            <style.Icon className="h-3 w-3" />
            {style.label}
          </span>
        </div>

        {/* Amounts */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Gastado</div>
            <div className="text-xl font-bold text-white tabular-nums">{formatCOPShort(budget.actual)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">de {formatCOPShort(budget.budgeted)}</div>
            <div className={`text-lg font-bold tabular-nums ${style.text}`}>{pct.toFixed(0)}%</div>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-700/40 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-2 rounded-full ${style.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${displayPct}%` }}
            transition={{ duration: 0.9, delay: delay + 0.2 }}
          />
        </div>

        {/* Footer: remaining + CTA */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
          <span className="text-xs text-gray-500">
            {remaining >= 0
              ? <><span className={style.text}>{formatCOPShort(remaining)}</span> disponible</>
              : <><span className="text-rose-400">{formatCOPShort(Math.abs(remaining))}</span> sobregasto</>
            }
          </span>
          <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver detalle <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Create/Edit Modal ───────────────────────────────────────────────────────

function CreateEditModal({
  open, editing, form, saving, month, year, availableCats,
  onClose, onChange, onSave,
}: {
  open: boolean;
  editing: BudgetComparisonItem | null;
  form: FormState;
  saving: boolean;
  month: number;
  year: number;
  availableCats: CategoryDTO[];
  onClose: () => void;
  onChange: (f: FormState) => void;
  onSave: () => void;
}) {
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
            className="bg-[#141418] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editing ? "Editar presupuesto" : "Nuevo presupuesto"}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Período: <span className="text-cyan-400 font-semibold">{MONTHS_ES[month - 1]} {year}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Categoría *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => onChange({ ...form, categoryId: e.target.value })}
                  disabled={!!editing}
                  className="w-full bg-secondary text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm disabled:opacity-60 appearance-none cursor-pointer"
                >
                  <option value="">Selecciona una categoría</option>
                  {availableCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {editing && (
                  <p className="text-[11px] text-gray-600 mt-1">
                    La categoría no se puede cambiar después de crear el presupuesto
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Monto *</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.amount}
                  onChange={(e) => onChange({ ...form, amount: e.target.value })}
                  placeholder="Ej. 500000"
                  className="w-full bg-secondary text-white placeholder-gray-500 px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm tabular-nums"
                />
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
                disabled={saving || !form.categoryId || !parseFloat(form.amount || "0")}
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

// ─── Details drawer ──────────────────────────────────────────────────────────

function BudgetDetailsDrawer({
  budget, onClose, onEdit, onDelete,
}: {
  budget: BudgetComparisonItem | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [txns, setTxns] = useState<TransactionDTO[]>([]);
  const [txnLoading, setTxnLoading] = useState(false);

  useEffect(() => {
    if (!budget) return;
    setTxnLoading(true);
    // Fetch last 200 expense transactions and filter by category + period client-side
    txnApi.list({ size: 200, page: 0, type: "EXPENSE" })
      .then((r) => {
        const start = new Date(budget.year, budget.month - 1, 1);
        const end   = new Date(budget.year, budget.month, 1);
        const filtered = r.content.filter((t) => {
          if (t.categoryId !== budget.categoryId) return false;
          const d = new Date(t.date);
          return d >= start && d < end;
        });
        setTxns(filtered);
      })
      .catch(() => {})
      .finally(() => setTxnLoading(false));
  }, [budget?.id]);

  if (!budget) {
    return <AnimatePresence>{null}</AnimatePresence>;
  }

  const pct = parseFloat(budget.percentage);
  const status = getStatus(pct);
  const style = statusStyle(status);
  const color = categoryColor(budget.categoryName);
  const remaining = parseFloat(budget.budgeted) - parseFloat(budget.actual);

  return (
    <AnimatePresence>
      {budget && (
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
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-[#0f0f12]/95 backdrop-blur-sm border-b border-white/[0.04] px-5 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Detalle del presupuesto</h2>
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
                className="relative rounded-2xl p-6 overflow-hidden"
                style={{
                  background: `radial-gradient(circle at top left, ${color}30, transparent 60%), radial-gradient(circle at bottom right, ${color}20, transparent 50%), #151519`,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                    style={{ background: `${color}25`, border: `1px solid ${color}55`, color }}
                  >
                    {budget.categoryName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${style.badge}`}>
                    <style.Icon className="h-3 w-3" />
                    {style.label}
                  </span>
                </div>
                <h3 className="text-white text-xl font-bold">{budget.categoryName}</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  {MONTHS_ES[budget.month - 1]} {budget.year}
                </p>

                {/* Big progress */}
                <div className="mt-5">
                  <div className="flex items-end justify-between mb-1.5">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Gastado</div>
                      <div className="text-2xl font-bold text-white tabular-nums">{formatCOP(budget.actual)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Presupuesto</div>
                      <div className="text-sm font-semibold text-gray-400 tabular-nums">{formatCOP(budget.budgeted)}</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700/40 rounded-full h-2.5 overflow-hidden mt-2">
                    <motion.div
                      className={`h-2.5 rounded-full ${style.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[11px]">
                    <span className={`font-bold ${style.text}`}>{pct.toFixed(1)}%</span>
                    <span className={remaining >= 0 ? "text-gray-500" : "text-rose-400"}>
                      {remaining >= 0
                        ? `${formatCOP(remaining)} disponible`
                        : `${formatCOP(Math.abs(remaining))} sobregasto`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onEdit}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/20 transition-colors"
                >
                  <Edit3 className="h-4 w-4" /> Editar monto
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/15 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Eliminar
                </button>
              </div>

              {/* Transactions */}
              <div className="bg-secondary rounded-xl border border-white/[0.04] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Transacciones del período</h4>
                  <span className="text-[11px] text-gray-500 bg-white/[0.05] px-2 py-0.5 rounded-full">
                    {txns.length}
                  </span>
                </div>
                {txnLoading ? (
                  <div className="p-6 flex justify-center">
                    <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                  </div>
                ) : txns.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-gray-500">
                    Sin gastos registrados en esta categoría para el período
                  </p>
                ) : (
                  <div className="divide-y divide-white/[0.04] max-h-[320px] overflow-y-auto">
                    {txns.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/15 text-rose-400 flex-shrink-0">
                          <TrendingDown className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {tx.description || tx.categoryName}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {new Date(tx.date).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                            {tx.accountName && ` · ${tx.accountName}`}
                          </p>
                        </div>
                        <span className="text-xs font-bold tabular-nums text-rose-400">
                          −{formatCOPShort(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
