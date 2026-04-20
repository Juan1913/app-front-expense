import { Loader2, Send } from "lucide-react";

interface Props {
  value: string;
  sending: boolean;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
}

export function ChatInput({
  value, sending, onChange, onSend,
  placeholder = "Pregúntale algo a FinBot…",
}: Props) {
  return (
    <div className="p-4 border-t border-white/[0.04] bg-secondary">
      <div className="flex items-end gap-2.5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="flex-1 min-w-0 bg-black/20 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-white/[0.04] focus:outline-none focus:border-cyan-500/40 resize-none text-sm leading-relaxed"
          style={{ maxHeight: "120px", overflowY: "auto" }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || sending}
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-[11px] text-gray-600 mt-2 text-center">
        Enter para enviar · Shift+Enter salto de línea
      </p>
    </div>
  );
}
