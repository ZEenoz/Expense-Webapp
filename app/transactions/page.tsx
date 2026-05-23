"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Wallet, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction, TransactionFilters, TransactionFormData } from "@/types/transaction";
import {
  getTransactionSummary,
  getUniqueCategories,
} from "@/lib/transactionUtils";

import TransactionSummaryCards from "@/components/transactions/TransactionSummaryCards";
import TransactionFiltersComponent from "@/components/transactions/TransactionFilters";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionChart from "@/components/transactions/TransactionChart";
import TransactionForm from "@/components/transactions/TransactionForm";
import Navbar from "@/components/Navbar";

type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export default function TransactionsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    transactions,
    isLoading,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({ type: "all" });
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");

  useEffect(() => {
    if (user?.userId) {
      fetchTransactions();
    }
  }, [fetchTransactions, user?.userId]);

  // Derived: filtered + sorted transactions
  const { filteredTransactions, summary } = useMemo(() => {
    const summary = getTransactionSummary(transactions, filters);

    const sorted = [...summary.transactions].sort((a, b) => {
      switch (sortKey) {
        case "date_desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date_asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount_desc":
          return b.amount - a.amount;
        case "amount_asc":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return { filteredTransactions: sorted, summary };
  }, [transactions, filters, sortKey]);

  // All unique categories for filter dropdown
  const allCategories = useMemo(
    () => getUniqueCategories(transactions),
    [transactions]
  );

  // Current month summary (always shown in cards)
  const currentMonthSummary = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return getTransactionSummary(transactions, {
      startDate: `${monthPrefix}-01`,
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0],
    });
  }, [transactions]);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const handleFormSubmit = async (data: TransactionFormData) => {
    if (editingTransaction?.rowIndex !== undefined) {
      await updateTransaction(editingTransaction.rowIndex, data);
    } else {
      await addTransaction(data);
    }
  };

  // Auth loading
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-slate-400 animate-pulse">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar showAddButton={false} />

      <main className="flex-1 pb-12 lg:pb-6 mb-16 lg:mb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

          {/* ─── Header ─── */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  รายรับรายจ่าย
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  เดือนนี้: รายรับ{" "}
                  <span className="text-emerald-400 font-semibold">
                    ฿{currentMonthSummary.totalIncome.toLocaleString("th-TH")}
                  </span>{" "}
                  · รายจ่าย{" "}
                  <span className="text-red-400 font-semibold">
                    ฿{currentMonthSummary.totalExpense.toLocaleString("th-TH")}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFormOpen(true)}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              เพิ่มรายการ
            </button>
          </div>

          {/* ─── Summary Cards (current month) ─── */}
          <div className="mb-8">
            <TransactionSummaryCards
              totalIncome={currentMonthSummary.totalIncome}
              totalExpense={currentMonthSummary.totalExpense}
              balance={currentMonthSummary.balance}
              isLoading={isLoading && transactions.length === 0}
            />
          </div>

          {/* ─── Chart ─── */}
          <div className="mb-8">
            <TransactionChart
              transactions={transactions}
              isLoading={isLoading && transactions.length === 0}
            />
          </div>

          {/* ─── Transaction List Section ─── */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            {/* Section Header */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">รายการทั้งหมด</h3>
                <p className="text-xs text-slate-500">
                  {transactions.length} รายการ
                </p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 [color-scheme:dark]"
                >
                  <option value="date_desc">วันที่ล่าสุด</option>
                  <option value="date_asc">วันที่เก่าสุด</option>
                  <option value="amount_desc">จำนวนมาก → น้อย</option>
                  <option value="amount_asc">จำนวนน้อย → มาก</option>
                </select>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-5">
              <TransactionFiltersComponent
                filters={filters}
                categories={allCategories}
                onFiltersChange={setFilters}
                totalCount={transactions.length}
                filteredCount={filteredTransactions.length}
              />
            </div>

            {/* List */}
            <TransactionList
              transactions={filteredTransactions}
              isLoading={isLoading && transactions.length === 0}
              onEdit={handleEdit}
              onDelete={deleteTransaction}
            />
          </div>
        </div>
      </main>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={
          editingTransaction
            ? {
                type: editingTransaction.type,
                amount: editingTransaction.amount,
                category: editingTransaction.category,
                description: editingTransaction.description,
                date: editingTransaction.date,
                paymentMethod: editingTransaction.paymentMethod,
                tags: editingTransaction.tags,
                rowIndex: editingTransaction.rowIndex,
              }
            : undefined
        }
        mode={editingTransaction ? "edit" : "add"}
      />
    </div>
  );
}
