"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartDataPoint } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";

interface ExpenseChartProps {
  data: ChartDataPoint[];
  currentMonth: string;
  isLoading: boolean;
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        <p className="mt-1 text-lg font-bold text-white">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

export default function ExpenseChart({
  data,
  currentMonth,
  isLoading,
}: ExpenseChartProps) {
  if (isLoading) {
    return (
      <div className="animate-fade-in-up animation-delay-300 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-xl">
        <div className="mb-6 h-5 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-[300px] animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up animation-delay-300 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            แนวโน้มรายจ่าย 6 เดือน
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Upcoming expense forecast
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
          <span className="text-xs text-slate-400">Monthly Total</span>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="barGradientCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={56}>
              {data.map((entry) => (
                <Cell
                  key={entry.monthKey}
                  fill={
                    entry.monthKey === currentMonth
                      ? "url(#barGradientCurrent)"
                      : "url(#barGradient)"
                  }
                  className="transition-all duration-300 hover:brightness-125"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
