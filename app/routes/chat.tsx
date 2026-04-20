import { DashboardLayout } from "~/components/templates";
import {
  ChatMessageBubble, ChatTypingIndicator,
  ChatConversationList, ChatInput, ChatEmptyState,
} from "~/components/molecules";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageCircle, Menu } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { chat, type ChatConversationDTO, type ChatMessageDTO } from "~/services/api";

export default function Chat() {
  const [conversations, setConversations] = useState<ChatConversationDTO[]>([]);
  const [active, setActive] = useState<ChatConversationDTO | null>(null);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [typing, setTyping] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    chat.listConversations()
      .then((list) => setConversations(Array.isArray(list) ? list : []))
      .catch((e) => setError(e.message ?? "Error cargando conversaciones"))
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, typing, scrollToBottom]);

  async function openConversation(conv: ChatConversationDTO) {
    setActive(conv);
    setDrawerOpen(false);
    setLoadingConv(true);
    try {
      const full = await chat.getConversation(conv.id);
      setMessages(Array.isArray(full?.messages) ? full.messages : []);
    } catch (e: any) {
      setError(e.message ?? "Error abriendo conversación");
      setMessages([]);
    } finally {
      setLoadingConv(false);
    }
  }

  function newChat() {
    setActive(null);
    setMessages([]);
    setInput("");
    setDrawerOpen(false);
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setError(null);

    if (!active) {
      setTyping(true);
      try {
        const conv = await chat.createConversation(msg);
        setConversations((prev) => [conv, ...prev]);
        setActive(conv);
        const full = await chat.getConversation(conv.id);
        setMessages(Array.isArray(full?.messages) ? full.messages : []);
      } catch (e: any) {
        setError(e.message ?? "Error enviando mensaje");
      } finally {
        setTyping(false);
      }
      return;
    }

    // Existing conversation — optimistic user message, then request assistant
    const optimistic: ChatMessageDTO = {
      id: crypto.randomUUID(),
      role: "USER",
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setTyping(true);
    try {
      const response = await chat.sendMessage(active.id, msg);
      setMessages((prev) => [...prev, response]);
      setConversations((prev) =>
        prev.map((c) => c.id === active.id ? { ...c, updatedAt: new Date().toISOString() } : c),
      );
    } catch (e: any) {
      setError(e.message ?? "Error enviando mensaje");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setTyping(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await chat.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (active?.id === id) newChat();
    } catch (e: any) {
      setError(e.message ?? "Error eliminando conversación");
    }
  }

  async function handleReindex() {
    setReindexing(true);
    try {
      await chat.reindex();
    } catch (e: any) {
      setError(e.message ?? "Error al reindexar");
    } finally {
      setTimeout(() => setReindexing(false), 1000);
    }
  }

  const sidebarProps = {
    conversations,
    activeId: active?.id ?? null,
    loading: loadingConvs,
    reindexing,
    onSelect: openConversation,
    onNew: newChat,
    onDelete: handleDelete,
    onReindex: handleReindex,
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-10rem)] flex rounded-2xl overflow-hidden border border-white/[0.04]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-72 flex-shrink-0">
          <ChatConversationList {...sidebarProps} />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-72 h-full"
              >
                <ChatConversationList {...sidebarProps} onClose={() => setDrawerOpen(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 min-w-0 flex flex-col bg-primary">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-secondary">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <Menu className="h-4 w-4" />
              <span className="font-medium">
                {active ? active.title : "FinBot"}
              </span>
            </button>
            <span className="text-[11px] text-gray-500">
              {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
            </span>
          </div>

          {error && (
            <div className="mx-4 mt-3 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Body */}
          {!active && messages.length === 0 ? (
            <ChatEmptyState onPick={handleSend} />
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {loadingConv ? (
                <div className="flex justify-center pt-8">
                  <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-8 text-center text-gray-500 text-sm">
                  <MessageCircle className="h-8 w-8 opacity-30 mb-2" />
                  <p>Envía un mensaje para empezar</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <ChatMessageBubble key={msg.id} msg={msg} />
                  ))}
                  {typing && <ChatTypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          )}

          <ChatInput
            value={input}
            sending={typing}
            onChange={setInput}
            onSend={() => handleSend()}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
