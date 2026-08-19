import { API_BASE_URL as configuredApiBaseUrl } from '@env';

const API_BASE_URL = configuredApiBaseUrl || 'https://expense-traker-back.vercel.app';

export type AuthResponse = { accessToken: string; user: User };
export type User = { id: string; email: string; name?: string | null };
export type Transaction = {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  description: string;
  transactionDate: string;
  category?: { id?: string; name: string; color?: string | null } | null;
};
export type Category = { id: string; name: string; icon?: string | null; color?: string | null };
export type RecurringTransaction = { id: string; amount: number; type: 'expense' | 'income'; description: string; frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; dayOfMonth?: number | null; nextRunAt: string; isActive: boolean; category?: Category | null };
export type MonthlySummary = {
  income: number;
  expenses: number;
  openingBalance?: number;
  savings: number;
  savingsRate: number;
  topCategory: string | null;
  byCategory: Record<string, number>;
  budgets?: Array<{ id: string; category: string | null; amount: number; used: number; usagePercentage: number }>;
};
export type Budget = { id: string; amount: number; startDate: string; endDate: string; category?: { name: string } | null };
export type SavingsGoal = { id: string; name: string; targetAmount: number; currentAmount: number; targetDate?: string | null; status: string };
export type TelegramLinkResponse = {
  token: string;
  link: string;
  expiresInSeconds: number;
};

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(body?.message ?? 'Unable to connect to the server');
  return body as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  me: (token: string) => request<User>('/auth/me', {}, token),
  transactions: (token: string) =>
    request<{ data: Transaction[] }>('/transactions?limit=50', {}, token),
  transactionsFiltered: (token: string, params: string) => request<{ data: Transaction[] }>(`/transactions?limit=100&${params}`, {}, token),
  transaction: (token: string, id: string) => request<Transaction>(`/transactions/${id}`, {}, token),
  categories: (token: string) => request<Category[]>('/categories', {}, token),
  monthly: (token: string) =>
    request<MonthlySummary>('/analytics/monthly', {}, token),
  safeToSpend: (token: string) => request<{ available: number; savings: number; daysUntilSalary: number | null; safeToSpend: number }>('/analytics/safe-to-spend', {}, token),
  budgets: (token: string) => request<Budget[]>('/budgets', {}, token),
  createBudget: (token: string, data: { amount: number; startDate: string; endDate: string; categoryId?: string }) => request<Budget>('/budgets', { method: 'POST', body: JSON.stringify(data) }, token),
  updateBudget: (token: string, id: string, data: Partial<{ amount: number; startDate: string; endDate: string; categoryId: string }>) => request<Budget>(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  deleteBudget: (token: string, id: string) => request<void>(`/budgets/${id}`, { method: 'DELETE' }, token),
  savingsGoals: (token: string) => request<SavingsGoal[]>('/savings-goals', {}, token),
  createSavingsGoal: (token: string, data: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string }) => request<SavingsGoal>('/savings-goals', { method: 'POST', body: JSON.stringify(data) }, token),
  updateSavingsGoal: (token: string, id: string, data: Partial<{ name: string; targetAmount: number; currentAmount: number; targetDate: string; status: string }>) => request<SavingsGoal>(`/savings-goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  deleteSavingsGoal: (token: string, id: string) => request<void>(`/savings-goals/${id}`, { method: 'DELETE' }, token),
  createTransaction: (
    token: string,
    data: {
      amount: number;
      type: 'expense' | 'income';
      description: string;
      categoryId?: string;
      transactionDate?: string;
    },
  ) =>
    request<Transaction>(
      '/transactions',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),
  updateTransaction: (token: string, id: string, data: Partial<{ amount: number; type: 'expense' | 'income'; description: string; categoryId: string; transactionDate: string }>) => request<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  deleteTransaction: (token: string, id: string) =>
    request<void>(`/transactions/${id}`, { method: 'DELETE' }, token),
  createIncome: (
    token: string,
    data: { amount: number; type: string; payDay: number; recurring: boolean },
  ) =>
    request('/incomes', { method: 'POST', body: JSON.stringify(data) }, token),
  registerDevice: (token: string, deviceToken: string, platform: 'android' | 'ios') =>
    request('/notifications/devices', { method: 'POST', body: JSON.stringify({ token: deviceToken, platform }) }, token),
  removeDevice: (token: string, deviceToken: string) =>
    request('/notifications/devices', { method: 'DELETE', body: JSON.stringify({ token: deviceToken }) }, token),
  createTelegramLink: (token: string) =>
    request<TelegramLinkResponse>('/telegram/link-token', { method: 'POST' }, token),
  telegramStatus: (token: string) => request<{ linked: boolean }>('/telegram/status', {}, token),
  recurringTransactions: (token: string) => request<RecurringTransaction[]>('/recurring-transactions', {}, token),
  createRecurringTransaction: (token: string, data: { amount: number; type: 'expense' | 'income'; description: string; frequency: RecurringTransaction['frequency']; nextRunAt: string; dayOfMonth?: number; categoryId?: string }) => request<RecurringTransaction>('/recurring-transactions', { method: 'POST', body: JSON.stringify(data) }, token),
  updateRecurringTransaction: (token: string, id: string, data: Partial<{ amount: number; description: string; frequency: RecurringTransaction['frequency']; nextRunAt: string; dayOfMonth: number; categoryId: string; isActive: boolean }>) => request<RecurringTransaction>(`/recurring-transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  deleteRecurringTransaction: (token: string, id: string) => request<void>(`/recurring-transactions/${id}`, { method: 'DELETE' }, token),
  trends: (token: string, months = 6) => request<Array<MonthlySummary & { month: string; changePercentage: number | null }>>(`/analytics/trends?months=${months}`, {}, token),
};
