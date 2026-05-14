"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Transaction } from "@/types/transaction";
import { getMonthlyChartData } from "@/lib/transactionUtils";

interface TransactionChartProps {
  transactions: Transaction[];
  isLoading: boolean;
}

function formatBaht(value: number) {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`;
  return `฿${value.toLocaleString("th-TH")}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl">
      <p className="mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-6 mb-1">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-400">
              {entry.name === "income" ? "รายรับ" : entry.name === "expense" ? "รายจ่าย" : "คงเหลือ"}
            </span>
          </div>
          <span className="text-sm font-bold text-white">
            {formatBaht(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TransactionChart({
  transactions,
  isLoading,
}: TransactionChartProps) {
  const chartData = getMonthlyChartData(transactions, 6);

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
    );
  }

  const hasData = chartData.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">ภาพรวม 6 เดือน</h3>
          <p className="text-xs text-slate-500">รายรับ vs รายจ่าย</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">รายรับ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-slate-400">รายจ่าย</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-48 items-center justify-center text-slate-600 text-sm">
          ยังไม่มีข้อมูลสำหรับแสดงกราฟ
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4} barCategoryGap="30%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatBaht}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar
              dataKey="income"
              name="income"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="expense"
              name="expense"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
