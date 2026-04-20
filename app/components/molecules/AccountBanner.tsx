import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import type { AccountDTO } from "~/services/api";
import { formatCOP } from "~/services/api";

const GRADIENTS = [
  "from-orange-500 to-orange-700",
  "from-blue-500 to-blue-700",
  "from-pink-500 to-purple-700",
  "from-green-500 to-teal-700",
  "from-yellow-500 to-amber-700",
  "from-cyan-500 to-blue-600",
];

interface Props {
  accounts: AccountDTO[];
  username?: string;
  onAccountChange?: (account: AccountDTO | null) => void;
}

export function AccountBanner({ accounts, username = "Usuario", onAccountChange }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const hasAccounts = accounts.length > 0;
  const current = hasAccounts ? accounts[currentIndex] : null;
  const gradient = GRADIENTS[currentIndex % GRADIENTS.length];

  const handleCardClick = () => {
    if (accounts.length > 1) {
      const next = (currentIndex + 1) % accounts.length;
      setCurrentIndex(next);
      onAccountChange?.(accounts[next] ?? null);
    }
  };

  return (
    <div
      className="relative rounded-2xl px-12 py-8 h-[270px] overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at top right, #139af5ff 0%, rgba(59, 130, 246, 0.3) 30%, transparent 60%),
          radial-gradient(circle at bottom left, #000000ff 0%, rgba(30, 30, 31, 0.3) 30%, transparent 60%),
          radial-gradient(circle at top left, #1a1a1bff 0%, rgba(23, 23, 24, 0.3) 30%, transparent 60%),
          #0f172a
        `,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />

      <div className="relative z-10 h-full flex justify-between items-center">
        {/* Tarjeta */}
        <div className="relative flex-shrink-0 ml-4">
          <div className="absolute w-72 h-44 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg transform -rotate-6 translate-x-2 translate-y-2 border border-white/20" />
          <div
            className={`relative w-72 h-44 bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-2xl transform -rotate-12 hover:rotate-0 transition-transform duration-500 cursor-pointer border border-white/30`}
            onClick={handleCardClick}
            title={accounts.length > 1 ? "Clic para cambiar cuenta" : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-end items-start">
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">Banco</span>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-wide break-words leading-tight">
                  {current ? (current.bank || "Sin banco") : "Sin cuentas"}
                </div>
                {current?.cardNumber && (
                  <div className="text-sm font-mono tracking-widest opacity-80 mt-1.5">
                    {current.cardNumber}
                  </div>
                )}
                <div className="text-sm opacity-90 text-right mt-2">{username}</div>
              </div>
            </div>
            <div className="absolute top-12 left-5 w-6 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded opacity-80" />
          </div>
        </div>

        {/* Info */}
        <div className="text-white text-right flex-1 flex flex-col justify-center items-end ml-8">
          <button
            onClick={() => navigate("/cuentas")}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm mb-4 flex items-center gap-2 hover:bg-white/30 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Cuenta
          </button>
          <h2 className="text-2xl font-bold mb-3">
            {current ? current.name : "Sin cuentas"}
          </h2>
          <div className="text-4xl font-bold mb-1">
            {current ? formatCOP(current.balance) : "$ 0"}
            <span className="text-xl opacity-80 font-normal ml-2">
              {current?.currency ?? "COP"}
            </span>
          </div>
          {accounts.length > 1 && (
            <p className="text-xs text-white/50 mb-3">
              {currentIndex + 1} / {accounts.length} cuentas
            </p>
          )}
          <button
            onClick={() => navigate("/transacciones")}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 hover:bg-white/30 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Transacción
          </button>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-white/10 to-transparent opacity-30 -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-white/5 to-transparent opacity-50 translate-y-32 -translate-x-32" />
    </div>
  );
}
