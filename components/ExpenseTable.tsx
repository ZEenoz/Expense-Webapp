"use client";

import { useState } from "react";
import { Expense } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Check, Loader2, Undo2, Trash2 } from "lucide-react";

interface ExpenseTableProps {
  expenses: Expense[];
  monthLabel: string;
  isLoading: boolean;
  onMarkPaid: (rowIndex: number, paid: boolean, rowId?: string) => Promise<boolean | void>;
  onDelete?: (rowIndex: number, rowId?: string) => Promise<boolean | void>;
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

  // Use expense's stable UUID when available; falls back to rowIndex for legacy rows
  const handleMarkPaid = async (rowIndex: number, paid: boolean, rowId?: string) => {
    setPayingRowIndex(rowIndex);
    try {
      await onMarkPaid(rowIndex, paid, rowId);
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
      <div className="animate-fade-in-up animation-delay-400 rounded-2xl border border-surface-border bg-surface p-4 sm:p-6">
        <div className="mb-6 h-5 w-48 animate-pulse rounded bg-text-main/10" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-surface-border bg-surface-hover" />
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
    <div className="animate-fade-in-up animation-delay-400 rounded-2xl border border-surface-border bg-surface p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-text-main">
            รายการเดือน{monthLabel}
          </h2>
          <p className="mt-0.5 text-sm text-text-muted">
            {expenses.length} items · Total:{" "}
            <span className="font-semibold text-primary">
              {formatCurrency(totalAmount)}
            </span>
            {paidAmount > 0 && (
              <span className="ml-2 text-success">
                · จ่ายแล้ว {formatCurrency(paidAmount)}
              </span>
            )}
          </p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-surface-border bg-transparent">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
            <CreditCard className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-text-muted">ไม่มีรายการในเดือนนี้</h3>
          <p className="mt-1 text-sm text-text-muted/60">No expenses for this month</p>
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
              <tr className="border-b border-surface-border">
                <th className="pb-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">รายการ</th>
                <th className="pb-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted hidden lg:table-cell">หมวดหมู่</th>
                <th className="pb-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">งวดที่</th>
                <th className="pb-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">ความคืบหน้า</th>
                <th className="pb-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">ยอดจ่าย</th>
                <th className="pb-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted hidden lg:table-cell">ราคาสุทธิ</th>
                <th className="pb-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
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
                  <td colSpan={7} className="py-2">
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
              <tr className="border-t border-surface-border">
                <td colSpan={4} className="pt-4 text-sm font-semibold text-text-muted">รวมทั้งหมด</td>
                <td className="pt-4 text-right text-lg font-bold text-text-main">{formatCurrency(totalAmount)}</td>
                <td className="hidden lg:table-cell" />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function MobileCard({
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
      className={`rounded-2xl border p-4 transition-all duration-300 ${expense.paidStatus
        ? "border-success-border bg-success-bg opacity-60"
        : showSuccess
          ? "border-success-border bg-success-bg"
          : "border-surface-border bg-surface hover:bg-surface-hover"
        }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${expense.paidStatus
            ? "bg-success-bg text-success"
            : "bg-primary/10 text-primary"
            }`}>
            {expense.paidStatus ? <Check className="h-5 w-5" /> : expense.itemName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className={`font-bold leading-tight ${expense.paidStatus ? "text-text-muted line-through" : "text-text-main"}`}>
              {expense.itemName}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {expense.category && (
                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ${isPaid ? "bg-surface-hover text-text-muted" : "bg-primary/15 text-primary"
                  }`}>
                  {expense.category}
                </span>
              )}
              <span className="text-[10px] sm:text-xs text-text-muted font-medium">
                งวดที่ {expense.currentInstallment}/{expense.totalInstallments}
              </span>

              {/* Progress Bar (Visible on desktop) */}
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-muted">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Progress Bar (Visible on mobile) */}
            <div className="mt-2 flex items-center gap-2 sm:hidden">
              <div className="h-1.5 w-full max-w-[100px] overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-black tracking-tight ${expense.paidStatus ? "text-text-muted line-through" : "text-text-main"}`}>
            {formatCurrency(expense.monthlyPayment)}
          </p>
          <div className="mt-1 flex items-center justify-end gap-1">
            <span className="text-[10px] text-text-muted">งวดที่</span>
            <span className="text-xs font-bold text-primary">
              {expense.currentInstallment}/{expense.totalInstallments}
            </span>
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
  onMarkPaid: (rowIndex: number, paid: boolean) => Promise<boolean | void> | void;
}) {
  const progress = (expense.currentInstallment / expense.totalInstallments) * 100;

  return (
    <tr
      className={`group transition-all duration-300 ${expense.paidStatus
        ? "opacity-60"
        : showSuccess
          ? "bg-emerald-500/10"
          : "hover:bg-white/[0.03]"
        }`}
    >
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${expense.paidStatus
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-violet-500/10 text-violet-400"
              }`}
          >
            {expense.paidStatus ? <Check className="h-5 w-5" /> : expense.itemName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className={`font-semibold ${expense.paidStatus ? "text-slate-400 line-through" : "text-white"}`}>
              {expense.itemName}
            </p>
            {expense.category && <p className="text-[10px] text-slate-500 lg:hidden">{expense.category}</p>}
          </div>
        </div>
      </td>
      <td className="py-4 pr-4 hidden lg:table-cell">
        {expense.category ? (
          <span className="inline-flex items-center rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-400 border border-white/5">
            {expense.category}
          </span>
        ) : (
          <span className="text-slate-600 italic text-xs">-</span>
        )}
      </td>
      <td className="py-4 pr-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-violet-300">
            {expense.currentInstallment}/{expense.totalInstallments}
          </span>
          <div className="h-1 w-12 overflow-hidden rounded-full bg-white/5 md:hidden">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </td>
      <td className="py-4 pr-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 xl:w-32 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-slate-400">{Math.round(progress)}%</span>
        </div>
      </td>
      <td className="py-4 pr-4 text-right">
        <span className={`font-bold ${expense.paidStatus ? "text-slate-500 line-through" : "text-white"}`}>
          {formatCurrency(expense.monthlyPayment)}
        </span>
      </td>
      <td className="py-4 pr-4 text-right hidden lg:table-cell">
        <span className="text-sm font-medium text-slate-400">{formatCurrency(expense.totalPrice)}</span>
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
          className="flex h-9 sm:h-10 min-w-[70px] sm:min-w-[80px] items-center justify-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-[11px] sm:text-xs font-bold text-emerald-400 transition-all hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 group/btn disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
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
        className="flex h-9 sm:h-10 min-w-[70px] sm:min-w-[80px] items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-emerald-400 transition-all active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
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
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          title="ลบรายการ"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
