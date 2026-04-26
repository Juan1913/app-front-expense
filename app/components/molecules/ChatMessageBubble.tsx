import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, User, Check, X, Loader2, AlertTriangle, CheckCircle2,
  TrendingDown, TrendingUp, ArrowRightLeft,
} from "lucide-react";
import { useState } from "react";
import { chat, type ChatActionType, type ChatMessageDTO, type PendingActionDTO } from "~/services/api";

interface Props {
  msg: ChatMessageDTO;
  onActionResolved?: (action: PendingActionDTO) => void;
}

export function ChatMessageBubble({ msg, onActionResolved }: Props) {
  const isUser = msg.role === "USER";
  const actions = msg.pendingActions ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <Avatar isUser={isUser} />
      <div className="max-w-[80%] sm:max-w-[75%] flex flex-col gap-2">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-sm shadow-lg shadow-cyan-500/10"
              : "bg-secondary text-gray-200 rounded-tl-sm border border-white/[0.04]"
          }`}
        >
          {msg.content}
        </div>
        {!isUser && actions.length > 0 && (
          <div className="space-y-2">
            {actions.map((a) => (
              <PendingActionCard key={a.id} action={a} onResolved={onActionResolved} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PendingActionCard({
  action, onResolved,
}: { action: PendingActionDTO; onResolved?: (a: PendingActionDTO) => void }) {
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(action);

  async function run(kind: "confirm" | "reject") {
    setBusy(true);
    try {
      const updated = kind === "confirm"
        ? await chat.confirmAction(local.id)
        : await chat.rejectAction(local.id);
      setLocal(updated);
      onResolved?.(updated);
    } catch (e: any) {
      setLocal({
        ...local,
        status: "FAILED",
        resultMessage: e.message ?? "Falló al ejecutar la acción.",
      });
    } finally {
      setBusy(false);
    }
  }

  const Icon = iconFor(local.type);
  const tone = toneFor(local.type);

  if (local.status === "CONFIRMED") {
    return <ResolvedCard icon={<CheckCircle2 className="h-4 w-4" />}
                         text={`Hecho — ${local.summary}`}
                         tone="bg-emerald-500/10 border-emerald-500/30 text-emerald-300" />;
  }
  if (local.status === "REJECTED") {
    return <ResolvedCard icon={<X className="h-4 w-4" />}
                         text={`Cancelado — ${local.summary}`}
                         tone="bg-gray-500/10 border-gray-500/30 text-gray-400" />;
  }
  if (local.status === "FAILED") {
    return <ResolvedCard icon={<AlertTriangle className="h-4 w-4" />}
                         text={local.resultMessage ?? "No se pudo completar la acción."}
                         tone="bg-rose-500/10 border-rose-500/30 text-rose-300" />;
  }

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border ${tone.border} ${tone.bg} p-3`}
      >
        <div className="flex items-start gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tone.iconBg}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
              {labelFor(local.type)}
            </div>
            <p className="text-sm text-white">{local.summary}</p>
            {local.payload?.description != null && (
              <p className="text-[11px] text-gray-500 mt-0.5 italic">
                {String(local.payload.description)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            disabled={busy}
            onClick={() => run("reject")}
            className="text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            disabled={busy}
            onClick={() => run("confirm")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Confirmar
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ResolvedCard({ icon, text, tone }: { icon: React.ReactNode; text: string; tone: string }) {
  return (
    <div className={`rounded-xl border ${tone} px-3 py-2 text-xs flex items-start gap-2`}>
      <span className="mt-0.5">{icon}</span>
      <span className="flex-1">{text}</span>
    </div>
  );
}

function iconFor(type: ChatActionType) {
  switch (type) {
    case "CREATE_INCOME": return TrendingUp;
    case "CREATE_TRANSFER": return ArrowRightLeft;
    default: return TrendingDown;
  }
}

function labelFor(type: ChatActionType) {
  switch (type) {
    case "CREATE_INCOME": return "Confirmar ingreso";
    case "CREATE_TRANSFER": return "Confirmar transferencia";
    default: return "Confirmar gasto";
  }
}

function toneFor(type: ChatActionType) {
  switch (type) {
    case "CREATE_INCOME":
      return {
        bg: "bg-emerald-500/[0.06]",
        border: "border-emerald-500/30",
        iconBg: "bg-gradient-to-br from-emerald-400 to-teal-600",
      };
    case "CREATE_TRANSFER":
      return {
        bg: "bg-cyan-500/[0.06]",
        border: "border-cyan-500/30",
        iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
      };
    default:
      return {
        bg: "bg-rose-500/[0.06]",
        border: "border-rose-500/30",
        iconBg: "bg-gradient-to-br from-rose-400 to-red-600",
      };
  }
}

export function ChatTypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <Avatar isUser={false} />
      <div className="bg-secondary px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1 border border-white/[0.04]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function Avatar({ isUser }: { isUser: boolean }) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser
          ? "bg-gray-700 text-gray-200"
          : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
      }`}
    >
      {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
    </div>
  );
}
