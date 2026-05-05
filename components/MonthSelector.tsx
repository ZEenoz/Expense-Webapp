"use client";

import { ChevronDown } from "lucide-react";
import { formatMonthLabel } from "@/lib/utils";

interface MonthSelectorProps {
  months: string[];
  selectedMonth: string;
  onChange: (month: string) => void;
}

export default function MonthSelector({
  months,
  selectedMonth,
  onChange,
}: MonthSelectorProps) {
  return (
    <div className="relative inline-flex items-center">
      <select
        id="month-selector"
        value={selectedMonth}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-4 pr-10 text-sm font-medium text-white outline-none transition-all hover:border-white/20 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 [color-scheme:dark]"
      >
        {months.map((month) => (
          <option key={month} value={month} className="bg-slate-900">
            {formatMonthLabel(month)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
    </div>
  );
}
