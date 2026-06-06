"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import SummaryCards from "@/components/SummaryCards";
import ExpenseChart from "@/components/ExpenseChart";
import InstallmentList from "@/components/installments/InstallmentList";
import AddExpenseModal from "@/components/AddExpenseModal";
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
import { CheckCircle2, CreditCard, Loader2, Plus, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";

// ─── Month selector (inline, same style as transactions sort) ─
const MONTH_LABEL_MAP: Record<string, string> = {};

export default function InstallmentsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    expenses,
    isLoading: isDataLoading,
    fetchExpenses,
    markPaid,
    payAll,
    addExpense,
    deleteExpense,
  } = useExpenses();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    if (user?.userId) fetchExpenses();
  }, [fetchExpenses, user?.userId]);

  // ── Derived ──
  const currentMonth = getCurrentMonth();
  const nextMonth = getNextMonth(currentMonth);
  const thisMonthSummary = getMonthSummary(expenses, currentMonth);
  const nextMonthSummary = getMonthSummary(expenses, nextMonth);
  const activeCount = getActiveInstallmentCount(expenses, currentMonth);
  const chartData = getChartData(expenses, currentMonth, 6);
  const allMonths = getAllMonths(expenses);
  const thisMonthPaid = getPaidUnpaidSummary(expenses, currentMonth);
  const displayMonths = allMonths.length > 0 ? allMonths : [currentMonth, nextMonth];

  const selectedMonthExpenses = useMemo(
    () => getMonthSummary(expenses, selectedMonth),
    [expenses, selectedMonth]
  );

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set(selectedMonthExpenses.items.map((e) => e.category).filter(Boolean))
      ) as string[],
    [selectedMonthExpenses]
  );

  const filteredExpenses = useMemo(
    () =>
      selectedMonthExpenses.items.filter(
        (e) => filterCategory === "all" || e.category === filterCategory
      ),
    [selectedMonthExpenses, filterCategory]
  );

  const handlePayAll = async () => {
    const unpaidItems = selectedMonthExpenses.items.filter(
      (e) => !e.paidStatus && e.rowIndex !== undefined
    );
    const unpaidIndices = unpaidItems.map((e) => e.rowIndex as number);
    // Pass UUIDs when available for drift-safe operation
    const unpaidIds = unpaidItems.map((e) => e.rowId).filter(Boolean) as string[];
    if (unpaidIndices.length > 0) await payAll(unpaidIndices, unpaidIds);
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-slate-400 animate-pulse">กำลังยืนยันตัวตนผ่าน LINE...</p>
        </div>
      </div>
    );
  }

  const isLoading = isDataLoading && expenses.length === 0;
  const unpaidCount = selectedMonthExpenses.items.filter((e) => !e.paidStatus).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar showAddButton={false} />

      <main className="flex-1 pb-12 lg:pb-6 mb-16 lg:mb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

          {/* ─── Header ─── */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/25">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">ระบบผ่อนจ่าย</h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  เดือนนี้:{" "}
                  <span className="text-violet-400 font-semibold">
                    {formatMonthThai(currentMonth)}
                  </span>{" "}
                  · ผ่อนอยู่{" "}
                  <span className="text-violet-400 font-semibold">{activeCount} รายการ</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center min-h-[44px]"
            >
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              เพิ่มรายการผ่อน
            </button>
          </div>

          {/* ─── Summary Cards ─── */}
          <div className="mb-8">
            <SummaryCards
              thisMonthTotal={thisMonthSummary.totalAmount}
              nextMonthTotal={nextMonthSummary.totalAmount}
              activeItemCount={activeCount}
              thisMonthPaid={thisMonthPaid.paidAmount}
              isLoading={isLoading}
            />
          </div>

          {/* ─── Chart ─── */}
          <div className="mb-8">
            <ExpenseChart data={chartData} currentMonth={currentMonth} isLoading={isLoading} />
          </div>

          {/* ─── List Section ─── */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">

            {/* Section header */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">รายการผ่อนชำระ</h3>
                <p className="text-xs text-slate-500">
                  {selectedMonthExpenses.items.length} รายการ
                </p>
              </div>

              {/* Pay All button */}
              {unpaidCount > 0 && (
                <button
                  onClick={handlePayAll}
                  disabled={isDataLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 border border-emerald-500/20 transition-all hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50 w-full sm:w-auto min-h-[44px]"
                >
                  {isDataLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  ชำระทั้งหมด ({unpaidCount})
                </button>
              )}
            </div>

            {/* Filters row */}
            <div className="mb-5 flex flex-col sm:flex-row gap-3">
              {/* Month selector */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setFilterCategory("all");
                  }}
                  className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 [color-scheme:dark] min-h-[44px]"
                >
                  {displayMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthThai(m)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 sm:flex-none rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 [color-scheme:dark] min-h-[44px]"
              >
                <option value="all">ทุกหมวดหมู่ ({selectedMonthExpenses.items.length})</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({selectedMonthExpenses.items.filter((e) => e.category === cat).length})
                  </option>
                ))}
              </select>
            </div>

            {/* List */}
            <InstallmentList
              expenses={filteredExpenses}
              isLoading={isLoading}
              onMarkPaid={markPaid}
              onDelete={deleteExpense}
            />
          </div>

        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-6 mb-16 lg:mb-0">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-slate-600">
            Expense Tracker &copy; {new Date().getFullYear()} &middot; Built with Next.js + Tailwind CSS
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
