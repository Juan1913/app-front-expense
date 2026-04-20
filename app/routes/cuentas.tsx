import { DashboardLayout } from "~/components/templates";
import { DeleteConfirmModal } from "~/components/molecules";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit3, Trash2, X, Loader2, CreditCard, Search, Wallet,
  Building2, TrendingUp, Layers, ChevronDown, Calendar, TrendingDown,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import {
  accounts, transactions as txnApi, formatCOP, formatCOPShort,
  type AccountDTO, type AccountImpact, type AccountSortBy, type SortDir,
  type TransactionDTO,
} from "~/services/api";

const CARD_GRADIENTS = [
  "from-orange-500 via-orange-600 to-red-700",
  "from-blue-500 via-blue-600 to-indigo-700",
  "from-purple-500 via-violet-600 to-fuchsia-700",
  "from-emerald-500 via-green-600 to-teal-700",
  "from-rose-500 via-pink-600 to-red-700",
  "from-cyan-500 via-sky-600 to-blue-700",
  "from-amber-500 via-orange-600 to-yellow-700",
];

const SORT_OPTIONS: { value: AccountSortBy; label: string }[] = [
  { value: "createdAt", label: "Más recientes" },
  { value: "balance",   label: "Balance" },
  { value: "name",      label: "Nombre" },
  { value: "bank",      label: "Banco" },
];

interface FormState {
  name: string;
  bank: string;
  cardNumber: string;
  description: string;
  balance: string;
  currency: string;
}

const emptyForm: FormState = {
  name: "", bank: "", cardNumber: "", description: "", balance: "0", currency: "COP",
};

function formatTxDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function formatCreatedAt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return CARD_GRADIENTS[Math.abs(h) % CARD_GRADIENTS.length];
}

export default function Cuentas() {
  const [list, setList] = useState<AccountDTO[]>([]);
  const [allAccounts, setAllAccounts] = useState<AccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [currency, setCurrency] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<AccountSortBy>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AccountDTO | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AccountDTO | null>(null);
  const [impact, setImpact] = useState<AccountImpact | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);

  // Details drawer
  const [detailTarget, setDetailTarget] = useState<AccountDTO | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    accounts.list({
      search:   searchDebounced || undefined,
      currency: currency === "ALL" ? undefined : currency,
      sortBy,
      sortDir,
    })
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [searchDebounced, currency, sortBy, sortDir]);

  useEffect(() => {
    accounts.list().then(setAllAccounts).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const banks = new Set(allAccounts.map((a) => a.bank).filter(Boolean));
    const currencies = new Set(allAccounts.map((a) => a.currency));
    const currencyBreakdown = new Map<string, number>();
    for (const a of allAccounts) {
      currencyBreakdown.set(a.currency, (currencyBreakdown.get(a.currency) ?? 0) + parseFloat(a.balance || "0"));
    }
    const primary = [...currencyBreakdown.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      totalAccounts: allAccounts.length,
      totalBanks: banks.size,
      totalCurrencies: currencies.size,
      primaryCurrency: primary?.[0] ?? "COP",
      totalInPrimaryCurrency: primary?.[1] ?? 0,
    };
  }, [allAccounts]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(acc: AccountDTO) {
    setEditing(acc);
    setForm({
      name: acc.name,
      bank: acc.bank ?? "",
      cardNumber: acc.cardNumber ?? "",
      description: acc.description ?? "",
      balance: acc.balance,
      currency: acc.currency,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.bank.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        cardNumber: form.cardNumber.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      if (editing) {
        const updated = await accounts.update(editing.id, payload);
        setList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setAllAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await accounts.create(payload);
        setList((prev) => [created, ...prev]);
        setAllAccounts((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm(acc: AccountDTO) {
    setDeleteTarget(acc);
    setImpact(null);
    setImpactLoading(true);
    accounts.impact(acc.id)
      .then(setImpact)
      .catch((e) => setError(e.message))
      .finally(() => setImpactLoading(false));
  }

  async function handleSoftDelete() {
    if (!deleteTarget) return;
    try {
      await accounts.remove(deleteTarget.id);
      setList((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setAllAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDetailTarget(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleHardDelete() {
    if (!deleteTarget) return;
    try {
      await accounts.removePermanent(deleteTarget.id);
      setList((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setAllAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDetailTarget(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const availableCurrencies = useMemo(() => {
    const set = new Set(allAccounts.map((a) => a.currency));
    return ["ALL", ...Array.from(set)];
  }, [allAccounts]);

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
            <h1 className="text-2xl font-bold text-white tracking-tight">Cuentas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestiona tus cuentas bancarias y tarjetas
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            Nueva cuenta
          </button>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard delay={0.05} icon={<Wallet className="h-5 w-5 text-white" />}     gradient="from-cyan-400 to-blue-600"    label="Total cuentas"          value={String(stats.totalAccounts)}                         subtext={stats.totalAccounts === 1 ? "cuenta activa" : "cuentas activas"} />
          <StatCard delay={0.10} icon={<TrendingUp className="h-5 w-5 text-white" />} gradient="from-emerald-400 to-teal-600" label={`Balance ${stats.primaryCurrency}`} value={formatCOPShort(stats.totalInPrimaryCurrency)}         subtext="suma en moneda principal" />
          <StatCard delay={0.15} icon={<Building2 className="h-5 w-5 text-white" />}  gradient="from-violet-400 to-purple-600" label="Bancos"                 value={String(stats.totalBanks)}                            subtext={stats.totalBanks === 1 ? "entidad" : "entidades distintas"} />
          <StatCard delay={0.20} icon={<Layers className="h-5 w-5 text-white" />}     gradient="from-amber-400 to-orange-600" label="Monedas"                value={String(stats.totalCurrencies)}                       subtext={stats.totalCurrencies === 1 ? "moneda" : "monedas distintas"} />
        </div>

        {/* ── Filter toolbar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-secondary rounded-xl border border-white/[0.04] p-2.5 flex items-center gap-3 flex-wrap"
        >
          {/* Search */}
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, banco, tarjeta…"
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

          {/* Currency pills */}
          {availableCurrencies.length > 1 && (
            <div className="flex items-center gap-0.5 bg-black/20 rounded-lg p-0.5 border border-white/[0.04]">
              {availableCurrencies.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    currency === c
                      ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {c === "ALL" ? "Todas" : c}
                </button>
              ))}
            </div>
          )}

          {/* Custom sort dropdown */}
          <SortDropdown value={sortBy} onChange={setSortBy} />

          {/* Dir toggle */}
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            title={sortDir === "asc" ? "Ascendente" : "Descendente"}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/20 border border-white/[0.04] text-gray-400 hover:text-white hover:border-white/[0.08] transition-colors text-sm font-bold"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </motion.div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              {searchDebounced || currency !== "ALL"
                ? "No hay cuentas con esos filtros"
                : "Aún no tienes cuentas"}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {searchDebounced || currency !== "ALL" ? "Prueba ajustar la búsqueda" : "Crea tu primera cuenta"}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {list.map((acc, i) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  delay={i * 0.04}
                  gradient={gradientFor(acc.id)}
                  onOpen={() => setDetailTarget(acc)}
                  onEdit={() => openEdit(acc)}
                  onDelete={() => openDeleteConfirm(acc)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Create/Edit Modal ── */}
      <CreateEditModal
        open={showModal}
        editing={editing}
        form={form}
        saving={saving}
        onClose={() => setShowModal(false)}
        onChange={setForm}
        onSave={handleSave}
      />

      {/* ── Delete confirm ── */}
      <DeleteConfirmModal
        open={deleteTarget !== null}
        title={`Eliminar "${deleteTarget?.name ?? ""}"`}
        description={`Banco: ${deleteTarget?.bank ?? "—"}`}
        impact={[{ label: "Transacciones", count: impact?.transactions ?? 0 }]}
        impactLoading={impactLoading}
        onClose={() => setDeleteTarget(null)}
        onTrash={handleSoftDelete}
        onPermanent={handleHardDelete}
      />

      {/* ── Details drawer ── */}
      <AccountDetailsDrawer
        account={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={() => { if (detailTarget) { openEdit(detailTarget); setDetailTarget(null); } }}
        onDelete={() => { if (detailTarget) { openDeleteConfirm(detailTarget); setDetailTarget(null); } }}
      />
    </DashboardLayout>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

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

// ─── Sort dropdown (custom styled) ───────────────────────────────────────────

function SortDropdown({
  value, onChange,
}: { value: AccountSortBy; onChange: (v: AccountSortBy) => void }) {
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
            className="absolute right-0 top-full mt-1.5 min-w-[160px] bg-[#1a1a1f] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden z-20"
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

// ─── Account Card ────────────────────────────────────────────────────────────

function AccountCard({
  account, delay, gradient, onOpen, onEdit, onDelete,
}: {
  account: AccountDTO;
  delay: number;
  gradient: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-secondary rounded-2xl p-4 border border-white/[0.04] group flex flex-col gap-4 hover:border-white/[0.1] transition-colors cursor-pointer"
      onClick={onOpen}
    >
      <CardVisual account={account} gradient={gradient}>
        <div
          className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            title="Editar"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Eliminar"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-rose-500/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardVisual>

      {/* Info row */}
      <div className="px-1 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm truncate">{account.name}</p>
          <p className="text-gray-500 text-xs mt-0.5 truncate">
            {account.description || <span className="italic text-gray-600">Sin descripción</span>}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </motion.div>
  );
}

// ─── Card visual (reusable) ─────────────────────────────────────────────────

function CardVisual({
  account, gradient, size = "default", children,
}: {
  account: AccountDTO;
  gradient: string;
  size?: "default" | "large";
  children?: React.ReactNode;
}) {
  const cardNumber = account.cardNumber?.trim();
  const last4 = cardNumber ? cardNumber.slice(-4).padStart(4, "0") : null;

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br ${gradient} shadow-xl overflow-hidden ${
        size === "large" ? "p-6 aspect-[1.62/1]" : "p-5 aspect-[1.62/1]"
      }`}
    >
      {/* Background effects */}
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-black/20 blur-3xl pointer-events-none" />
      {/* Diagonal shine */}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_45%,rgba(255,255,255,0.08)_50%,transparent_55%)] pointer-events-none" />

      {children}

      <div className="relative z-10 h-full flex flex-col justify-between text-white">
        {/* Top: bank name */}
        <div className="flex items-start justify-between">
          <span className={`font-bold uppercase tracking-[0.25em] opacity-95 ${size === "large" ? "text-xs" : "text-[10px]"}`}>
            {account.bank || "Sin banco"}
          </span>
        </div>

        {/* Middle: chip + card number */}
        <div className="flex items-end gap-4">
          <Chip size={size} />
          <div className="flex-1 min-w-0">
            <div className={`font-mono font-semibold tracking-[0.15em] truncate ${size === "large" ? "text-lg" : "text-base"}`}>
              {last4
                ? <>•••• <span className="opacity-50">••••</span> <span className="opacity-50">••••</span> {last4}</>
                : "•••• •••• •••• ••••"}
            </div>
          </div>
        </div>

        {/* Bottom: balance */}
        <div className="flex items-end justify-between">
          <div>
            <div className={`uppercase tracking-widest opacity-70 ${size === "large" ? "text-[10px]" : "text-[9px]"}`}>Balance</div>
            <div className={`font-bold tabular-nums ${size === "large" ? "text-2xl" : "text-xl"}`}>
              {formatCOP(account.balance)}
            </div>
          </div>
          <span className={`font-semibold opacity-90 ${size === "large" ? "text-sm" : "text-[11px]"}`}>
            {account.currency}
          </span>
        </div>
      </div>
    </div>
  );
}

function Chip({ size }: { size: "default" | "large" }) {
  const dim = size === "large" ? "w-12 h-9" : "w-11 h-8";
  return (
    <div className={`${dim} rounded-md bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-800 shadow-inner relative overflow-hidden flex-shrink-0`}>
      <div className="absolute inset-1 border border-amber-900/40 rounded-[3px]" />
      <div className="absolute inset-x-1 top-1/3 h-px bg-amber-900/30" />
      <div className="absolute inset-x-1 top-2/3 h-px bg-amber-900/30" />
      <div className="absolute inset-y-1 left-1/2 w-px bg-amber-900/30" />
    </div>
  );
}

// ─── Create/Edit Modal ───────────────────────────────────────────────────────

function CreateEditModal({
  open, editing, form, saving, onClose, onChange, onSave,
}: {
  open: boolean;
  editing: AccountDTO | null;
  form: FormState;
  saving: boolean;
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
                {editing ? "Editar cuenta" : "Nueva cuenta"}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Nombre *">
                <input
                  value={form.name}
                  onChange={(e) => onChange({ ...form, name: e.target.value })}
                  placeholder="Ej. Cuenta de ahorros"
                  className="input-dark"
                />
              </Field>
              <Field label="Banco *">
                <input
                  value={form.bank}
                  onChange={(e) => onChange({ ...form, bank: e.target.value })}
                  placeholder="Ej. Bancolombia"
                  className="input-dark"
                />
              </Field>
              <Field label="Número de tarjeta">
                <input
                  value={form.cardNumber}
                  onChange={(e) => onChange({ ...form, cardNumber: e.target.value })}
                  placeholder="Opcional · últimos 4 dígitos"
                  className="input-dark"
                />
              </Field>
              <Field label="Descripción">
                <input
                  value={form.description}
                  onChange={(e) => onChange({ ...form, description: e.target.value })}
                  placeholder="Opcional"
                  className="input-dark"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Balance inicial">
                  <input
                    type="number"
                    value={form.balance}
                    onChange={(e) => onChange({ ...form, balance: e.target.value })}
                    className="input-dark tabular-nums"
                  />
                </Field>
                <Field label="Moneda">
                  <select
                    value={form.currency}
                    onChange={(e) => onChange({ ...form, currency: e.target.value })}
                    className="input-dark appearance-none cursor-pointer"
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </Field>
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
                disabled={saving || !form.name.trim() || !form.bank.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>

            <style>{`
              .input-dark {
                width: 100%;
                background: #151515;
                color: white;
                padding: 0.625rem 0.75rem;
                border-radius: 0.75rem;
                border: 1px solid #374151;
                font-size: 0.875rem;
              }
              .input-dark::placeholder { color: #6b7280; }
              .input-dark:focus { outline: none; border-color: #06b6d4; }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

// ─── Details Drawer ──────────────────────────────────────────────────────────

function AccountDetailsDrawer({
  account, onClose, onEdit, onDelete,
}: {
  account: AccountDTO | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const [txns, setTxns] = useState<TransactionDTO[]>([]);
  const [txnLoading, setTxnLoading] = useState(false);

  useEffect(() => {
    if (!account) return;
    setTxnLoading(true);
    txnApi.list({ accountId: account.id, size: 8, page: 0 })
      .then((r) => setTxns(r.content))
      .catch(() => {})
      .finally(() => setTxnLoading(false));
  }, [account?.id]);

  if (!account) return (
    <AnimatePresence>
      {null}
    </AnimatePresence>
  );

  return (
    <AnimatePresence>
      {account && (
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
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0f0f12]/95 backdrop-blur-sm border-b border-white/[0.04] px-5 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Detalles de cuenta</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Card visual */}
            <div className="p-5">
              <CardVisual account={account} gradient={gradientFor(account.id)} size="large" />
            </div>

            {/* Key info */}
            <div className="px-5 pb-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">{account.name}</h3>
                {account.description && (
                  <p className="text-sm text-gray-400 mt-1">{account.description}</p>
                )}
              </div>

              {/* Info rows */}
              <div className="bg-secondary rounded-xl border border-white/[0.04] divide-y divide-white/[0.04]">
                <InfoRow label="Banco" value={account.bank || "—"} />
                <InfoRow label="Número" value={account.cardNumber || "—"} mono />
                <InfoRow label="Moneda" value={account.currency} />
                <InfoRow
                  label="Creada"
                  value={formatCreatedAt(account.createdAt)}
                  icon={<Calendar className="h-3.5 w-3.5 text-gray-500" />}
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

              {/* Recent transactions */}
              <div className="bg-secondary rounded-xl border border-white/[0.04] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Transacciones recientes</h4>
                  <button
                    onClick={() => { navigate("/transacciones"); onClose(); }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                  >
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                {txnLoading ? (
                  <div className="p-6 flex justify-center">
                    <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                  </div>
                ) : txns.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-gray-500">
                    Sin transacciones en esta cuenta
                  </p>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {txns.map((tx) => {
                      const isIncome = tx.type === "INCOME";
                      return (
                        <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isIncome ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                          }`}>
                            {isIncome ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{tx.categoryName}</p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {tx.description || formatTxDate(tx.date)}
                            </p>
                          </div>
                          <span className={`text-xs font-bold tabular-nums ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
                            {isIncome ? "+" : "−"}{formatCOPShort(tx.amount)}
                          </span>
                        </div>
                      );
                    })}
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

function InfoRow({
  label, value, mono, icon,
}: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-sm text-white ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}
