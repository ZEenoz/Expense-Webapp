import { Expense, MonthSummary, ChartDataPoint } from "@/types/expense";

/**
 * Format a number as Thai Baht currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format "YYYY-MM" to display label like "Apr 2026" or "เม.ย. 2026"
 */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Format "YYYY-MM" to Thai display like "เมษายน 2569"
 */
export function formatMonthThai(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

/**
 * Get current month in "YYYY-MM" format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get next month in "YYYY-MM" format
 */
export function getNextMonth(monthKey?: string): string {
  let date: Date;
  if (monthKey) {
    const [year, month] = monthKey.split("-");
    date = new Date(Number(year), Number(month) - 1);
  } else {
    date = new Date();
  }
  date.setMonth(date.getMonth() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get expenses for a specific month
 */
export function getExpensesByMonth(
  expenses: Expense[],
  monthKey: string
): Expense[] {
  return expenses.filter((e) => e.dueMonth === monthKey);
}

/**
 * Get summary for a specific month
 */
export function getMonthSummary(
  expenses: Expense[],
  monthKey: string
): MonthSummary {
  const monthExpenses = getExpensesByMonth(expenses, monthKey);
  const totalAmount = monthExpenses.reduce(
    (sum, e) => sum + e.monthlyPayment,
    0
  );
  return {
    month: monthKey,
    totalAmount,
    itemCount: monthExpenses.length,
    items: monthExpenses,
  };
}

/**
 * Get chart data — monthly totals for N months starting from a given month
 */
export function getChartData(
  expenses: Expense[],
  startMonth: string,
  count: number = 6
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let currentMonth = startMonth;

  for (let i = 0; i < count; i++) {
    const summary = getMonthSummary(expenses, currentMonth);
    data.push({
      month: formatMonthLabel(currentMonth),
      monthKey: currentMonth,
      amount: summary.totalAmount,
    });
    currentMonth = getNextMonth(currentMonth);
  }

  return data;
}

/**
 * Get unique active installment items (items that still have installments remaining)
 */
export function getActiveItems(
  expenses: Expense[],
  currentMonth: string
): { itemName: string; currentInstallment: number; totalInstallments: number; monthlyPayment: number; totalPrice: number }[] {
  // Get one entry per item for the current month showing its status
  const currentMonthExpenses = getExpensesByMonth(expenses, currentMonth);

  // Deduplicate by item name for the given month
  const itemMap = new Map<string, Expense>();
  for (const expense of currentMonthExpenses) {
    if (!itemMap.has(expense.itemName)) {
      itemMap.set(expense.itemName, expense);
    }
  }

  return Array.from(itemMap.values()).map((e) => ({
    itemName: e.itemName,
    currentInstallment: e.currentInstallment,
    totalInstallments: e.totalInstallments,
    monthlyPayment: e.monthlyPayment,
    totalPrice: e.totalPrice,
  }));
}

/**
 * Count how many unique installment plans are active (have remaining months >= currentMonth)
 */
export function getActiveInstallmentCount(
  expenses: Expense[],
  currentMonth: string
): number {
  const activeItems = new Set<string>();
  for (const e of expenses) {
    if (e.dueMonth >= currentMonth) {
      activeItems.add(e.itemName);
    }
  }
  return activeItems.size;
}

/**
 * Get all unique months from expenses, sorted
 */
export function getAllMonths(expenses: Expense[]): string[] {
  const months = new Set<string>();
  for (const e of expenses) {
    if (e.dueMonth) {
      months.add(e.dueMonth);
    }
  }
  return Array.from(months).sort();
}

/**
 * Parse installment status string like "1/ 11" or "1/11" to { current, total }
 */
export function parseInstallmentStatus(status: string): {
  current: number;
  total: number;
} {
  const parts = status.replace(/\s/g, "").split("/");
  return {
    current: parseInt(parts[0], 10),
    total: parseInt(parts[1], 10),
  };
}

/**
 * Get paid and unpaid totals for a specific month
 */
export function getPaidUnpaidSummary(
  expenses: Expense[],
  monthKey: string
): { paidAmount: number; unpaidAmount: number; paidCount: number; unpaidCount: number } {
  const monthExpenses = getExpensesByMonth(expenses, monthKey);
  let paidAmount = 0;
  let unpaidAmount = 0;
  let paidCount = 0;
  let unpaidCount = 0;

  for (const e of monthExpenses) {
    if (e.paidStatus) {
      paidAmount += e.monthlyPayment;
      paidCount++;
    } else {
      unpaidAmount += e.monthlyPayment;
      unpaidCount++;
    }
  }

  return { paidAmount, unpaidAmount, paidCount, unpaidCount };
}

