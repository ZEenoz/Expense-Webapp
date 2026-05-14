"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import type { TransactionFilters } from "@/types/transaction";
import { useState } from "react";

interface TransactionFiltersProps {
  filters: TransactionFilters;
  categories: string[];
  onFiltersChange: (filters: TransactionFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const PERIOD_OPTIONS = [
  { value: "all",   label: "ทั้งหมด"  },
  { value: "today", label: "วันนี้"   },
  { value: "week",  label: "7 วัน"   },
  { value: "month", label: "เดือนนี้" },
  { value: "year",  label: "ปีนี้"   },
];

export default function TransactionFilters({
  filters,
  categories,
  onFiltersChange,
  totalCount,
  filteredCount,
}: TransactionFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters =
    (filters.type && filters.type !== "all") ||
    filters.category ||
    filters.searchQuery ||
    filters.startDate ||
    filters.endDate;

  const clearFilters = () => onFiltersChange({ type: "all" });

  const applyPeriod = (period: string) => {
    if (period === "all") {
      onFiltersChange({ ...filters, startDate: undefined, endDate: undefined });
      return;
    }
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    let startDate = today;

    if (period === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    } else if (period === "month") {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    } else if (period === "year") {
      startDate = `${now.getFullYear()}-01-01`;
    }
    onFiltersChange({ ...filters, startDate, endDate: today });
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="ค้นหารายการ..."
          value={filters.searchQuery || ""}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value || undefined })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/50 pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFiltersChange({ ...filters, searchQuery: undefined })}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-white active:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Row 2: Type Toggle + Advanced button */}
      <div className="flex gap-2">
        {/* Type Toggle — full width on mobile */}
        <div className="flex flex-1 rounded-xl border border-white/10 bg-slate-900/50 p-1 gap-1">
          {(["all", "income", "expense"] as const).map((type) => (
            <button
              key={type}
              onClick={() => onFiltersChange({ ...filters, type })}
              className={`flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all min-h-[40px] ${
                (filters.type || "all") === type
                  ? type === "income"
                    ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                    : type === "expense"
                    ? "bg-red-500/20 text-red-400 shadow-sm"
                    : "bg-white/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-white active:bg-white/5"
              }`}
            >
              {type === "all" ? "ทั้งหมด" : type === "income" ? "รายรับ" : "รายจ่าย"}
            </button>
          ))}
        </div>

        {/* Advanced Filter Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          className={`flex items-center gap-2 rounded-xl border px-3 sm:px-4 py-2.5 text-sm font-medium transition-all min-h-[44px] flex-shrink-0 ${
            showAdvanced || hasActiveFilters
              ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
              : "border-white/10 bg-slate-900/50 text-slate-400 hover:text-white active:bg-white/5"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">ตัวกรอง</span>
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white flex-shrink-0">
              !
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-4 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">หมวดหมู่</label>
              <select
                value={filters.category || ""}
                onChange={(e) => onFiltersChange({ ...filters, category: e.target.value || undefined })}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 [color-scheme:dark] min-h-[44px]"
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">ตั้งแต่วันที่</label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value || undefined })}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 [color-scheme:dark] min-h-[44px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">ถึงวันที่</label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value || undefined })}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 [color-scheme:dark] min-h-[44px]"
              />
            </div>
          </div>

          {/* Quick Period */}
          <div>
            <p className="mb-2 text-xs text-slate-500">ช่วงเวลาด่วน</p>
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => applyPeriod(opt.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-white active:bg-white/15 min-h-[36px]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result count + Clear */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          แสดง <span className="font-semibold text-slate-300">{filteredCount}</span>
          {filteredCount !== totalCount && (
            <> จาก <span className="font-semibold text-slate-300">{totalCount}</span></>
          )}{" "}
          รายการ
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-violet-400 hover:text-violet-300 active:bg-violet-500/10 transition-colors min-h-[32px]"
          >
            <X className="h-3 w-3" />
            ล้างตัวกรอง
          </button>
        )}
      </div>
    </div>
  );
}
