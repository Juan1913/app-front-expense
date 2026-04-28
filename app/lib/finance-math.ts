export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  stdError: number;
  n: number;
}

export interface QuadraticResult {
  a: number; b: number; c: number;
  r2: number;
  n: number;
}

export interface DailySeriesPoint {
  date: Date;
  /** Días transcurridos desde el inicio de la serie. */
  t: number;
  income: number;
  expense: number;
  net: number;
  cumNet: number;
  cumExpense: number;
}

export const mean = (xs: number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

export const stdev = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
};

export const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

export function correlation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs), my = mean(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const ax = xs[i] - mx, ay = ys[i] - my;
    num += ax * ay; dx += ax * ax; dy += ay * ay;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

/** Media móvil centrada de tamaño window (odd). Mantiene la longitud. */
export function movingAverage(xs: number[], window: number): number[] {
  const w = Math.max(1, window | 0);
  const half = Math.floor(w / 2);
  const out = new Array(xs.length).fill(0);
  for (let i = 0; i < xs.length; i++) {
    let s = 0, c = 0;
    for (let k = -half; k <= half; k++) {
      const j = i + k;
      if (j >= 0 && j < xs.length) { s += xs[j]; c++; }
    }
    out[i] = c === 0 ? 0 : s / c;
  }
  return out;
}

/** Diferencias centradas con paso 1; bordes usan diferencia adelante/atrás. */
export function firstDerivative(ys: number[]): number[] {
  const n = ys.length;
  if (n === 0) return [];
  if (n === 1) return [0];
  const d = new Array(n);
  d[0] = ys[1] - ys[0];
  d[n - 1] = ys[n - 1] - ys[n - 2];
  for (let i = 1; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i - 1]) / 2;
  return d;
}

export function secondDerivative(ys: number[]): number[] {
  const n = ys.length;
  if (n < 3) return new Array(n).fill(0);
  const d = new Array(n);
  for (let i = 1; i < n - 1; i++) d[i] = ys[i + 1] - 2 * ys[i] + ys[i - 1];
  d[0] = d[1];
  d[n - 1] = d[n - 2];
  return d;
}

export function linearRegression(xs: number[], ys: number[]): RegressionResult {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0, stdError: 0, n };
  const mx = mean(xs), my = mean(ys);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;

  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yhat = slope * xs[i] + intercept;
    ssRes += (ys[i] - yhat) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const stdError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;
  return { slope, intercept, r2, stdError, n };
}

/** Mínimos cuadrados para y = a·x² + b·x + c, resuelto por Cramer. */
export function quadraticRegression(xs: number[], ys: number[]): QuadraticResult {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { a: 0, b: 0, c: ys[0] ?? 0, r2: 0, n };
  let S0 = n, S1 = 0, S2 = 0, S3 = 0, S4 = 0;
  let T0 = 0, T1 = 0, T2 = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i];
    const x2 = x * x, x3 = x2 * x, x4 = x3 * x;
    S1 += x; S2 += x2; S3 += x3; S4 += x4;
    T0 += y; T1 += x * y; T2 += x2 * y;
  }
  const M = [
    [S4, S3, S2],
    [S3, S2, S1],
    [S2, S1, S0],
  ];
  const rhs = [T2, T1, T0];
  const det3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det3(M);
  if (Math.abs(D) < 1e-12) return { a: 0, b: 0, c: mean(ys), r2: 0, n };
  const replaceCol = (m: number[][], col: number, v: number[]) =>
    m.map((row, i) => row.map((x, j) => (j === col ? v[i] : x)));
  const a = det3(replaceCol(M, 0, rhs)) / D;
  const b = det3(replaceCol(M, 1, rhs)) / D;
  const c = det3(replaceCol(M, 2, rhs)) / D;
  const my = mean(ys);
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yhat = a * xs[i] * xs[i] + b * xs[i] + c;
    ssRes += (ys[i] - yhat) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { a, b, c, r2, n };
}

export interface TxLike {
  amount: string;
  date: string;            // ISO
  /** TRANSFER se ignora en todos los cálculos de flujo. */
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  categoryId: string | null;
  categoryName: string | null;
}

function isoDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function parseLocalDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Rellena días faltantes con ceros entre `from` y `to`. */
export function buildDailySeries(
  txs: TxLike[],
  from?: Date,
  to?: Date,
): DailySeriesPoint[] {
  if (txs.length === 0 && !from) return [];
  const byDay = new Map<string, { inc: number; exp: number }>();
  let minD: Date | null = null, maxD: Date | null = null;
  for (const t of txs) {
    if (t.type === "TRANSFER") continue;
    const d = new Date(t.date);
    const k = isoDay(d);
    if (!byDay.has(k)) byDay.set(k, { inc: 0, exp: 0 });
    const slot = byDay.get(k)!;
    const amt = parseFloat(t.amount);
    if (!isFinite(amt)) continue;
    if (t.type === "INCOME") slot.inc += amt;
    else slot.exp += amt;
    const dayStart = parseLocalDay(k);
    if (!minD || dayStart < minD) minD = dayStart;
    if (!maxD || dayStart > maxD) maxD = dayStart;
  }
  const start = from ?? minD ?? new Date();
  const end = to ?? maxD ?? start;
  const startDay = parseLocalDay(isoDay(start));
  const endDay = parseLocalDay(isoDay(end));

  const out: DailySeriesPoint[] = [];
  let cumNet = 0, cumExp = 0, t = 0;
  for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
    const k = isoDay(d);
    const slot = byDay.get(k) ?? { inc: 0, exp: 0 };
    const net = slot.inc - slot.exp;
    cumNet += net;
    cumExp += slot.exp;
    out.push({
      date: new Date(d),
      t: t++,
      income: slot.inc,
      expense: slot.exp,
      net,
      cumNet,
      cumExpense: cumExp,
    });
  }
  return out;
}

/** Día t* donde la regresión lineal de cumNet cruza 0; null si la pendiente es ~0. */
export function breakEvenDay(series: DailySeriesPoint[]): {
  day: number | null;
  reg: RegressionResult;
} {
  const xs = series.map((p) => p.t);
  const ys = series.map((p) => p.cumNet);
  const reg = linearRegression(xs, ys);
  if (Math.abs(reg.slope) < 1e-6) return { day: null, reg };
  const t = -reg.intercept / reg.slope;
  return { day: t, reg };
}

/** Días que duran los ahorros al burn rate actual; null si es ≤0 (no se quema). */
export function runwayDays(currentBalance: number, burnRatePerDay: number): number | null {
  if (burnRatePerDay <= 0) return null;
  return currentBalance / burnRatePerDay;
}

/**
 * Tasa de ahorro: (ingreso − gasto) / ingreso, en [0, 1]. Si no hay ingreso, 0.
 */
export function savingsRate(income: number, expense: number): number {
  if (income <= 0) return 0;
  return Math.max(0, Math.min(1, (income - expense) / income));
}

/**
 * ε = pendiente de log(gasto) sobre log(ingreso). ε>1 lujo, ε<1 necesidad,
 * ε<0 bien inferior. Ignora pares no positivos (log indefinido).
 */
export function incomeElasticity(
  incomes: number[], catSpends: number[],
): { elasticity: number; r2: number; n: number } {
  const xs: number[] = [], ys: number[] = [];
  const n = Math.min(incomes.length, catSpends.length);
  for (let i = 0; i < n; i++) {
    if (incomes[i] > 0 && catSpends[i] > 0) {
      xs.push(Math.log(incomes[i]));
      ys.push(Math.log(catSpends[i]));
    }
  }
  if (xs.length < 2) return { elasticity: 0, r2: 0, n: xs.length };
  const reg = linearRegression(xs, ys);
  return { elasticity: reg.slope, r2: reg.r2, n: xs.length };
}

/** Proyecta `steps` períodos con banda ±stdError. */
export function projectLinear(
  reg: RegressionResult,
  fromT: number,
  steps: number,
): { t: number; yhat: number; lo: number; hi: number }[] {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = fromT + i;
    const yhat = reg.slope * t + reg.intercept;
    out.push({ t, yhat, lo: yhat - reg.stdError, hi: yhat + reg.stdError });
  }
  return out;
}

export interface ScenarioParams {
  /** Recorte global del gasto, 0..1. */
  expenseCut: number;
  /** Recorte por categoría (id → 0..1), se aplica encima del global. */
  categoryCuts: Record<string, number>;
  /** Monto extra mensual prorrateado a diario. */
  extraIncomeMonthly: number;
  /** Multiplicador del ingreso (0..1 ⇒ +0..+100%). */
  incomeBoost: number;
}

export const NEUTRAL_SCENARIO: ScenarioParams = {
  expenseCut: 0,
  categoryCuts: {},
  extraIncomeMonthly: 0,
  incomeBoost: 0,
};

/**
 * gasto(c,t) ← gasto(c,t)·(1−cutGlobal)·(1−cutCat),
 * ingreso(t) ← ingreso(t)·(1+boost) + extraMensual/30.
 */
export function applyScenario(
  txs: TxLike[],
  params: ScenarioParams,
  from?: Date,
  to?: Date,
): DailySeriesPoint[] {
  const baseline = buildDailySeries(txs, from, to);
  if (baseline.length === 0) return baseline;

  const expenseByDayCat = new Map<string, Map<string, number>>();
  for (const t of txs) {
    if (t.type !== "EXPENSE") continue;
    if (!t.categoryId) continue;
    const d = new Date(t.date);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!expenseByDayCat.has(k)) expenseByDayCat.set(k, new Map());
    const inner = expenseByDayCat.get(k)!;
    const amt = parseFloat(t.amount);
    if (!isFinite(amt)) continue;
    inner.set(t.categoryId, (inner.get(t.categoryId) ?? 0) + amt);
  }

  const dailyExtra = params.extraIncomeMonthly / 30;
  const out: DailySeriesPoint[] = [];
  let cumNet = 0, cumExp = 0;

  for (const p of baseline) {
    const k = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}-${String(p.date.getDate()).padStart(2, "0")}`;
    const breakdown = expenseByDayCat.get(k);

    let newExpense = 0;
    if (breakdown) {
      for (const [catId, amt] of breakdown) {
        const catCut = params.categoryCuts[catId] ?? 0;
        newExpense += amt * (1 - params.expenseCut) * (1 - catCut);
      }
    } else {
      newExpense = p.expense * (1 - params.expenseCut);
    }

    const newIncome = p.income * (1 + params.incomeBoost) + dailyExtra;
    const net = newIncome - newExpense;
    cumNet += net;
    cumExp += newExpense;
    out.push({
      date: p.date,
      t: p.t,
      income: newIncome,
      expense: newExpense,
      net,
      cumNet,
      cumExpense: cumExp,
    });
  }

  return out;
}

/** null cuando dailyNet ≤ 0 (no se alcanza nunca). */
export function daysToGoal(remaining: number, dailyNet: number): number | null {
  if (remaining <= 0) return 0;
  if (dailyNet <= 0) return null;
  return remaining / dailyNet;
}
