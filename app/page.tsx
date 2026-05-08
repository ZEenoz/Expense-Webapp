"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SummaryCards from "@/components/SummaryCards";
import ExpenseChart from "@/components/ExpenseChart";
import ExpenseTable from "@/components/ExpenseTable";
import AddExpenseModal from "@/components/AddExpenseModal";
import MonthSelector from "@/components/MonthSelector";
import {
  getCurrentMonth,
  getNextMonth,
  getMonthSummary,
  getChartData,
  getActiveInstallmentCount,
  getAllMonths,
  formatMonthThai,
  getPaidUnpaidSummary,
} from "@/lib/utils";
import { ExpenseFormData } from "@/types/expense";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    expenses,
    isLoading: isDataLoading,
    fetchExpenses,
    markPaid,
    payAll,
    addExpense
  } = useExpenses(user?.userId);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "category">("date");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    if (user?.userId) {
      fetchExpenses();
    }
  }, [fetchExpenses, user?.userId]);

  // Derived data
  const currentMonth = getCurrentMonth();
  const nextMonth = getNextMonth(currentMonth);
  const thisMonthSummary = getMonthSummary(expenses, currentMonth);
  const nextMonthSummary = getMonthSummary(expenses, nextMonth);
  const activeCount = getActiveInstallmentCount(expenses, currentMonth);
  const chartData = getChartData(expenses, currentMonth, 6);
  const selectedMonthExpenses = getMonthSummary(expenses, selectedMonth);
  const allMonths = getAllMonths(expenses);
  const thisMonthPaid = getPaidUnpaidSummary(expenses, currentMonth);

  // Available categories for the current selection
  const availableCategories = Array.from(
    new Set(selectedMonthExpenses.items.map((e) => e.category).filter(Boolean))
  ) as string[];

  const displayMonths = allMonths.length > 0 ? allMonths : [currentMonth, nextMonth];

  const handlePayAll = async () => {
    const unpaidIndices = selectedMonthExpenses.items
      .filter((e) => !e.paidStatus && e.rowIndex !== undefined)
      .map((e) => e.rowIndex as number);

    if (unpaidIndices.length > 0) {
      await payAll(unpaidIndices);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-slate-400 animate-pulse">กำลังยืนยันตัวตนผ่าน LINE...</p>
        </div>
      </div>
    );
  }

  const isLoading = isDataLoading && expenses.length === 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onAddClick={() => setIsAddModalOpen(true)} />

      <main className="flex-1 pb-12">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-up">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">Dashboard Overview</h2>
              <p className="mt-1 text-sm text-slate-400 sm:text-base">สรุปภาพรวมรายจ่ายผ่อนชำระทั้งหมดของคุณ</p>
            </div>
          </div>

          <div className="mb-10 lg:mb-12">
            <SummaryCards
              thisMonthTotal={thisMonthSummary.totalAmount}
              nextMonthTotal={nextMonthSummary.totalAmount}
              activeItemCount={activeCount}
              thisMonthPaid={thisMonthPaid.paidAmount}
              isLoading={isLoading}
            />
          </div>

          <div className="mb-8">
            <ExpenseChart data={chartData} currentMonth={currentMonth} isLoading={isLoading} />
          </div>

          <div className="mb-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up animation-delay-400">
              <div className="flex flex-wrap items-center gap-3">
                <MonthSelector months={displayMonths} selectedMonth={selectedMonth} onChange={setSelectedMonth} />

                <div className="h-6 w-px bg-white/10 hidden sm:block" />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-xl bg-slate-900/50 backdrop-blur-md border border-white/10 px-4 py-2 text-sm font-medium text-white outline-none transition-all hover:bg-slate-800 focus:border-violet-500/50 [color-scheme:dark] flex-1 sm:flex-none"
                >
                  <option value="all">ทุกหมวดหมู่ ({selectedMonthExpenses.items.length})</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat} ({selectedMonthExpenses.items.filter(e => e.category === cat).length})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMonthExpenses.items.some(e => !e.paidStatus) && (
                <button
                  onClick={handlePayAll}
                  disabled={isDataLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-5 py-2.5 text-sm font-bold text-emerald-400 border border-emerald-500/20 transition-all hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50 w-full sm:w-auto"
                >
                  {isDataLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  ชำระทั้งหมด ({selectedMonthExpenses.items.filter(e => !e.paidStatus).length})
                </button>
              )}
            </div>

            <ExpenseTable
              expenses={[...selectedMonthExpenses.items]
                .filter(e => filterCategory === "all" || e.category === filterCategory)
                .sort((a, b) => {
                  if (sortBy === "category") {
                    return (a.category || "").localeCompare(b.category || "");
                  }
                  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                })
              }
              monthLabel={formatMonthThai(selectedMonth)}
              isLoading={isLoading}
              onMarkPaid={markPaid}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-slate-600">
            Installment Dashboard &copy; {new Date().getFullYear()} &middot; Built with Next.js + Tailwind CSS
          </p>
        </div>
      </footer>

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addExpense}
      />
    </div>
  );
}
