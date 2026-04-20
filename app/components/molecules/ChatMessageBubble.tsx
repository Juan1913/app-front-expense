import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import type { ChatMessageDTO } from "~/services/api";

interface Props {
  msg: ChatMessageDTO;
}

export function ChatMessageBubble({ msg }: Props) {
  const isUser = msg.role === "USER";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <Avatar isUser={isUser} />
      <div
        className={`max-w-[80%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-sm shadow-lg shadow-cyan-500/10"
            : "bg-secondary text-gray-200 rounded-tl-sm border border-white/[0.04]"
        }`}
      >
        {msg.content}
      </div>
    </motion.div>
  );
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
