"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  ChevronDown,
  Wallet,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { Transaction } from "@/types/transaction";
import { formatDateThai } from "@/lib/transactionUtils";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (rowIndex: number) => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:     "💵 เงินสด",
  transfer: "🏦 โอนเงิน",
  credit:   "💳 เครดิต",
  debit:    "💳 เดบิต",
  other:    "📝 อื่นๆ",
};

const PAGE_SIZE = 15;

export default function TransactionList({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleDelete = async (rowIndex: number) => {
    if (!confirm("ต้องการลบรายการนี้ใช่ไหม?")) return;
    setOpenMenuId(null);
    setDeletingId(rowIndex);
    await onDelete(rowIndex);
    setDeletingId(null);
  };

  const handleEdit = (tx: Transaction) => {
    setOpenMenuId(null);
    onEdit(tx);
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
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16 text-center px-4">
        <div className="mb-4 rounded-full bg-slate-800 p-4">
          <Wallet className="h-10 w-10 text-slate-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-400">ยังไม่มีรายการ</h3>
        <p className="mt-1 text-sm text-slate-600">กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มบันทึก</p>
      </div>
    );
  }

  const visible = transactions.slice(0, visibleCount);
  const hasMore = visibleCount < transactions.length;

  return (
    <div className="space-y-2.5">
      {visible.map((tx, idx) => {
        const isIncome = tx.type === "income";
        const isDeleting = deletingId === tx.rowIndex;
        const isMenuOpen = openMenuId === tx.rowIndex;

        return (
          <div
            key={`${tx.rowIndex}-${idx}`}
            className={`group relative flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04] ${
              isDeleting ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {/* Type Icon */}
            <div className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl ${
              isIncome ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}>
              {isIncome ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white leading-tight">
                    {tx.description || tx.category}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
                      isIncome ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                    }`}>
                      {tx.category}
                    </span>
                    {tx.paymentMethod && PAYMENT_METHOD_LABELS[tx.paymentMethod] && (
                      <span className="hidden sm:inline text-[10px] text-slate-500">
                        {PAYMENT_METHOD_LABELS[tx.paymentMethod]}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-600">{formatDateThai(tx.date)}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex-shrink-0 text-right">
                  <p className={`text-sm sm:text-base font-bold ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
                    {isIncome ? "+" : "-"}฿{tx.amount.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions
                Desktop: show on hover
                Mobile: always-visible ⋮ menu button */}
            <div className="flex-shrink-0 flex items-center">
              {/* Desktop hover buttons */}
              <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleEdit(tx)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                  title="แก้ไข"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(tx.rowIndex!)}
                  disabled={isDeleting}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
                  title="ลบ"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Mobile: ⋮ button — always visible */}
              <div className="relative sm:hidden">
                <button
                  onClick={() => setOpenMenuId(isMenuOpen ? null : tx.rowIndex ?? null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 active:bg-white/10 active:text-white transition-colors"
                  aria-label="เมนูเพิ่มเติม"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-2xl border border-white/10 bg-slate-800 p-1.5 shadow-2xl animate-scale-in">
                      <button
                        onClick={() => handleEdit(tx)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 active:bg-white/10 min-h-[44px]"
                      >
                        <Pencil className="h-4 w-4 flex-shrink-0" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(tx.rowIndex!)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/15 min-h-[44px]"
                      >
                        <Trash2 className="h-4 w-4 flex-shrink-0" />
                        ลบ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-3.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/[0.05] hover:text-white active:bg-white/[0.08] min-h-[48px]"
        >
          <ChevronDown className="h-4 w-4" />
          โหลดเพิ่มเติม ({transactions.length - visibleCount} รายการ)
        </button>
      )}
    </div>
  );
}
