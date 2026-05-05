"use client";

import { useState } from "react";
import { Expense } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Check, Loader2, Undo2 } from "lucide-react";

interface ExpenseTableProps {
  expenses: Expense[];
  monthLabel: string;
  isLoading: boolean;
  onMarkPaid: (rowIndex: number, paid: boolean) => Promise<void>;
}

export default function ExpenseTable({
  expenses,
  monthLabel,
  isLoading,
  onMarkPaid,
}: ExpenseTableProps) {
  const [payingRowIndex, setPayingRowIndex] = useState<number | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState<number | null>(null);

  const handleMarkPaid = async (rowIndex: number, paid: boolean) => {
    setPayingRowIndex(rowIndex);
    try {
      await onMarkPaid(rowIndex, paid);
      if (paid) {
        setShowPaymentSuccess(rowIndex);
        setTimeout(() => setShowPaymentSuccess(null), 1500);
      }
    } finally {
      setPayingRowIndex(null);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in-up animation-delay-400 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-xl">
        <div className="mb-6 h-5 w-48 animate-pulse rounded bg-white/10" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  const unpaid = expenses.filter((e) => !e.paidStatus);
  const paid = expenses.filter((e) => e.paidStatus);
  const totalAmount = expenses.reduce((s, e) => s + e.monthlyPayment, 0);
  const paidAmount = paid.reduce((s, e) => s + e.monthlyPayment, 0);

  return (
    <div className="animate-fade-in-up animation-delay-400 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            รายการเดือน{monthLabel}
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {expenses.length} items · Total:{" "}
            <span className="font-semibold text-violet-400">
              {formatCurrency(totalAmount)}
            </span>
            {paidAmount > 0 && (
              <span className="ml-2 text-emerald-400">
                · จ่ายแล้ว {formatCurrency(paidAmount)}
              </span>
            )}
          </p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <CreditCard className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">ไม่มีรายการในเดือนนี้</p>
          <p className="mt-1 text-xs text-slate-600">No expenses for this month</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Mobile Cards View */}
          <div className="space-y-3 sm:hidden">
            {/* Unpaid items first */}
            {unpaid.map((expense, index) => (
              <MobileCard
                key={`unpaid-${expense.itemName}-${expense.currentInstallment}-${index}`}
                expense={expense}
                isPaying={payingRowIndex === expense.rowIndex}
                showSuccess={showPaymentSuccess === expense.rowIndex}
                onMarkPaid={handleMarkPaid}
              />
            ))}
            {/* Paid items */}
            {paid.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-px flex-1 bg-emerald-500/20" />
                  <span className="text-xs font-medium text-emerald-400/60">จ่ายแล้ว ({paid.length})</span>
                  <div className="h-px flex-1 bg-emerald-500/20" />
                </div>
                {paid.map((expense, index) => (
                  <MobileCard
                    key={`paid-${expense.itemName}-${expense.currentInstallment}-${index}`}
                    expense={expense}
                    isPaying={payingRowIndex === expense.rowIndex}
                    showSuccess={false}
                    onMarkPaid={handleMarkPaid}
                  />
                ))}
              </>
            )}
          </div>

          {/* Desktop Table View */}
          <table className="hidden w-full sm:table">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">รายการ</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">งวด</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Progress</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">ยอดจ่าย</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">ราคารวม</th>
                <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {/* Unpaid first */}
              {unpaid.map((expense, index) => (
                <DesktopRow
                  key={`unpaid-${expense.itemName}-${expense.currentInstallment}-${index}`}
                  expense={expense}
                  isPaying={payingRowIndex === expense.rowIndex}
                  showSuccess={showPaymentSuccess === expense.rowIndex}
                  onMarkPaid={handleMarkPaid}
                />
              ))}
              {/* Paid divider */}
              {paid.length > 0 && unpaid.length > 0 && (
                <tr>
                  <td colSpan={6} className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-emerald-500/20" />
                      <span className="text-xs font-medium text-emerald-400/60">จ่ายแล้ว ({paid.length})</span>
                      <div className="h-px flex-1 bg-emerald-500/20" />
                    </div>
                  </td>
                </tr>
              )}
              {/* Paid items */}
              {paid.map((expense, index) => (
                <DesktopRow
                  key={`paid-${expense.itemName}-${expense.currentInstallment}-${index}`}
                  expense={expense}
                  isPaying={payingRowIndex === expense.rowIndex}
                  showSuccess={false}
                  onMarkPaid={handleMarkPaid}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.08]">
                <td colSpan={3} className="pt-4 text-sm font-semibold text-slate-400">รวมทั้งหมด</td>
                <td className="pt-4 text-right text-lg font-bold text-white">{formatCurrency(totalAmount)}</td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Mobile Card ─── */
function MobileCard({
  expense,
  isPaying,
  showSuccess,
  onMarkPaid,
}: {
  expense: Expense;
  isPaying: boolean;
  showSuccess: boolean;
  onMarkPaid: (rowIndex: number, paid: boolean) => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        expense.paidStatus
          ? "border-emerald-500/20 bg-emerald-500/5 opacity-70"
          : showSuccess
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`font-semibold ${expense.paidStatus ? "text-slate-400 line-through" : "text-white"}`}>
          {expense.itemName}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${expense.paidStatus ? "text-slate-500 line-through" : "text-white"}`}>
            {formatCurrency(expense.monthlyPayment)}
          </span>
          <PayButton
            expense={expense}
            isPaying={isPaying}
            showSuccess={showSuccess}
            onMarkPaid={onMarkPaid}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">งวดที่</span>
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-300">
            {expense.currentInstallment}/{expense.totalInstallments}
          </span>
        </div>
        <div className="flex-1 mx-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700"
              style={{ width: `${(expense.currentInstallment / expense.totalInstallments) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Desktop Row ─── */
function DesktopRow({
  expense,
  isPaying,
  showSuccess,
  onMarkPaid,
}: {
  expense: Expense;
  isPaying: boolean;
  showSuccess: boolean;
  onMarkPaid: (rowIndex: number, paid: boolean) => void;
}) {
  const progress = (expense.currentInstallment / expense.totalInstallments) * 100;

  return (
    <tr
      className={`group transition-all duration-300 ${
        expense.paidStatus
          ? "opacity-60"
          : showSuccess
          ? "bg-emerald-500/10"
          : "hover:bg-white/[0.03]"
      }`}
    >
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
              expense.paidStatus
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-violet-400"
            }`}
          >
            {expense.paidStatus ? <Check className="h-4 w-4" /> : expense.itemName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className={`font-medium ${expense.paidStatus ? "text-slate-400 line-through" : "text-white"}`}>
              {expense.itemName}
            </p>
            {expense.category && <p className="text-xs text-slate-500">{expense.category}</p>}
          </div>
        </div>
      </td>
      <td className="py-4 pr-4">
        <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-300">
          {expense.currentInstallment}/{expense.totalInstallments}
        </span>
      </td>
      <td className="py-4 pr-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
        </div>
      </td>
      <td className="py-4 pr-4 text-right">
        <span className={`font-semibold ${expense.paidStatus ? "text-slate-500 line-through" : "text-white"}`}>
          {formatCurrency(expense.monthlyPayment)}
        </span>
      </td>
      <td className="py-4 pr-4 text-right">
        <span className="text-sm text-slate-400">{formatCurrency(expense.totalPrice)}</span>
      </td>
      <td className="py-4 text-center">
        <PayButton
          expense={expense}
          isPaying={isPaying}
          showSuccess={showSuccess}
          onMarkPaid={onMarkPaid}
        />
      </td>
    </tr>
  );
}

/* ─── Pay Button ─── */
function PayButton({
  expense,
  isPaying,
  showSuccess,
  onMarkPaid,
}: {
  expense: Expense;
  isPaying: boolean;
  showSuccess: boolean;
  onMarkPaid: (rowIndex: number, paid: boolean) => void;
}) {
  if (typeof expense.rowIndex !== "number") return null;

  if (showSuccess) {
    return (
      <div className="flex h-8 items-center justify-center gap-1 rounded-lg bg-emerald-500/20 px-3 animate-success-bounce">
        <Check className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-emerald-400">Paid!</span>
      </div>
    );
  }

  if (expense.paidStatus) {
    return (
      <button
        onClick={() => onMarkPaid(expense.rowIndex!, false)}
        disabled={isPaying}
        className="flex h-8 items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-400 transition-all hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 group/btn disabled:opacity-50"
        title="ยกเลิกการจ่าย"
      >
        {isPaying ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Check className="h-3.5 w-3.5 group-hover/btn:hidden" />
            <Undo2 className="h-3.5 w-3.5 hidden group-hover/btn:block" />
            <span className="group-hover/btn:hidden">จ่ายแล้ว</span>
            <span className="hidden group-hover/btn:inline">ยกเลิก</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => onMarkPaid(expense.rowIndex!, true)}
      disabled={isPaying}
      className="flex h-8 items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-3 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 hover:brightness-110 active:scale-95 disabled:opacity-50"
    >
      {isPaying ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>จ่ายแล้ว</span>
        </>
      )}
    </button>
  );
}
