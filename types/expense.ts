export interface Expense {
  timestamp: string;
  itemName: string;
  totalPrice: number;
  currentInstallment: number;
  totalInstallments: number;
  monthlyPayment: number;
  dueMonth: string; // "YYYY-MM"
  category: string;
  paidStatus: boolean; // true = paid, false = unpaid
  rowIndex?: number; // Sheet row index for updates
}

export interface MonthSummary {
  month: string; // "YYYY-MM"
  totalAmount: number;
  itemCount: number;
  items: Expense[];
}

export interface ChartDataPoint {
  month: string; // display label e.g. "Apr 2026"
  monthKey: string; // "YYYY-MM"
  amount: number;
}

export interface ExpenseFormData {
  itemName: string;
  totalPrice: number;
  totalInstallments: number;
  startMonth: string; // "YYYY-MM"
  category: string;
}
