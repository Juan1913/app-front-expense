import { DashboardLayout } from "~/components/templates";
import {
  DeleteConfirmModal, TransactionRow, TransactionDrawer, TransactionModal,
} from "~/components/molecules";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Loader2, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Search, ChevronDown, Filter,
  CreditCard, Tag, Calendar, Wallet, Scale,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  transactions, accounts, categories, formatCOP, formatCOPShort,
  type TransactionDTO, type AccountDTO, type CategoryDTO,
  type CreateTransactionDTO, type TransactionSortBy, type SortDir,
  type TransactionFilters, type TransactionSummary,
} from "~/services/api";

// ─── Types and constants ─────────────────────────────────────────────────────

type TypeFilter = "ALL" | "INCOME" | "EXPENSE";
type DatePreset = "ALL" | "TODAY" | "7D" | "30D" | "MONTH" | "3M" | "YEAR" | "CUSTOM";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "ALL",    label: "Todo" },
  { value: "TODAY",  label: "Hoy" },
  { value: "7D",     label: "7 días" },
  { value: "30D",    label: "30 días" },
  { value: "MONTH",  label: "Este mes" },
  { value: "3M",     label: "3 meses" },
  { value: "YEAR",   label: "Este año" },
  { value: "CUSTOM", label: "Personalizado" },
];

const SORT_OPTIONS: { value: TransactionSortBy; label: string }[] = [
  { value: "date",      label: "Fecha" },
  { value: "amount",    label: "Monto" },
  { value: "createdAt", label: "Creación" },
];

const PAGE_SIZES = [20, 50, 100];

const emptyForm: CreateTransactionDTO = {
  amount: "",
  date: new Date().toISOString().slice(0, 16),
  description: "",
  type: "EXPENSE",
  accountId: "",
  categoryId: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateRangeForPreset(p: DatePreset): { from?: Date; to?: Date } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfDay); endOfToday.setDate(startOfDay.getDate() + 1);
  switch (p) {
    case "TODAY":  return { from: startOfDay, to: endOfToday };
    case "7D":     return { from: new Date(startOfDay.getTime() - 7 * 86400000), to: endOfToday };
    case "30D":    return { from: new Date(startOfDay.getTime() - 30 * 86400000), to: endOfToday };
    case "MONTH":  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    case "3M":     return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    case "YEAR":   return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1) };
    default:       return {};
  }
}

function toISOLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function dateGroupLabel(date: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7)   return `Hace ${diff} días`;
  return d.toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Transacciones() {
  const [list, setList] = useState<TransactionDTO[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountList, setAccountList] = useState<AccountDTO[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryDTO[]>([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");
  const [accountFilter, setAccountFilter]   = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [minDebounced, setMinDebounced] = useState("");
  const [maxDebounced, setMaxDebounced] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [sortBy, setSortBy] = useState<TransactionSortBy>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TransactionDTO | null>(null);
  const [form, setForm] = useState<CreateTransactionDTO>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detailTarget, setDetailTarget] = useState<TransactionDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionDTO | null>(null);

  // Debounce
  useEffect(() => { const t = setTimeout(() => setSearchDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const t = setTimeout(() => setMinDebounced(minAmount), 400); return () => clearTimeout(t); }, [minAmount]);
  useEffect(() => { const t = setTimeout(() => setMaxDebounced(maxAmount), 400); return () => clearTimeout(t); }, [maxAmount]);

  // Reset to page 0 on any filter change
  useEffect(() => { setPage(0); }, [
    typeFilter, datePreset, customFrom, customTo, accountFilter, categoryFilter,
    minDebounced, maxDebounced, searchDebounced, sortBy, sortDir, pageSize,
  ]);

  const filters: TransactionFilters = useMemo(() => {
    const r: TransactionFilters = {};
    if (typeFilter !== "ALL") r.type = typeFilter;
    if (accountFilter !== "ALL") r.accountId = accountFilter;
    if (categoryFilter !== "ALL") r.categoryId = categoryFilter;
    if (searchDebounced.trim()) r.search = searchDebounced.trim();
    if (minDebounced) r.minAmount = minDebounced;
    if (maxDebounced) r.maxAmount = maxDebounced;
    if (datePreset === "CUSTOM") {
      if (customFrom) r.fromDate = `${customFrom}T00:00:00`;
      if (customTo)   r.toDate   = `${customTo}T23:59:59`;
    } else {
      const { from, to } = dateRangeForPreset(datePreset);
      if (from) r.fromDate = toISOLocal(from);
      if (to)   r.toDate   = toISOLocal(to);
    }
    return r;
  }, [typeFilter, datePreset, customFrom, customTo, accountFilter, categoryFilter, searchDebounced, minDebounced, maxDebounced]);

  // Fetch list + summary
  useEffect(() => {
    setLoading(true);
    Promise.all([
      transactions.list({ ...filters, sortBy, sortDir, page, size: pageSize }),
      transactions.summary(filters),
    ])
      .then(([r, s]) => {
        setList(r.content);
        setTotalPages(r.totalPages);
        setTotalElements(r.totalElements);
        setSummary(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters, sortBy, sortDir, page, pageSize]);

  useEffect(() => {
    Promise.all([accounts.list(), categories.list()])
      .then(([a, c]) => { setAccountList(a); setCategoryList(c); })
      .catch(() => {});
  }, []);

  // Group by day
  const groups = useMemo(() => {
    const map = new Map<string, TransactionDTO[]>();
    for (const tx of list) {
      const k = tx.date.slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(tx);
    }
    return Array.from(map.entries()).map(([k, txs]) => ({
      key: k,
      label: dateGroupLabel(new Date(k + "T00:00:00")),
      items: txs,
    }));
  }, [list]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (typeFilter !== "ALL") chips.push({ key: "type", label: typeFilter === "INCOME" ? "Ingresos" : "Gastos", onRemove: () => setTypeFilter("ALL") });
    if (datePreset !== "ALL") chips.push({ key: "date", label: DATE_PRESETS.find(p => p.value === datePreset)?.label ?? "", onRemove: () => setDatePreset("ALL") });
    if (accountFilter !== "ALL") {
      const a = accountList.find(x => x.id === accountFilter);
      if (a) chips.push({ key: "account", label: a.name, onRemove: () => setAccountFilter("ALL") });
    }
    if (categoryFilter !== "ALL") {
      const c = categoryList.find(x => x.id === categoryFilter);
      if (c) chips.push({ key: "category", label: c.name, onRemove: () => setCategoryFilter("ALL") });
    }
    if (minDebounced) chips.push({ key: "min", label: `≥ ${formatCOPShort(minDebounced)}`, onRemove: () => setMinAmount("") });
    if (maxDebounced) chips.push({ key: "max", label: `≤ ${formatCOPShort(maxDebounced)}`, onRemove: () => setMaxAmount("") });
    if (searchDebounced.trim()) chips.push({ key: "search", label: `"${searchDebounced.trim()}"`, onRemove: () => setSearch("") });
    return chips;
  }, [typeFilter, datePreset, accountFilter, categoryFilter, minDebounced, maxDebounced, searchDebounced, accountList, categoryList]);

  function clearAll() {
    setTypeFilter("ALL"); setDatePreset("ALL");
    setCustomFrom(""); setCustomTo("");
    setAccountFilter("ALL"); setCategoryFilter("ALL");
    setMinAmount(""); setMaxAmount(""); setSearch("");
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 16) });
    setShowModal(true);
  }
  function openEdit(tx: TransactionDTO) {
    setEditing(tx);
    setForm({
      amount: tx.amount, date: tx.date.slice(0, 16),
      description: tx.description ?? "",
      type: tx.type, accountId: tx.accountId, categoryId: tx.categoryId,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.amount || !form.accountId || !form.categoryId) return;
    setSaving(true);
    try {
      if (editing) await transactions.update(editing.id, form);
      else         await transactions.create(form);
      const [r, s] = await Promise.all([
        transactions.list({ ...filters, sortBy, sortDir, page, size: pageSize }),
        transactions.summary(filters),
      ]);
      setList(r.content); setTotalPages(r.totalPages); setTotalElements(r.totalElements); setSummary(s);
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await transactions.remove(deleteTarget.id);
      setList((prev) => prev.filter(t => t.id !== deleteTarget.id));
      setTotalElements(n => Math.max(0, n - 1));
      setDeleteTarget(null); setDetailTarget(null);
      transactions.summary(filters).then(setSummary).catch(() => {});
    } catch (e: any) { setError(e.message); }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Transacciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalElements} {totalElements === 1 ? "registro" : "registros"}
              {activeChips.length > 0 && ` con filtros aplicados`}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" /> Nueva transacción
          </button>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard delay={0.05} icon={<Scale className="h-5 w-5 text-white" />} gradient="from-cyan-400 to-blue-600" label="Movimientos" value={String(summary?.totalCount ?? 0)} subtext={`${summary?.incomeCount ?? 0} in · ${summary?.expenseCount ?? 0} out`} />
          <StatCard delay={0.10} icon={<TrendingUp className="h-5 w-5 text-white" />} gradient="from-emerald-400 to-teal-600" label="Ingresos" value={formatCOPShort(summary?.totalIncome ?? "0")} subtext={`${summary?.incomeCount ?? 0} transacciones`} />
          <StatCard delay={0.15} icon={<TrendingDown className="h-5 w-5 text-white" />} gradient="from-rose-400 to-red-600" label="Gastos" value={formatCOPShort(summary?.totalExpense ?? "0")} subtext={`${summary?.expenseCount ?? 0} transacciones`} />
          <StatCard delay={0.20} icon={<Wallet className="h-5 w-5 text-white" />} gradient={parseFloat(summary?.netBalance ?? "0") >= 0 ? "from-violet-400 to-purple-600" : "from-rose-400 to-red-600"} label="Balance" value={formatCOPShort(summary?.netBalance ?? "0")} subtext="ingresos − gastos" />
        </div>

        {/* Filter toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-secondary rounded-xl border border-white/[0.04] p-2.5 flex items-center gap-3 flex-wrap"
        >
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Descripción, categoría, cuenta…"
              className="w-full bg-black/20 text-white placeholder-gray-500 pl-9 pr-8 py-2 rounded-lg border border-white/[0.04] focus:outline-none focus:border-cyan-500/40 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/[0.06]">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Type pills */}
          <div className="flex items-center gap-0.5 bg-black/20 rounded-lg p-0.5 border border-white/[0.04]">
            {(["ALL", "INCOME", "EXPENSE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  typeFilter === t
                    ? t === "INCOME" ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                    : t === "EXPENSE" ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40"
                    : "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "INCOME" && <TrendingUp className="h-3 w-3" />}
                {t === "EXPENSE" && <TrendingDown className="h-3 w-3" />}
                {t === "ALL" ? "Todas" : t === "INCOME" ? "Ingresos" : "Gastos"}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <Dropdown
            icon={<Calendar className="h-3.5 w-3.5 text-gray-500" />}
            options={DATE_PRESETS}
            value={datePreset}
            onChange={(v) => setDatePreset(v as DatePreset)}
          />

          <Dropdown
            label="Ordenar:"
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(v) => setSortBy(v as TransactionSortBy)}
          />
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            title={sortDir === "asc" ? "Ascendente" : "Descendente"}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/20 border border-white/[0.04] text-gray-400 hover:text-white hover:border-white/[0.08] transition-colors text-sm font-bold"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              showAdvanced ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30" : "bg-black/20 text-gray-400 hover:text-white border border-white/[0.04]"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Más filtros
            <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
        </motion.div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="bg-secondary rounded-xl border border-white/[0.04] p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <AdvField label="Cuenta" icon={<CreditCard className="h-3 w-3" />}>
                  <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="select-dark">
                    <option value="ALL">Todas</option>
                    {accountList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </AdvField>
                <AdvField label="Categoría" icon={<Tag className="h-3 w-3" />}>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select-dark">
                    <option value="ALL">Todas</option>
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} · {c.type === "EXPENSE" ? "gasto" : "ingreso"}</option>
                    ))}
                  </select>
                </AdvField>
                <AdvField label="Monto mínimo">
                  <input type="number" min="0" step="1000" value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)} placeholder="0"
                    className="select-dark tabular-nums" />
                </AdvField>
                <AdvField label="Monto máximo">
                  <input type="number" min="0" step="1000" value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)} placeholder="Sin límite"
                    className="select-dark tabular-nums" />
                </AdvField>
                {datePreset === "CUSTOM" && (
                  <>
                    <AdvField label="Desde" icon={<Calendar className="h-3 w-3" />}>
                      <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="select-dark" />
                    </AdvField>
                    <AdvField label="Hasta" icon={<Calendar className="h-3 w-3" />}>
                      <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="select-dark" />
                    </AdvField>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active chips */}
        {activeChips.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Filtros activos:</span>
            {activeChips.map((c) => (
              <motion.span
                key={c.key}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                {c.label}
                <button onClick={c.onRemove} className="w-4 h-4 flex items-center justify-center rounded hover:bg-cyan-500/20">
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
            <button onClick={clearAll} className="text-xs text-gray-500 hover:text-white underline underline-offset-2 ml-1">
              Limpiar todos
            </button>
          </motion.div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              {activeChips.length > 0 ? "No hay transacciones con esos filtros" : "Aún no hay transacciones"}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {activeChips.length > 0 ? "Prueba ajustar los filtros" : "Crea tu primera transacción"}
            </p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {groups.map((g) => {
              const groupTotal = g.items.reduce((s, t) => s + (t.type === "INCOME" ? 1 : -1) * parseFloat(t.amount), 0);
              return (
                <div key={g.key}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">{g.label}</h3>
                    <span className={`text-xs font-semibold tabular-nums ${groupTotal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {groupTotal >= 0 ? "+" : "−"}{formatCOPShort(Math.abs(groupTotal))}
                    </span>
                  </div>
                  <div className="bg-secondary rounded-2xl border border-white/[0.04] overflow-hidden divide-y divide-white/[0.04]">
                    {g.items.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        tx={tx}
                        onOpen={() => setDetailTarget(tx)}
                        onEdit={() => openEdit(tx)}
                        onDelete={() => setDeleteTarget(tx)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <span className="text-xs text-gray-500">
              Mostrando <span className="text-white font-semibold">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)}</span> de {totalElements}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(0)} disabled={page === 0}
                className="px-2 py-1.5 rounded-lg bg-secondary border border-white/[0.04] text-gray-400 hover:text-white disabled:opacity-40 text-xs font-medium transition-colors">
                Primera
              </button>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 rounded-lg bg-secondary border border-white/[0.04] text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-400 tabular-nums px-2">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 rounded-lg bg-secondary border border-white/[0.04] text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
                className="px-2 py-1.5 rounded-lg bg-secondary border border-white/[0.04] text-gray-400 hover:text-white disabled:opacity-40 text-xs font-medium transition-colors">
                Última
              </button>
            </div>
            <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="bg-secondary text-white px-2.5 py-1.5 rounded-lg border border-white/[0.04] text-xs cursor-pointer focus:outline-none focus:border-cyan-500/40 appearance-none">
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / página</option>)}
            </select>
          </div>
        )}
      </div>

      <TransactionModal
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

      <TransactionDrawer
        tx={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={() => { if (detailTarget) { openEdit(detailTarget); setDetailTarget(null); } }}
        onDelete={() => { if (detailTarget) { setDeleteTarget(detailTarget); setDetailTarget(null); } }}
      />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        title="Eliminar transacción"
        description={deleteTarget ? `${deleteTarget.categoryName} · ${formatCOP(deleteTarget.amount)}` : ""}
        impact={[]}
        onClose={() => setDeleteTarget(null)}
        onTrash={handleDelete}
        onPermanent={handleDelete}
      />

      <style>{`
        .select-dark {
          width: 100%;
          background: #151519;
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 0.8rem;
        }
        .select-dark:focus { outline: none; border-color: rgba(6, 182, 212, 0.4); }
        .select-dark::placeholder { color: #6b7280; }
      `}</style>
    </DashboardLayout>
  );
}

// ─── Local small helpers (used only by this page) ────────────────────────────

function StatCard({ delay, icon, gradient, label, value, subtext }: {
  delay: number; icon: React.ReactNode; gradient: string; label: string; value: string; subtext?: string;
}) {
  return (
    <motion.div
      className="bg-secondary rounded-xl p-4 border border-white/[0.04] relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}
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

function AdvField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function Dropdown<T extends string>({
  label, icon, options, value, onChange,
}: {
  label?: string;
  icon?: React.ReactNode;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-black/20 text-white px-3 py-2 rounded-lg border border-white/[0.04] hover:border-white/[0.08] transition-colors text-xs font-medium"
      >
        {icon}
        {label && <span className="text-gray-500">{label}</span>}
        <span>{current.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 min-w-[150px] bg-[#1a1a1f] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden z-20"
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  o.value === value ? "bg-cyan-500/15 text-cyan-300 font-semibold" : "text-gray-300 hover:bg-white/[0.04]"
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
