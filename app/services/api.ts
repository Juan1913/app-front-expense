export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  username: string;
  role: string;
}

export interface AccountDTO {
  id: string;
  name: string;
  bank: string;
  cardNumber: string | null;
  description: string | null;
  balance: string;
  currency: string;
  savings: boolean;
  creditCard: boolean;
  creditLimit: string | null;
  annualRate: string | null;
  createdAt: string;
}

export interface MonthlySummary {
  year: number;
  month: number;
  monthName: string;
  income: string;
  expenses: string;
  savings: string;
}

export interface ExpenseByCategory {
  category: string;
  amount: string;
  percentage: string;
}

export interface BudgetComparison {
  categoryId: string;
  category: string;
  budgeted: string;
  actual: string;
  percentage: string;
}

export interface MonthlySavingsProgress {
  year: number;
  month: number;
  monthName: string;
  savingsAmount: string;
  savingsGoal: string;
  progressPercentage: string;
}

export interface DashboardSummary {
  totalTransactions: number;
  totalIncome: string;
  totalExpenses: string;
  totalSavings: string;
  totalNetWorth: string;
  totalInSavingsAccounts: string;
  totalOperational: string;
  monthlySummaries: MonthlySummary[];
  expensesByCategory: ExpenseByCategory[];
  budgetComparisons: BudgetComparison[];
  monthlySavingsProgress: MonthlySavingsProgress[];
}

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface TransactionDTO {
  id: string;
  amount: string;
  date: string;
  description: string | null;
  type: TransactionType;
  accountId: string;
  accountName: string;
  transferToAccountId: string | null;
  transferToAccountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  userId: string;
  createdAt: string;
}

export interface UserDTO {
  id: string;
  username: string | null;
  email: string;
  role: string;
  monthlySavingsGoal: string | null;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const BASE_URL = (import.meta.env.VITE_API_URL ?? "") + "/api/v1";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("finz-auth");
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch {
    return null;
  }
};

function handleSessionExpired(path: string): boolean {
  if (path.startsWith("/auth/")) return false;
  if (typeof window === "undefined") return false;
  if (window.location.pathname === "/login") return false;

  try { localStorage.removeItem("finz-auth"); } catch {}

  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?next=${next}&reason=expired`;
  return true;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if ((res.status === 401 || res.status === 403) && handleSessionExpired(path)) {
    throw new Error("Sesión expirada");
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (username: string, email: string, password: string) =>
    apiFetch<{ id: string; username: string; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  verifyEmail: (token: string) =>
    apiFetch<{ email: string; setupToken: string }>(`/auth/verify?token=${encodeURIComponent(token)}`),

  setupProfile: (data: {
    setupToken: string;
    username: string;
    password: string;
  }) =>
    apiFetch<LoginResponse>("/auth/setup-profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
};

export const dashboard = {
  getSummary: (params?: { accountId?: string; months?: number }) => {
    const qs = new URLSearchParams();
    if (params?.accountId) qs.set("accountId", params.accountId);
    if (params?.months !== undefined) qs.set("months", String(params.months));
    const q = qs.toString();
    return apiFetch<DashboardSummary>(`/dashboard/summary${q ? `?${q}` : ""}`);
  },
};

export interface AccountImpact {
  transactions: number;
}

export type AccountSortBy = "balance" | "name" | "bank" | "createdAt";
export type SortDir = "asc" | "desc";

export interface AccountListParams {
  search?: string;
  currency?: string;
  sortBy?: AccountSortBy;
  sortDir?: SortDir;
}

export const accounts = {
  list: (params?: AccountListParams) => {
    const qs = new URLSearchParams();
    if (params?.search)   qs.set("search",   params.search);
    if (params?.currency) qs.set("currency", params.currency);
    if (params?.sortBy)   qs.set("sortBy",   params.sortBy);
    if (params?.sortDir)  qs.set("sortDir",  params.sortDir);
    const q = qs.toString();
    return apiFetch<AccountDTO[]>(`/accounts${q ? `?${q}` : ""}`);
  },
  getById: (id: string) => apiFetch<AccountDTO>(`/accounts/${id}`),
  create: (data: {
    name: string;
    bank: string;
    cardNumber?: string;
    description?: string;
    balance?: string;
    currency?: string;
    savings?: boolean;
    creditCard?: boolean;
    creditLimit?: string;
    annualRate?: string;
  }) =>
    apiFetch<AccountDTO>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      bank: string;
      cardNumber: string;
      description: string;
      balance: string;
      currency: string;
      savings: boolean;
      creditCard: boolean;
      creditLimit: string;
      annualRate: string;
    }>,
  ) =>
    apiFetch<AccountDTO>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/accounts/${id}`, { method: "DELETE" }),

  impact:          (id: string) => apiFetch<AccountImpact>(`/accounts/${id}/impact`),
  trash:           ()            => apiFetch<AccountDTO[]>("/accounts/trash"),
  restore:         (id: string) => apiFetch<AccountDTO>(`/accounts/${id}/restore`, { method: "POST" }),
  removePermanent: (id: string) => apiFetch<void>(`/accounts/${id}/permanent`, { method: "DELETE" }),
};

export interface CategoryDTO {
  id: string;
  name: string;
  description: string | null;
  type: string;
  createdAt: string;
}

export interface CategoryImpact {
  transactions: number;
  budgets: number;
}

export interface BudgetDTO {
  id: string;
  amount: string;
  month: number;
  year: number;
  categoryId: string;
  categoryName: string;
  userId: string;
  createdAt: string;
}

export interface BudgetComparisonItem {
  id: string;
  budgeted: string;
  actual: string;
  percentage: string;
  month: number;
  year: number;
  categoryId: string;
  categoryName: string;
  createdAt: string;
}

export const budgets = {
  list: (params?: { month?: number; year?: number }) => {
    const qs = new URLSearchParams();
    if (params?.month !== undefined) qs.set("month", String(params.month));
    if (params?.year !== undefined) qs.set("year", String(params.year));
    const q = qs.toString();
    return apiFetch<BudgetDTO[]>(`/budgets${q ? `?${q}` : ""}`);
  },
  comparison: (params: { month: number; year: number }) => {
    const qs = new URLSearchParams();
    qs.set("month", String(params.month));
    qs.set("year",  String(params.year));
    return apiFetch<BudgetComparisonItem[]>(`/budgets/comparison?${qs.toString()}`);
  },
  getById: (id: string) => apiFetch<BudgetDTO>(`/budgets/${id}`),
  create: (data: { categoryId: string; amount: string; month: number; year: number }) =>
    apiFetch<BudgetDTO>("/budgets", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: string,
    data: Partial<{ categoryId: string; amount: string; month: number; year: number }>,
  ) =>
    apiFetch<BudgetDTO>(`/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/budgets/${id}`, { method: "DELETE" }),
  trash: () => apiFetch<BudgetDTO[]>("/budgets/trash"),
  restore: (id: string) => apiFetch<BudgetDTO>(`/budgets/${id}/restore`, { method: "POST" }),
  removePermanent: (id: string) => apiFetch<void>(`/budgets/${id}/permanent`, { method: "DELETE" }),
};

export const categories = {
  list: (type?: string) => {
    const qs = type ? `?type=${type}` : "";
    return apiFetch<CategoryDTO[]>(`/categories${qs}`);
  },
  getById: (id: string) => apiFetch<CategoryDTO>(`/categories/${id}`),
  create: (data: { name: string; description?: string; type: string }) =>
    apiFetch<CategoryDTO>("/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; description: string; type: string }>) =>
    apiFetch<CategoryDTO>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/categories/${id}`, { method: "DELETE" }),

  impact:          (id: string) => apiFetch<CategoryImpact>(`/categories/${id}/impact`),
  trash:           ()            => apiFetch<CategoryDTO[]>("/categories/trash"),
  restore:         (id: string) => apiFetch<CategoryDTO>(`/categories/${id}/restore`, { method: "POST" }),
  removePermanent: (id: string) => apiFetch<void>(`/categories/${id}/permanent`, { method: "DELETE" }),
};

export interface CreateTransactionDTO {
  amount: string;
  date: string;
  description?: string;
  type: TransactionType;
  accountId: string;
  transferToAccountId?: string;
  categoryId?: string;
}

export type TransactionSortBy = "date" | "amount" | "createdAt";

export interface TransactionFilters {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  fromDate?: string;   // ISO datetime: 2026-04-01T00:00:00
  toDate?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
}

export interface TransactionListParams extends TransactionFilters {
  sortBy?: TransactionSortBy;
  sortDir?: SortDir;
  page?: number;
  size?: number;
}

export interface TransactionSummary {
  totalIncome: string;
  totalExpense: string;
  netBalance: string;
  incomeCount: number;
  expenseCount: number;
  totalCount: number;
}

function buildTxnQuery(params: TransactionListParams | TransactionFilters): URLSearchParams {
  const qs = new URLSearchParams();
  const p = params as TransactionListParams;
  if (p.type)       qs.set("type",       p.type);
  if (p.accountId)  qs.set("accountId",  p.accountId);
  if (p.categoryId) qs.set("categoryId", p.categoryId);
  if (p.fromDate)   qs.set("fromDate",   p.fromDate);
  if (p.toDate)     qs.set("toDate",     p.toDate);
  if (p.minAmount)  qs.set("minAmount",  p.minAmount);
  if (p.maxAmount)  qs.set("maxAmount",  p.maxAmount);
  if (p.search)     qs.set("search",     p.search);
  if (p.sortBy)     qs.set("sortBy",     p.sortBy);
  if (p.sortDir)    qs.set("sortDir",    p.sortDir);
  if (p.page !== undefined) qs.set("page", String(p.page));
  if (p.size !== undefined) qs.set("size", String(p.size));
  return qs;
}

export interface TransactionImportRow {
  row: number;
  date: string | null;
  type: string | null;
  amount: string | null;
  accountName: string | null;
  transferToAccountName: string | null;
  categoryName: string | null;
  description: string | null;
  valid: boolean;
  errorMessage: string | null;
  created: boolean;
}

export interface TransactionImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdRows: number;
  dryRun: boolean;
  rows: TransactionImportRow[];
}

export const transactions = {
  list: (params?: TransactionListParams) =>
    apiFetch<{ content: TransactionDTO[]; totalElements: number; totalPages: number; number: number; size: number }>(
      `/transactions?${buildTxnQuery(params ?? {})}`,
    ),
  summary: (params?: TransactionFilters) =>
    apiFetch<TransactionSummary>(`/transactions/summary?${buildTxnQuery(params ?? {})}`),
  getById: (id: string) => apiFetch<TransactionDTO>(`/transactions/${id}`),
  create: (data: CreateTransactionDTO) =>
    apiFetch<TransactionDTO>("/transactions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateTransactionDTO>) =>
    apiFetch<TransactionDTO>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/transactions/${id}`, { method: "DELETE" }),
  exportExcel: async (params?: TransactionFilters) => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/transactions/export.xlsx?${buildTxnQuery(params ?? {})}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const dispo = res.headers.get("content-disposition") ?? "";
    const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(dispo);
    const filename = match ? decodeURIComponent(match[1] ?? match[2]) : `transacciones-${Date.now()}.xlsx`;
    return { blob, filename };
  },
  importFile: async (file: File, dryRun: boolean, autoCreateAccounts: boolean = false) => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const qs = new URLSearchParams({
      dryRun: String(dryRun),
      autoCreateAccounts: String(autoCreateAccounts),
    });
    const res = await fetch(`${BASE_URL}/transactions/import?${qs.toString()}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
    }
    return (await res.json()) as TransactionImportResult;
  },
  importExtract: async (file: File, accountId: string, dryRun: boolean) => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const qs = new URLSearchParams({ accountId, dryRun: String(dryRun) });
    const res = await fetch(`${BASE_URL}/transactions/import-extract?${qs.toString()}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
    }
    return (await res.json()) as TransactionImportResult;
  },
};

export type ChatRole = "USER" | "ASSISTANT" | "SYSTEM";

export type ChatActionType = "CREATE_EXPENSE" | "CREATE_INCOME" | "CREATE_TRANSFER";
export type ChatActionStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "FAILED";

export interface PendingActionDTO {
  id: string;
  type: ChatActionType;
  summary: string;
  payload: Record<string, unknown>;
  status: ChatActionStatus;
  resultMessage: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ChatMessageDTO {
  messageId?: string;
  /** Compat: backend devuelve `messageId` en respuesta de send pero `id` en getConversation. */
  id?: string;
  conversationId?: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  pendingActions?: PendingActionDTO[];
}

export interface ChatConversationDTO {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessageDTO[];
}

export const chat = {
  listConversations: () =>
    apiFetch<ChatConversationDTO[]>("/chat/conversations"),
  getConversation: (id: string) =>
    apiFetch<ChatConversationDTO>(`/chat/conversations/${id}`),
  createConversation: (message: string) =>
    apiFetch<ChatConversationDTO>("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  sendMessage: (conversationId: string, message: string) =>
    apiFetch<ChatMessageDTO>(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  deleteConversation: (id: string) =>
    apiFetch<void>(`/chat/conversations/${id}`, { method: "DELETE" }),
  reindex: () =>
    apiFetch<void>("/chat/index", { method: "POST" }),
  confirmAction: (actionId: string) =>
    apiFetch<PendingActionDTO>(`/chat/actions/${actionId}/confirm`, { method: "POST" }),
  rejectAction: (actionId: string) =>
    apiFetch<PendingActionDTO>(`/chat/actions/${actionId}/reject`, { method: "POST" }),
};

export type WishlistStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface WishlistDTO {
  id: string;
  name: string;
  description: string | null;
  targetAmount: string;
  currentAmount: string;
  progressPercentage: string;
  deadline: string | null; // ISO date YYYY-MM-DD
  status: WishlistStatus;
  createdAt: string;
  userId: string;
}

export const wishlist = {
  list: (params?: { status?: WishlistStatus }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    const q = qs.toString();
    return apiFetch<WishlistDTO[]>(`/wishlist${q ? `?${q}` : ""}`);
  },
  getById: (id: string) => apiFetch<WishlistDTO>(`/wishlist/${id}`),
  create: (data: {
    name: string;
    description?: string;
    targetAmount: string;
    deadline?: string;
  }) => apiFetch<WishlistDTO>("/wishlist", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      targetAmount: string;
      currentAmount: string;
      deadline: string;
      status: WishlistStatus;
    }>,
  ) => apiFetch<WishlistDTO>(`/wishlist/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/wishlist/${id}`, { method: "DELETE" }),
};

export type DebtStatus = "ACTIVE" | "PAID_OFF" | "IN_DEFAULT";

export type DebtQuality = "GOOD" | "MEDIUM" | "BAD";

export interface DebtDTO {
  id: string;
  name: string;
  description: string | null;
  creditor: string | null;
  principal: string;
  currentBalance: string;
  annualRate: string;
  monthlyRate: string;
  minimumPayment: string;
  progressPercentage: string;
  startDate: string | null;
  status: DebtStatus;
  createdAt: string;
  userId: string;
  qualityBadge: DebtQuality;
  qualityHint: string;
}

export interface DebtPaymentDTO {
  id: string;
  debtId: string;
  amountTotal: string;
  amountInterest: string;
  amountCapital: string;
  balanceAfter: string;
  paymentDate: string;
  accountId: string | null;
  accountName: string | null;
  transactionId: string | null;
  createdAt: string;
}

export interface DebtSummaryDTO {
  debtId: string;
  totalCapitalPaid: string;
  totalInterestPaid: string;
  currentBalance: string;
  nextMonthInterestEstimate: string;
  capitalProgressPercentage: string;
  paymentsCount: number;
  qualityBadge: DebtQuality;
  qualityHint: string;
}

export interface CreateDebtPaymentDTO {
  amount: string;
  accountId: string;
  paymentDate?: string;
}

export interface CreateDebtDTO {
  name: string;
  description?: string;
  creditor?: string;
  principal: string;
  currentBalance?: string;
  annualRate: string;
  minimumPayment: string;
  startDate?: string;
}

export interface UpdateDebtDTO {
  name?: string;
  description?: string;
  creditor?: string;
  principal?: string;
  currentBalance?: string;
  annualRate?: string;
  minimumPayment?: string;
  startDate?: string;
  status?: DebtStatus;
}

export interface DebtPayoffOrderDTO {
  debtId: string;
  name: string;
  /** -1 cuando la deuda no se liquida dentro del horizonte simulado. */
  payoffMonth: number;
  interestPaid: string;
}

export interface MonthlyBalancePoint {
  month: number;
  balance: string;
  interestThisMonth: string;
}

export type PayoffStrategy = "MINIMUM_ONLY" | "SNOWBALL" | "AVALANCHE";

export interface PayoffPlanDTO {
  strategy: PayoffStrategy;
  monthlyTotal: string;
  monthsToFreedom: number;
  totalPaid: string;
  totalInterest: string;
  order: DebtPayoffOrderDTO[];
  trajectory: MonthlyBalancePoint[];
}

export interface StrategyComparisonDTO {
  monthlyBudget: string;
  totalMinimum: string;
  extraBudget: string;
  minimumOnly: PayoffPlanDTO;
  snowball: PayoffPlanDTO;
  avalanche: PayoffPlanDTO;
  recommended: PayoffStrategy;
  interestSavedVsMinimum: string;
  monthsSavedVsMinimum: number;
}

export const debts = {
  list: (params?: { status?: DebtStatus }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    const q = qs.toString();
    return apiFetch<DebtDTO[]>(`/debts${q ? `?${q}` : ""}`);
  },
  getById: (id: string) => apiFetch<DebtDTO>(`/debts/${id}`),
  create: (data: CreateDebtDTO) =>
    apiFetch<DebtDTO>("/debts", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateDebtDTO) =>
    apiFetch<DebtDTO>(`/debts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/debts/${id}`, { method: "DELETE" }),
  compareStrategies: (extraBudget?: string) => {
    const qs = extraBudget ? `?extraBudget=${encodeURIComponent(extraBudget)}` : "";
    return apiFetch<StrategyComparisonDTO>(`/debts/strategies${qs}`);
  },
  recordPayment: (id: string, data: CreateDebtPaymentDTO) =>
    apiFetch<DebtPaymentDTO>(`/debts/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listPayments: (id: string) =>
    apiFetch<DebtPaymentDTO[]>(`/debts/${id}/payments`),
  summary: (id: string) =>
    apiFetch<DebtSummaryDTO>(`/debts/${id}/summary`),
};

export type DocumentStatus = "PROCESSING" | "READY" | "FAILED";

export interface UserDocumentDTO {
  id: string;
  name: string;
  contentType: string | null;
  sizeBytes: number | null;
  chunkCount: number | null;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
}

export const documents = {
  list: () => apiFetch<UserDocumentDTO[]>("/documents"),

  upload: async (file: File): Promise<UserDocumentDTO> => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    return res.json();
  },

  remove: (id: string) =>
    apiFetch<void>(`/documents/${id}`, { method: "DELETE" }),
};

export interface UpdateUserDTO {
  username?: string;
  monthlySavingsGoal?: string;
}

export const users = {
  getById: (id: string) => apiFetch<UserDTO>(`/users/${id}`),
  update: (id: string, data: UpdateUserDTO) =>
    apiFetch<UserDTO>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatCOP = (amount: string | number): string => {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "$ 0";
  return copFormatter.format(n);
};

export const formatCOPShort = (amount: string | number): string => {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "$ 0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return formatCOP(n);
};

export const admin = {
  listUsers: (page = 0, size = 10) =>
    apiFetch<PageResult<UserDTO>>(`/admin/users?page=${page}&size=${size}&sort=createdAt,desc`),

  inviteUser: (email: string) =>
    apiFetch<UserDTO>("/admin/users", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  toggleActive: (id: string) =>
    apiFetch<UserDTO>(`/admin/users/${id}/toggle-active`, { method: "PATCH" }),

  deleteUser: (id: string) =>
    apiFetch<void>(`/admin/users/${id}`, { method: "DELETE" }),
};

export interface UploadResult {
  /** Identificador interno del archivo en storage; lo que se persiste en la DB. */
  key: string;
  /** URL prefirmado para preview inmediato (caduca a las ~1h). */
  url: string;
}

export const storage = {
  upload: async (file: File, folder = "uploads"): Promise<UploadResult> => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const res = await fetch(`${BASE_URL}/storage/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    return { key: data.key as string, url: data.url as string };
  },
};

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurringTransactionDTO {
  id: string;
  amount: string;
  description: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  nextExecution: string;
  active: boolean;
  lastExecutedAt: string | null;
  createdAt: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
}

export interface CreateRecurringTransactionDTO {
  amount: string;
  description: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  accountId: string;
  categoryId: string;
}

export interface UpdateRecurringTransactionDTO {
  amount?: string;
  description?: string;
  frequency?: RecurringFrequency;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  active?: boolean;
}

export const recurringTransactions = {
  list: () => apiFetch<RecurringTransactionDTO[]>("/recurring-transactions"),
  getById: (id: string) => apiFetch<RecurringTransactionDTO>(`/recurring-transactions/${id}`),
  create: (data: CreateRecurringTransactionDTO) =>
    apiFetch<RecurringTransactionDTO>("/recurring-transactions", {
      method: "POST", body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateRecurringTransactionDTO) =>
    apiFetch<RecurringTransactionDTO>(`/recurring-transactions/${id}`, {
      method: "PUT", body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiFetch<void>(`/recurring-transactions/${id}`, { method: "DELETE" }),
  apply: (id: string) =>
    apiFetch<RecurringTransactionDTO>(`/recurring-transactions/${id}/apply`, { method: "POST" }),
  applyDue: () =>
    apiFetch<{ created: number }>(`/recurring-transactions/apply-due`, { method: "POST" }),
};

export interface TrmRateDTO {
  date: string;
  value: string;
  source: string | null;
}

export const trm = {
  current: () => apiFetch<TrmRateDTO>("/trm/current"),
  history: (from: string, to: string) =>
    apiFetch<TrmRateDTO[]>(`/trm/history?from=${from}&to=${to}`),
};

export const daysLeftInMonth = (): number => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
};
