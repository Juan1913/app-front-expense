import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, CreditCard, ArrowRightLeft, Target, BarChart3, MessageCircle,
  ChevronLeft, ChevronRight, X, Check, FileSpreadsheet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Slide {
  icon: LucideIcon;
  iconGradient: string;
  title: string;
  description: string;
  bullets?: string[];
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    iconGradient: "from-cyan-500 to-blue-600",
    title: "Bienvenido a FINAZ",
    description:
      "Tu app personal para entender tu plata: cuentas, gastos, ingresos, deudas y metas — todo en un solo lugar, con un asesor IA listo para ayudarte.",
    bullets: [
      "Mantenete al tanto de cuánto te queda y a dónde se va",
      "Pone metas y mirá tu progreso real",
      "Preguntale a FinBot lo que sea sobre tu plata",
    ],
  },
  {
    icon: CreditCard,
    iconGradient: "from-violet-500 to-purple-600",
    title: "Cuentas y tarjetas",
    description:
      "Registrá tus cuentas reales: corrientes, ahorros y tarjetas de crédito. El balance siempre refleja la plata que tenés y la deuda que debés.",
    bullets: [
      "Cuenta normal: el saldo es tu plata disponible",
      "Cuenta de ahorro: cuenta como “Ahorrado” en el dashboard",
      "Tarjeta de crédito: el saldo representa lo que debés (sube con compras, baja con pagos)",
    ],
  },
  {
    icon: ArrowRightLeft,
    iconGradient: "from-emerald-500 to-teal-600",
    title: "Transacciones",
    description:
      "Cada movimiento se registra una sola vez y se refleja donde corresponde. Manualmente, importando un Excel, o subiéndole tu extracto bancario y dejando que la IA los extraiga.",
    bullets: [
      "Ingreso: te entra plata (sueldo, freelance…)",
      "Gasto: gastás (en una categoría)",
      "Transferencia: movés plata entre cuentas — incluye pagar la tarjeta",
    ],
  },
  {
    icon: Target,
    iconGradient: "from-amber-500 to-orange-600",
    title: "Presupuestos y deseos",
    description:
      "Pone un tope de gasto mensual por categoría y mirá cómo vas en tiempo real. Crea metas de ahorro (un viaje, un computador) y observá cuánto te falta.",
    bullets: [
      "Presupuestos por categoría con alertas visuales",
      "Wishlist con metas personalizadas",
      "Análisis de tendencia y proyección",
    ],
  },
  {
    icon: BarChart3,
    iconGradient: "from-rose-500 to-red-600",
    title: "Métricas y análisis",
    description:
      "Visualizá patrones de tu gasto, comparate con períodos anteriores y descubrí en qué categorías aumenta o baja tu consumo cuando sube tu ingreso.",
    bullets: [
      "Comparativo entre períodos",
      "Tendencias por categoría",
      "Salud financiera con lenguaje plano",
    ],
  },
  {
    icon: MessageCircle,
    iconGradient: "from-cyan-500 to-blue-600",
    title: "FinBot, tu asesor IA",
    description:
      "Hacele preguntas como “¿puedo darme un gusto?” o “¿qué deuda me conviene pagar primero?”. FinBot lee tus datos reales y te responde con números concretos.",
    bullets: [
      "Acceso a saldos, gastos, deudas y metas",
      "Recomendaciones de estrategia para liquidar deudas",
      "Puede leer extractos bancarios y sugerir transacciones",
    ],
  },
  {
    icon: FileSpreadsheet,
    iconGradient: "from-indigo-500 to-purple-600",
    title: "Listo para empezar",
    description:
      "Empezá creando tu primera cuenta en /cuentas y registrando algunos movimientos. En unos minutos vas a ver tu primer dashboard con datos reales.",
    bullets: [
      "Si ya tenés tus movimientos en un Excel, importalos en /transacciones",
      "Si tenés un extracto bancario, también podés subirlo",
      "Cualquier duda, abrí FinBot — está para ayudarte",
    ],
  },
];

const STORAGE_KEY = "FINAZ-onboarding-completed";

export function OnboardingModal({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const total = SLIDES.length;
  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === total - 1;

  function complete() {
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}
    onClose();
  }

  function next() {
    if (isLast) complete();
    else setStep((s) => Math.min(total - 1, s + 1));
  }

  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="bg-[#141418] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                {SLIDES.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-6 bg-cyan-400"
                        : i < step ? "w-1.5 bg-cyan-400/60"
                        : "w-1.5 bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={complete}
                title="Saltar tutorial"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.iconGradient} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {slide.title}
                  </h2>
                  <p className="text-sm text-gray-300 leading-relaxed mb-5">
                    {slide.description}
                  </p>

                  {slide.bullets && (
                    <ul className="space-y-2">
                      {slide.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-2 p-4 border-t border-white/[0.06]">
              <button
                onClick={prev}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Atrás
              </button>

              <span className="text-[11px] text-gray-500 tabular-nums">
                {step + 1} / {total}
              </span>

              <button
                onClick={next}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
              >
                {isLast ? "Empezar" : "Siguiente"}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function shouldShowOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "true";
  } catch {
    return false;
  }
}
