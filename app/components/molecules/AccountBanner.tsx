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
      className="relative rounded-2xl px-4 sm:px-8 lg:px-12 py-6 sm:py-8 sm:min-h-[270px] overflow-hidden"
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

      <div className="relative z-10 h-full flex flex-col gap-6 items-center sm:flex-row sm:justify-between sm:items-center sm:gap-4">
        <div className="relative flex-shrink-0 sm:ml-4 mt-3 sm:mt-0">
          <div className="absolute w-56 h-36 sm:w-72 sm:h-44 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg transform -rotate-3 sm:-rotate-6 translate-x-2 translate-y-2 border border-white/20" />
          <div
            className={`relative w-56 h-36 sm:w-72 sm:h-44 bg-gradient-to-br ${gradient} rounded-2xl p-5 sm:p-6 text-white shadow-2xl transform -rotate-6 sm:-rotate-12 hover:rotate-0 transition-transform duration-500 cursor-pointer border border-white/30`}
            onClick={handleCardClick}
            title={accounts.length > 1 ? "Clic para cambiar cuenta" : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-end items-start">
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">Banco</span>
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold tracking-wide leading-tight truncate">
                  {current ? (current.bank || "Sin banco") : "Sin cuentas"}
                </div>
                {current?.cardNumber && (
                  <div className="text-xs sm:text-sm font-mono tracking-widest opacity-80 mt-1 sm:mt-1.5 truncate">
                    {current.cardNumber}
                  </div>
                )}
                <div className="text-xs sm:text-sm opacity-90 text-right mt-1.5 sm:mt-2 truncate">{username}</div>
              </div>
            </div>
            <div className="absolute top-10 sm:top-12 left-4 sm:left-5 w-5 h-4 sm:w-6 sm:h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded opacity-80" />
          </div>
        </div>

        <div className="text-white text-center sm:text-right w-full sm:w-auto sm:flex-1 flex flex-col justify-center items-center sm:items-end sm:ml-8 min-w-0">
          <button
            onClick={() => navigate("/cuentas")}
            className="hidden sm:flex bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm mb-2 sm:mb-4 items-center gap-2 hover:bg-white/30 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Nueva Cuenta
          </button>
          <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-3 truncate max-w-full">
            {current ? current.name : "Sin cuentas"}
          </h2>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 leading-tight break-words max-w-full">
            {current ? formatCOP(current.balance) : "$ 0"}
            <span className="text-base sm:text-lg lg:text-xl opacity-80 font-normal ml-2">
              {current?.currency ?? "COP"}
            </span>
          </div>
          {accounts.length > 1 && (
            <p className="text-[11px] sm:text-xs text-white/50 mb-2 sm:mb-3">
              {currentIndex + 1} / {accounts.length} cuentas
            </p>
          )}
          <button
            onClick={() => navigate("/transacciones")}
            className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm flex items-center gap-2 hover:bg-white/30 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Nueva Transacción
          </button>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-radial from-white/10 to-transparent opacity-30 -translate-y-36 sm:-translate-y-48 translate-x-36 sm:translate-x-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-radial from-white/5 to-transparent opacity-50 translate-y-24 sm:translate-y-32 -translate-x-24 sm:-translate-x-32 pointer-events-none" />
    </div>
  );
}
