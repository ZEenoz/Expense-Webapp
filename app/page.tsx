"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Expense, ExpenseFormData } from "@/types/expense";

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch expenses from API
  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses");
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Handle adding a new expense
  const handleAddExpense = async (formData: ExpenseFormData) => {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const json = await res.json();
    if (json.success) {
      await fetchExpenses();
    } else {
      throw new Error(json.error);
    }
  };

  // Handle marking an installment as paid/unpaid
  const handleMarkPaid = async (rowIndex: number, paid: boolean) => {
    const res = await fetch("/api/expenses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex, paid }),
    });
    const json = await res.json();
    if (json.success) {
      // Optimistic update — toggle paidStatus locally
      setExpenses((prev) =>
        prev.map((e) =>
          e.rowIndex === rowIndex ? { ...e, paidStatus: paid } : e
        )
      );
    } else {
      throw new Error(json.error);
    }
  };

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

  // Ensure selectedMonth is in the month list
  const displayMonths =
    allMonths.length > 0
      ? allMonths
      : [currentMonth, nextMonth];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onAddClick={() => setIsAddModalOpen(true)} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-slate-400">
              สรุปภาพรวมรายจ่ายผ่อนชำระทั้งหมดของคุณ
            </p>
          </div>

          {/* Summary Cards */}
          <div className="mb-8">
            <SummaryCards
              thisMonthTotal={thisMonthSummary.totalAmount}
              nextMonthTotal={nextMonthSummary.totalAmount}
              activeItemCount={activeCount}
              thisMonthPaid={thisMonthPaid.paidAmount}
              isLoading={isLoading}
            />
          </div>

          {/* Chart */}
          <div className="mb-8">
            <ExpenseChart
              data={chartData}
              currentMonth={currentMonth}
              isLoading={isLoading}
            />
          </div>

          {/* Monthly Expenses Table */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between animate-fade-in-up animation-delay-400">
              <div />
              <MonthSelector
                months={displayMonths}
                selectedMonth={selectedMonth}
                onChange={setSelectedMonth}
              />
            </div>
            <ExpenseTable
              expenses={selectedMonthExpenses.items}
              monthLabel={formatMonthThai(selectedMonth)}
              isLoading={isLoading}
              onMarkPaid={handleMarkPaid}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-slate-600">
            Installment Dashboard &copy; {new Date().getFullYear()} &middot;
            Built with Next.js + Tailwind CSS
          </p>
        </div>
      </footer>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddExpense}
      />
    </div>
  );
}
