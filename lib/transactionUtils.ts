import type {
  Transaction,
  TransactionSummary,
  TransactionFilters,
} from "@/types/transaction";

/**
 * Calculate transaction summary for a given period
 */
export function getTransactionSummary(
  transactions: Transaction[],
  filters?: TransactionFilters
): TransactionSummary {
  let filtered = [...transactions];

  // Apply filters
  if (filters) {
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter((t) => t.category === filters.category);
    }

    if (filters.startDate) {
      filtered = filtered.filter((t) => t.date >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter((t) => t.date <= filters.endDate!);
    }

    if (filters.paymentMethod && filters.paymentMethod !== "all") {
      filtered = filtered.filter((t) => t.paymentMethod === filters.paymentMethod);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }
  }

  const income = filtered.filter((t) => t.type === "income");
  const expense = filtered.filter((t) => t.type === "expense");

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    incomeCount: income.length,
    expenseCount: expense.length,
    transactions: filtered,
  };
}

/**
 * Get transactions for current month
 */
export function getCurrentMonthTransactions(
  transactions: Transaction[]
): Transaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;

  return transactions.filter((t) => t.date.startsWith(currentMonth));
}

/**
 * Get transactions grouped by category
 */
export function getTransactionsByCategory(
  transactions: Transaction[],
  type?: "income" | "expense"
): Record<string, { total: number; count: number; transactions: Transaction[] }> {
  let filtered = transactions;
  if (type) {
    filtered = transactions.filter((t) => t.type === type);
  }

  const grouped: Record<
    string,
    { total: number; count: number; transactions: Transaction[] }
  > = {};

  filtered.forEach((t) => {
    if (!grouped[t.category]) {
      grouped[t.category] = { total: 0, count: 0, transactions: [] };
    }
    grouped[t.category].total += t.amount;
    grouped[t.category].count += 1;
    grouped[t.category].transactions.push(t);
  });

  return grouped;
}

/**
 * Get monthly summary for chart (last N months)
 */
export function getMonthlyChartData(
  transactions: Transaction[],
  months: number = 6
): Array<{
  month: string;
  income: number;
  expense: number;
  balance: number;
}> {
  const now = new Date();
  const data: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;

    const monthTransactions = transactions.filter((t) =>
      t.date.startsWith(monthKey)
    );

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    data.push({
      month: formatMonthThai(monthKey),
      income,
      expense,
      balance: income - expense,
    });
  }

  return data;
}

/**
 * Format month to Thai format
 */
export function formatMonthThai(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const monthNames = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  const monthIndex = parseInt(month, 10) - 1;
  const thaiYear = parseInt(year, 10) + 543;

  return `${monthNames[monthIndex]} ${thaiYear}`;
}

/**
 * Format date to Thai format
 */
export function formatDateThai(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear() + 543;

  const monthNames = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  return `${day} ${monthNames[month]} ${year}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get unique categories from transactions
 */
export function getUniqueCategories(
  transactions: Transaction[],
  type?: "income" | "expense"
): string[] {
  let filtered = transactions;
  if (type) {
    filtered = transactions.filter((t) => t.type === type);
  }

  const categories = new Set(filtered.map((t) => t.category));
  return Array.from(categories).sort();
}

/**
 * Get date range for filter
 */
export function getDateRange(
  period: "today" | "week" | "month" | "year" | "all"
): { startDate: string; endDate: string } | null {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  switch (period) {
    case "today":
      return { startDate: today, endDate: today };

    case "week": {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        startDate: weekAgo.toISOString().split("T")[0],
        endDate: today,
      };
    }

    case "month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: monthStart.toISOString().split("T")[0],
        endDate: today,
      };
    }

    case "year": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: yearStart.toISOString().split("T")[0],
        endDate: today,
      };
    }

    case "all":
      return null;

    default:
      return null;
  }
}
