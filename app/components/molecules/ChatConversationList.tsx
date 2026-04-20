import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Plus, Trash2, MessageCircle, Loader2, RefreshCw, X,
} from "lucide-react";
import type { ChatConversationDTO } from "~/services/api";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface Props {
  conversations: ChatConversationDTO[];
  activeId: string | null;
  loading: boolean;
  reindexing: boolean;
  /** When provided, shows a close button in the header (mobile drawer mode). */
  onClose?: () => void;
  onSelect: (c: ChatConversationDTO) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onReindex: () => void;
}

export function ChatConversationList({
  conversations, activeId, loading, reindexing,
  onClose, onSelect, onNew, onDelete, onReindex,
}: Props) {
  return (
    <div className="h-full flex flex-col bg-secondary border-r border-white/[0.04]">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.04] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-semibold">FinBot</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onReindex}
              disabled={reindexing}
              title="Actualizar datos financieros"
              className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/[0.06] transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${reindexing ? "animate-spin text-cyan-400" : ""}`} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                title="Cerrar"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          Nueva conversación
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center pt-8 text-gray-500 text-sm px-4">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Aún no hay conversaciones
          </div>
        ) : (
          <AnimatePresence>
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => onSelect(conv)}
                className={`group flex items-start justify-between gap-2 p-3 rounded-xl cursor-pointer mb-1 transition-colors ${
                  activeId === conv.id
                    ? "bg-white/[0.06] ring-1 ring-cyan-500/30"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate leading-tight">{conv.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{timeAgo(conv.updatedAt)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-rose-400 transition-all flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
