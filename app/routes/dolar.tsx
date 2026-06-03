import { DashboardLayout } from "~/components/templates";
import { motion } from "framer-motion";
import {
  Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { DollarSign, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { trm, type TrmRateDTO } from "~/services/api";

type Period = "30D" | "90D" | "1Y" | "5Y";

const PERIODS: { value: Period; label: string; days: number }[] = [
  { value: "30D", label: "30 días", days: 30 },
  { value: "90D", label: "90 días", days: 90 },
  { value: "1Y",  label: "1 año",   days: 365 },
  { value: "5Y",  label: "5 años",  days: 365 * 5 },
];

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function Dolar() {
  const [period, setPeriod] = useState<Period>("90D");
  const [history, setHistory] = useState<TrmRateDTO[]>([]);
  const [current, setCurrent] = useState<TrmRateDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const days = PERIODS.find((p) => p.value === period)!.days;
    const to = new Date();
    const from = new Date(); from.setDate(from.getDate() - days);
    Promise.all([
      trm.current().catch(() => null),
      trm.history(toISO(from), toISO(to)),
    ])
      .then(([cur, hist]) => {
        setCurrent(cur);
        setHistory(hist);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  const chartData = useMemo(() =>
    history.map((r) => ({
      label: new Date(r.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
      date: r.date,
      value: Number(r.value),
    })),
  [history]);

  const stats = useMemo(() => {
    if (history.length === 0) return { min: 0, max: 0, avg: 0, change: 0, changePct: 0 };
    const values = history.map((r) => Number(r.value));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;
    const changePct = first > 0 ? (change / first) * 100 : 0;
    return { min, max, avg, change, changePct };
  }, [history]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-emerald-400" /> Dólar (TRM)
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Tasa Representativa del Mercado · Banco de la República
            </p>
          </div>
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5 border border-white/[0.04]">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  period === p.value
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <BigStat
            label="TRM actual"
            value={current ? formatRate(current.value) : "—"}
            subtext={current ? new Date(current.date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : ""}
            accent="from-emerald-400 to-teal-600"
            icon={<DollarSign className="h-5 w-5 text-white" />}
          />
          <Stat label="Cambio del período" value={`${stats.change >= 0 ? "+" : ""}${formatRate(String(stats.change))}`} accent={stats.change >= 0 ? "text-rose-300" : "text-emerald-300"} sign />
          <Stat label="% Cambio" value={`${stats.changePct >= 0 ? "+" : ""}${stats.changePct.toFixed(2)}%`} accent={stats.changePct >= 0 ? "text-rose-300" : "text-emerald-300"} sign />
          <Stat label="Mínimo" value={formatRate(String(stats.min))} accent="text-emerald-300" />
          <Stat label="Máximo" value={formatRate(String(stats.max))} accent="text-rose-300" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-secondary rounded-2xl p-5 border border-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Evolución del dólar</h3>
            <span className="text-[11px] text-gray-500 ml-auto">
              {history.length} puntos · promedio ${formatRate(String(stats.avg))}
            </span>
          </div>

          {loading ? (
            <div className="h-72 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-gray-500">
              Sin datos disponibles para el período
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trmFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tickLine={false} axisLine={false}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    interval="preserveStartEnd" minTickGap={30}
                  />
                  <YAxis
                    domain={["dataMin - 50", "dataMax + 50"]}
                    tickFormatter={(v) => `$${Math.round(v).toLocaleString("es-CO")}`}
                    tickLine={false} axisLine={false}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    width={70}
                  />
                  <Tooltip content={<TrmTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                  <ReferenceLine y={stats.avg} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" label={{ value: "promedio", fill: "#6b7280", fontSize: 9, position: "right" }} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#trmFill)" />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={0} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <div className="bg-secondary rounded-2xl p-4 border border-white/[0.04]">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <strong className="text-gray-300">Fuente:</strong> Banco de la República de Colombia vía
            datos.gov.co (cacheado localmente). Cuando hagas una transferencia entre cuentas con
            distinta moneda (COP ↔ USD), se convierte usando el TRM del día de la transacción.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function formatRate(v: string | number): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (!isFinite(n)) return "—";
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`;
}

function Stat({ label, value, accent, sign }: { label: string; value: string; accent: string; sign?: boolean }) {
  const Icon = !sign ? Minus : (value.startsWith("+") ? TrendingUp : value.startsWith("-") || value.startsWith("−") ? TrendingDown : Minus);
  return (
    <div className="bg-secondary rounded-xl p-4 border border-white/[0.04]">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums flex items-center gap-1.5 ${accent}`}>
        {sign && <Icon className="h-4 w-4" />}
        {value}
      </div>
    </div>
  );
}

function BigStat({ label, value, subtext, accent, icon }: { label: string; value: string; subtext: string; accent: string; icon: React.ReactNode }) {
  return (
    <div className="bg-secondary rounded-xl p-4 border border-white/[0.04] relative overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{label}</div>
          <div className="text-xl font-bold text-white tabular-nums truncate">{value}</div>
          <div className="text-[10px] text-gray-500 mt-1 truncate">{subtext}</div>
        </div>
        <div className={`w-10 h-10 bg-gradient-to-br ${accent} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function TrmTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 font-semibold mb-1">{label}</p>
      <p className="text-emerald-400 tabular-nums">${v.toLocaleString("es-CO", { maximumFractionDigits: 2 })}</p>
    </div>
  );
}
