import { motion, AnimatePresence } from "framer-motion";
import {
  X, Edit3, Trash2, CheckCircle2, XCircle, Plus, RotateCcw,
  Calendar, Target, TrendingUp, Loader2,
} from "lucide-react";
import { useState } from "react";
import type { WishlistDTO } from "~/services/api";
import { formatCOP, formatCOPShort } from "~/services/api";

function wishColor(name: string): string {
  const COLORS = ["#22d3ee","#a78bfa","#fb7185","#fbbf24","#34d399","#60a5fa","#f97316","#e879f9"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  wish: WishlistDTO | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSavings: (newCurrent: string) => Promise<void> | void;
  onMarkComplete: () => Promise<void> | void;
  onMarkCancelled: () => Promise<void> | void;
  onReactivate:    () => Promise<void> | void;
}

export function WishlistDrawer({
  wish, onClose, onEdit, onDelete,
  onAddSavings, onMarkComplete, onMarkCancelled, onReactivate,
}: Props) {
  const [addAmount, setAddAmount] = useState("");
  const [busy, setBusy] = useState<"add" | "complete" | "cancel" | "reactivate" | null>(null);

  async function handleAdd() {
    if (!wish) return;
    const value = parseFloat(addAmount || "0");
    if (value <= 0) return;
    setBusy("add");
    try {
      const next = (parseFloat(wish.currentAmount) + value).toString();
      await onAddSavings(next);
      setAddAmount("");
    } finally { setBusy(null); }
  }

  async function handleAction(action: "complete" | "cancel" | "reactivate") {
    setBusy(action);
    try {
      if (action === "complete")   await onMarkComplete();
      if (action === "cancel")     await onMarkCancelled();
      if (action === "reactivate") await onReactivate();
    } finally { setBusy(null); }
  }

  return (
    <AnimatePresence>
      {wish && (
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
              <h2 className="text-white font-semibold">Detalle del deseo</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <DrawerBody
              wish={wish}
              addAmount={addAmount}
              setAddAmount={setAddAmount}
              busy={busy}
              onAdd={handleAdd}
              onAction={handleAction}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Separated body for readability
function DrawerBody({
  wish, addAmount, setAddAmount, busy, onAdd, onAction, onEdit, onDelete,
}: {
  wish: WishlistDTO;
  addAmount: string;
  setAddAmount: (v: string) => void;
  busy: "add" | "complete" | "cancel" | "reactivate" | null;
  onAdd: () => Promise<void> | void;
  onAction: (a: "complete" | "cancel" | "reactivate") => Promise<void> | void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = wishColor(wish.name);
  const pct = Math.min(parseFloat(wish.progressPercentage), 100);
  const remaining = parseFloat(wish.targetAmount) - parseFloat(wish.currentAmount);
  const isActive = wish.status === "ACTIVE";

  return (
    <div className="p-5 space-y-5">
      {/* Hero */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background: `radial-gradient(circle at top left, ${color}30, transparent 60%),
                       radial-gradient(circle at bottom right, ${color}20, transparent 50%),
                       #151519`,
        }}
      >
        {/* Header: icon + name — items-center to balance when there's no description */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: `${color}25`, border: `1px solid ${color}55`, color }}
          >
            {wish.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-2xl font-bold truncate leading-tight">{wish.name}</h3>
            <p className="text-sm text-gray-400 truncate mt-0.5">
              {wish.description || <span className="italic text-gray-600">Sin descripción</span>}
            </p>
          </div>
        </div>

        {/* Amounts — both same size, balanced */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Ahorrado</div>
            <div className="text-2xl font-bold text-white tabular-nums">{formatCOP(wish.currentAmount)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Meta</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color }}>{formatCOP(wish.targetAmount)}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700/40 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="h-2.5 rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-xs">
          <span className="font-bold tabular-nums" style={{ color }}>{pct.toFixed(1)}%</span>
          <span className="text-gray-500">
            {remaining > 0
              ? <>faltan <span className="text-white font-medium ml-0.5">{formatCOP(remaining)}</span></>
              : <span className="text-emerald-400 font-semibold">¡meta alcanzada!</span>}
          </span>
        </div>
      </div>

      {/* Add savings (only when ACTIVE) */}
      {isActive && (
        <div className="bg-secondary rounded-xl border border-white/[0.04] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-white">Sumar ahorro</h4>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="1000"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Ej. 50000"
              className="flex-1 min-w-0 bg-black/20 text-white placeholder-gray-500 px-3 py-2 rounded-lg border border-white/[0.04] focus:outline-none focus:border-cyan-500/40 text-sm tabular-nums"
            />
            <button
              onClick={onAdd}
              disabled={busy !== null || !parseFloat(addAmount || "0")}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              {busy === "add" ? <Loader2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              Sumar
            </button>
          </div>
        </div>
      )}

      {/* Info rows */}
      <div className="bg-secondary rounded-xl border border-white/[0.04] divide-y divide-white/[0.04]">
        <InfoRow label="Estado" value={
          wish.status === "ACTIVE"    ? "Activo"
          : wish.status === "COMPLETED" ? "Completado"
          :                              "Cancelado"
        } icon={<Target className="h-3.5 w-3.5 text-gray-500" />} />
        <InfoRow
          label="Fecha límite"
          value={wish.deadline ? formatDate(wish.deadline) : "Sin fecha"}
          icon={<Calendar className="h-3.5 w-3.5 text-gray-500" />}
        />
        <InfoRow
          label="Creado"
          value={new Date(wish.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
        />
      </div>

      {/* Status actions */}
      <div className="grid grid-cols-2 gap-2">
        {isActive && (
          <>
            <button
              onClick={() => onAction("complete")}
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
            >
              {busy === "complete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Marcar completado
            </button>
            <button
              onClick={() => onAction("cancel")}
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-700/40 border border-white/[0.06] text-gray-300 text-sm font-semibold hover:bg-gray-700/60 transition-colors disabled:opacity-40"
            >
              {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancelar
            </button>
          </>
        )}
        {!isActive && (
          <button
            onClick={() => onAction("reactivate")}
            disabled={busy !== null}
            className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/20 transition-colors disabled:opacity-40"
          >
            {busy === "reactivate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Reactivar
          </button>
        )}
      </div>

      {/* Edit / Delete */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-300 text-sm font-semibold hover:bg-white/[0.08] transition-colors"
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
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}
