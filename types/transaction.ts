export type TransactionType = "income" | "expense";

export type PaymentMethod = "cash" | "transfer" | "credit" | "debit" | "other";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  timestamp: string; // ISO string
  tags?: string[];
  rowIndex?: number; // Google Sheets row index
}

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod?: PaymentMethod;
  tags?: string[];
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  transactions: Transaction[];
}

export interface TransactionFilters {
  type?: TransactionType | "all";
  category?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod | "all";
  searchQuery?: string;
}

export interface CategoryData {
  name: string;
  type: TransactionType;
  color?: string;
  icon?: string;
}

// Default categories
export const DEFAULT_INCOME_CATEGORIES: CategoryData[] = [
  { name: "เงินเดือน", type: "income", color: "#10b981", icon: "💰" },
  { name: "โบนัส", type: "income", color: "#3b82f6", icon: "🎁" },
  { name: "ค่าคอมมิชชั่น", type: "income", color: "#8b5cf6", icon: "💵" },
  { name: "ดอกเบี้ย", type: "income", color: "#06b6d4", icon: "📈" },
  { name: "รายได้เสริม", type: "income", color: "#f59e0b", icon: "💼" },
  { name: "ขายของ", type: "income", color: "#ec4899", icon: "🛍️" },
  { name: "อื่นๆ", type: "income", color: "#6b7280", icon: "📝" },
];

export const DEFAULT_EXPENSE_CATEGORIES: CategoryData[] = [
  { name: "อาหาร", type: "expense", color: "#ef4444", icon: "🍔" },
  { name: "ค่าเดินทาง", type: "expense", color: "#f97316", icon: "🚗" },
  { name: "ค่าบ้าน", type: "expense", color: "#eab308", icon: "🏠" },
  { name: "ค่าน้ำค่าไฟ", type: "expense", color: "#84cc16", icon: "💡" },
  { name: "ช้อปปิ้ง", type: "expense", color: "#06b6d4", icon: "🛒" },
  { name: "สุขภาพ", type: "expense", color: "#8b5cf6", icon: "💊" },
  { name: "ความบันเทิง", type: "expense", color: "#ec4899", icon: "🎮" },
  { name: "การศึกษา", type: "expense", color: "#3b82f6", icon: "📚" },
  { name: "ประกัน", type: "expense", color: "#10b981", icon: "🛡️" },
  { name: "อื่นๆ", type: "expense", color: "#6b7280", icon: "📝" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "cash", label: "เงินสด", icon: "💵" },
  { value: "transfer", label: "โอนเงิน", icon: "🏦" },
  { value: "credit", label: "บัตรเครดิต", icon: "💳" },
  { value: "debit", label: "บัตรเดบิต", icon: "💳" },
  { value: "other", label: "อื่นๆ", icon: "📝" },
];
