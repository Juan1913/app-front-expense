import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "¿Puedo comprarme un computador este mes?",
  "¿Cuánto gasté en comida el mes pasado?",
  "¿Voy bien con mis ahorros?",
  "Dame tips para gastar menos",
];

interface Props {
  onPick: (message: string) => void;
}

export function ChatEmptyState({ onPick }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-500/30">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Hola, soy FinBot</h2>
        <p className="text-sm text-gray-400 mb-7 max-w-md mx-auto">
          Tu asesor financiero personal. Pregúntame sobre tus gastos, ahorros
          o si puedes darte ese gusto que tienes en mente.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="text-left px-4 py-3 bg-secondary rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors border border-white/[0.04] hover:border-white/[0.08]"
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
