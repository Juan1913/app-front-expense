import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { DatePicker } from "./DatePicker";
import type { WishlistDTO } from "~/services/api";

export interface WishlistFormState {
  name: string;
  description: string;
  targetAmount: string;
  deadline: string;
}

export const emptyWishlistForm: WishlistFormState = {
  name: "",
  description: "",
  targetAmount: "",
  deadline: "",
};

interface Props {
  open: boolean;
  editing: WishlistDTO | null;
  form: WishlistFormState;
  saving: boolean;
  onClose: () => void;
  onChange: (f: WishlistFormState) => void;
  onSave: () => void;
}

export function WishlistModal({
  open, editing, form, saving, onClose, onChange, onSave,
}: Props) {
  const canSave = form.name.trim().length > 0 && parseFloat(form.targetAmount || "0") > 0;

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
                {editing ? "Editar deseo" : "Nuevo deseo"}
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
                  placeholder="Ej. Moto nueva"
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
              <Field label="Monto meta *">
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={form.targetAmount}
                  onChange={(e) => onChange({ ...form, targetAmount: e.target.value })}
                  placeholder="Ej. 5000000"
                  className="input-dark tabular-nums"
                />
              </Field>
              <Field label="Fecha límite">
                <DatePicker
                  value={form.deadline}
                  onChange={(v) => onChange({ ...form, deadline: v })}
                  placeholder="Elige una fecha"
                />
                <p className="text-[11px] text-gray-600 mt-1">Opcional — para ver cuenta regresiva</p>
              </Field>
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
                disabled={saving || !canSave}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>

            <style>{`
              .input-dark {
                width: 100%;
                background: #151519;
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
