import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Archive, X, Loader2 } from "lucide-react";
import { useState } from "react";

export interface ImpactItem {
  label: string;
  count: number;
}

interface Props {
  open: boolean;
  title: string;
  description?: string;
  /** Used only to compute whether there's cascade — counts aren't displayed. */
  impact: ImpactItem[];
  impactLoading?: boolean;
  onClose: () => void;
  onTrash: () => Promise<void> | void;
  onPermanent: () => Promise<void> | void;
}

export function DeleteConfirmModal({
  open, title, description, impact, impactLoading,
  onClose, onTrash, onPermanent,
}: Props) {
  const [busy, setBusy] = useState<"trash" | "permanent" | null>(null);

  async function handle(kind: "trash" | "permanent") {
    setBusy(kind);
    try {
      if (kind === "trash") await onTrash();
      else await onPermanent();
    } finally {
      setBusy(null);
    }
  }

  const hasCascade = impact.some((i) => i.count > 0);

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
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141418] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-white/[0.06]"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Body */}
            <div className="px-7 pt-7 pb-6">
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>

              <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
              {description && (
                <p className="text-gray-500 text-sm mt-1">{description}</p>
              )}

              <div className="mt-5 text-sm text-gray-300 leading-relaxed">
                {impactLoading ? (
                  <span className="text-gray-500 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analizando…
                  </span>
                ) : hasCascade ? (
                  <>
                    Todos los datos relacionados con este elemento también serán eliminados.
                  </>
                ) : (
                  <>Este elemento no tiene datos relacionados.</>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 space-y-2">
              <button
                onClick={() => handle("trash")}
                disabled={busy !== null || impactLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {busy === "trash"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Archive className="h-4 w-4" />}
                Enviar a papelera
              </button>

              <button
                onClick={() => handle("permanent")}
                disabled={busy !== null || impactLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-transparent hover:bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {busy === "permanent"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
                Eliminar permanentemente
              </button>

              <button
                onClick={onClose}
                disabled={busy !== null}
                className="w-full py-2.5 rounded-xl text-gray-500 hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
