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
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch expenses from API
  const fetchExpenses = useCallback(async () => {
    if (!user?.userId) return;
    
    try {
      const res = await fetch("/api/expenses", {
        headers: {
          "x-user-id": user.userId
        }
      });
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (user?.userId) {
      fetchExpenses();
    }
  }, [fetchExpenses, user?.userId]);

  // Handle adding a new expense
  const handleAddExpense = async (formData: ExpenseFormData) => {
    if (!user?.userId) return;

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": user.userId
      },
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
    if (!user?.userId) return;

    const res = await fetch("/api/expenses", {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": user.userId
      },
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
