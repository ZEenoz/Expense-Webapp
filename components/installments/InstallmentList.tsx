"use client";

import { useState } from "react";
import {
  CreditCard, Check, Undo2, Trash2, Loader2,
  ChevronDown, MoreVertical, ChevronRight,
} from "lucide-react";
import { Expense } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";

interface InstallmentListProps {
  expenses: Expense[];
  isLoading: boolean;
  onMarkPaid: (rowIndex: number, paid: boolean) => Promise<boolean | void>;
  onDelete: (rowIndex: number) => Promise<boolean | void>;
}

const PAGE_SIZE = 15;

export default function InstallmentList({
  expenses,
  isLoading,
  onMarkPaid,
  onDelete,
}: InstallmentListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleMarkPaid = async (rowIndex: number, paid: boolean) => {
    setPayingId(rowIndex);
    await onMarkPaid(rowIndex, paid);
    if (paid) {
      setSuccessId(rowIndex);
      setTimeout(() => setSuccessId(null), 1500);
    }
    setPayingId(null);
  };

  const handleDelete = async (rowIndex: number) => {
    setOpenMenuId(null);
    setDeletingId(rowIndex);
    await onDelete(rowIndex);
    setDeletingId(null);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  // Empty state
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16 text-center px-4">
        <div className="mb-4 rounded-full bg-slate-800 p-4">
          <CreditCard className="h-10 w-10 text-slate-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-400">ไม่มีรายการในเดือนนี้</h3>
        <p className="mt-1 text-sm text-slate-500">กดปุ่ม "เพิ่มรายการผ่อน" เพื่อเริ่มต้น</p>
      </div>
    );
  }

  // แยก unpaid / paid
  const unpaid = expenses.filter((e) => !e.paidStatus);
  const paid = expenses.filter((e) => e.paidStatus);
  const ordered = [...unpaid, ...paid];
  const visible = ordered.slice(0, visibleCount);
  const hasMore = visibleCount < ordered.length;

  return (
    <div className="space-y-2.5">
      {visible.map((expense, idx) => {
        const isPaid = expense.paidStatus;
        const isPayingThis = payingId === expense.rowIndex;
        const isSuccessThis = successId === expense.rowIndex;
        const isDeletingThis = deletingId === expense.rowIndex;
        const isMenuOpen = openMenuId === expense.rowIndex;
        const progress = (expense.currentInstallment / expense.totalInstallments) * 100;

        // divider ระหว่าง unpaid / paid
        const showDivider = idx === unpaid.length && paid.length > 0 && unpaid.length > 0;

        return (
          <div key={`${expense.rowIndex}-${idx}`}>
            {/* Divider */}
            {showDivider && (
              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-emerald-500/20" />
                <span className="text-[11px] font-semibold text-emerald-400/60 uppercase tracking-widest">
                  จ่ายแล้ว ({paid.length})
                </span>
                <div className="h-px flex-1 bg-emerald-500/20" />
              </div>
            )}

            {/* Card */}
            <div
              className={`group relative flex items-center gap-3 rounded-2xl border p-3 sm:p-4 transition-all duration-200 ${isDeletingThis
                  ? "opacity-40 pointer-events-none"
                  : isSuccessThis
                    ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                    : isPaid
                      ? "border-white/[0.04] bg-white/[0.01] opacity-60"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
            >
              {/* Icon */}
              <div
                className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${isPaid
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-violet-400"
                  }`}
              >
                {isPaid ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{expense.itemName.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold leading-tight ${isPaid ? "text-slate-400 line-through" : "text-white"}`}>
                      {expense.itemName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {/* งวด badge */}
                      <span className="inline-flex items-center rounded-lg bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-400">
                        งวด {expense.currentInstallment}/{expense.totalInstallments}
                      </span>
                      {/* หมวดหมู่ */}
                      {expense.category && (
                        <span className="inline-flex items-center rounded-lg bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-slate-400">
                          {expense.category}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isPaid
                              ? "bg-emerald-500/60"
                              : "bg-gradient-to-r from-violet-500 to-blue-500"
                            }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 flex-shrink-0 w-8 text-right">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>

                  {/* Amount + Pay button */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <p className={`text-sm sm:text-base font-bold ${isPaid ? "text-slate-500 line-through" : "text-white"}`}>
                      {formatCurrency(expense.monthlyPayment)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      รวม {formatCurrency(expense.totalPrice)}
                    </p>
                  </div>
                </div>

                {/* Pay button row — full width on mobile */}
                <div className="mt-3 flex items-center gap-2">
                  <PayButton
                    expense={expense}
                    isPaying={isPayingThis}
                    showSuccess={isSuccessThis}
                    onMarkPaid={handleMarkPaid}
                  />
                </div>
              </div>

              {/* Actions
                  Desktop: trash icon on hover
                  Mobile: ⋮ menu always visible */}
              <div className="flex-shrink-0 self-start pt-0.5">
                {/* Desktop */}
                <button
                  onClick={() => handleDelete(expense.rowIndex!)}
                  disabled={isDeletingThis}
                  className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:opacity-100"
                  title="ลบรายการ"
                >
                  {isDeletingThis ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>

                {/* Mobile ⋮ */}
                <div className="relative sm:hidden">
                  <button
                    onClick={() => setOpenMenuId(isMenuOpen ? null : expense.rowIndex ?? null)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 active:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                    aria-label="เมนูเพิ่มเติม"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-2xl border border-white/10 bg-slate-800 p-1.5 shadow-2xl animate-scale-in">
                        <button
                          onClick={() => handleDelete(expense.rowIndex!)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/15 min-h-[44px]"
                        >
                          <Trash2 className="h-4 w-4 flex-shrink-0" />
                          ลบรายการ
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-3.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/[0.05] hover:text-white active:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 min-h-[48px]"
        >
          <ChevronDown className="h-4 w-4" />
          โหลดเพิ่มเติม ({ordered.length - visibleCount} รายการ)
        </button>
      )}
    </div>
  );
}

/* ─── Pay Button ─────────────────────────────────────────── */
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
      <div className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 animate-success-bounce">
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
        className="group/btn flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 sm:px-3 text-xs font-medium text-emerald-400 transition-all hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
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
      className="flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 sm:px-3 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 hover:brightness-110 active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
    >
      {isPaying ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <>
          <Check className="h-3.5 w-3.5" />
          จ่ายแล้ว
        </>
      )}
    </button>
  );
}
