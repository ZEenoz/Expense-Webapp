"use client";

import { useState } from "react";
import { Expense } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Check, Loader2, Trash2, Undo2, MoreVertical } from "lucide-react";

interface ExpenseTableProps {
  expenses: Expense[];
  monthLabel: string;
  isLoading: boolean;
  onMarkPaid: (rowIndex: number, paid: boolean) => Promise<boolean | void>;
  onDelete?: (rowIndex: number) => Promise<boolean | void>;
}

export default function ExpenseTable({
  expenses,
  monthLabel,
  isLoading,
  onMarkPaid,
  onDelete,
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
      <div className="animate-fade-in-up animation-delay-400 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 sm:p-6 backdrop-blur-xl">
        <div className="mb-6 h-5 w-48 animate-pulse rounded bg-white/10" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
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
    <div className="animate-fade-in-up animation-delay-400 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 sm:p-6 backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
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
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
            <CreditCard className="h-8 w-8 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-400">ไม่มีรายการในเดือนนี้</h3>
          <p className="mt-1 text-sm text-slate-600">No expenses for this month</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {unpaid.map((expense, index) => (
            <ExpenseItem
              key={`unpaid-${expense.itemName}-${expense.currentInstallment}-${index}`}
              expense={expense}
              isPaying={payingRowIndex === expense.rowIndex}
              showSuccess={showPaymentSuccess === expense.rowIndex}
              onMarkPaid={handleMarkPaid}
              onDelete={onDelete}
            />
          ))}

          {paid.length > 0 && unpaid.length > 0 && (
            <div className="flex items-center gap-4 py-3">
              <div className="h-px flex-1 bg-emerald-500/20" />
              <span className="text-xs font-semibold text-emerald-400/60 uppercase tracking-wider">จ่ายแล้ว ({paid.length})</span>
              <div className="h-px flex-1 bg-emerald-500/20" />
            </div>
          )}

          {paid.map((expense, index) => (
            <ExpenseItem
              key={`paid-${expense.itemName}-${expense.currentInstallment}-${index}`}
              expense={expense}
              isPaying={payingRowIndex === expense.rowIndex}
              showSuccess={false}
              onMarkPaid={handleMarkPaid}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseItem({
  expense,
  isPaying,
  showSuccess,
  onMarkPaid,
  onDelete,
}: {
  expense: Expense;
  isPaying: boolean;
  showSuccess: boolean;
  onMarkPaid: (rowIndex: number, paid: boolean) => Promise<boolean | void> | void;
  onDelete?: (rowIndex: number) => Promise<boolean | void> | void;
}) {
  const progress = (expense.currentInstallment / expense.totalInstallments) * 100;
  const isPaid = expense.paidStatus;

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-2xl border border-white/[0.06] p-3 sm:p-4 transition-all duration-200 hover:border-white/10 ${
        isPaid
          ? "bg-emerald-500/[0.02] border-emerald-500/10 opacity-60"
          : showSuccess
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm sm:text-base font-bold shadow-sm ${
          isPaid
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-gradient-to-br from-violet-500/15 to-blue-500/15 text-violet-400"
        }`}
      >
        {isPaid ? <Check className="h-5 w-5 sm:h-6 sm:w-6" /> : expense.itemName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm sm:text-base font-semibold leading-tight ${isPaid ? "text-slate-400 line-through" : "text-white"}`}>
              {expense.itemName}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {expense.category && (
                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ${
                  isPaid ? "bg-slate-800 text-slate-500" : "bg-violet-500/15 text-violet-300"
                }`}>
                  {expense.category}
                </span>
              )}
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                งวดที่ {expense.currentInstallment}/{expense.totalInstallments}
              </span>
              
              {/* Progress Bar (Visible on desktop) */}
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Progress Bar (Visible on mobile) */}
            <div className="mt-2 flex items-center gap-2 sm:hidden">
              <div className="h-1.5 w-full max-w-[100px] overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Amount */}
          <div className="flex-shrink-0 text-right">
            <p className={`text-sm sm:text-base font-bold tracking-tight ${isPaid ? "text-slate-500 line-through" : "text-white"}`}>
              {formatCurrency(expense.monthlyPayment)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium">
              รวม {formatCurrency(expense.totalPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 ml-1 sm:ml-4">
        <PayButton
          expense={expense}
          isPaying={isPaying}
          showSuccess={showSuccess}
          onMarkPaid={onMarkPaid}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function PayButton({
  expense,
  isPaying,
  showSuccess,
  onMarkPaid,
  onDelete,
}: {
  expense: Expense;
  isPaying: boolean;
  showSuccess: boolean;
  onMarkPaid: (rowIndex: number, paid: boolean) => Promise<boolean | void> | void;
  onDelete?: (rowIndex: number) => Promise<boolean | void> | void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleDelete = async () => {
    if (window.confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
      setIsDeleting(true);
      await onDelete?.(expense.rowIndex!);
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  if (typeof expense.rowIndex !== "number") return null;

  const renderPay = () => {
    if (showSuccess) {
      return (
        <div className="flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 sm:px-4 animate-success-bounce">
          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
          <span className="text-[11px] sm:text-xs font-bold text-emerald-400">Paid!</span>
        </div>
      );
    }

    if (expense.paidStatus) {
      return (
        <button
          onClick={() => onMarkPaid(expense.rowIndex!, false)}
          disabled={isPaying || isDeleting}
          className="flex h-9 sm:h-10 min-w-[70px] sm:min-w-[80px] items-center justify-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-[11px] sm:text-xs font-bold text-emerald-400 transition-all hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 group/btn disabled:opacity-50"
          title="ยกเลิกการจ่าย"
        >
          {isPaying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover/btn:hidden" />
              <Undo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden group-hover/btn:block" />
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
        disabled={isPaying || isDeleting}
        className="flex h-9 sm:h-10 min-w-[70px] sm:min-w-[80px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
      >
        {isPaying ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>จ่ายแล้ว</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {renderPay()}
      
      {/* Delete Button - Hidden on mobile, shown in menu. Wait, let's keep it visible on mobile to match the screenshot! */}
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting || isPaying}
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
          title="ลบรายการ"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
