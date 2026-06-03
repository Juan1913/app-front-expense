import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DollarSign } from "lucide-react";
import { trm, type TrmRateDTO } from "~/services/api";

export function TrmChip() {
  const [rate, setRate] = useState<TrmRateDTO | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    trm.current()
      .then((r) => { if (!cancelled) setRate(r); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!rate) {
    return (
      <button
        onClick={() => navigate("/dolar")}
        title="Ver TRM"
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary border border-white/[0.04] hover:border-white/[0.08] text-xs text-gray-400 transition-colors"
      >
        <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-mono">USD —</span>
      </button>
    );
  }

  const value = Number(rate.value);
  const formatted = value.toLocaleString("es-CO", { maximumFractionDigits: 0 });

  return (
    <button
      onClick={() => navigate("/dolar")}
      title={`TRM del ${new Date(rate.date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })} · Click para ver histórico`}
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary border border-white/[0.04] hover:border-emerald-500/30 transition-colors"
    >
      <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
      <span className="text-xs text-gray-400">USD</span>
      <span className="text-xs font-mono font-semibold text-white tabular-nums">${formatted}</span>
    </button>
  );
}
