"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, Scale, CreditCard, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import { useTransactions } from "@/hooks/useTransactions";
import {
  getTransactionSummary,
  getMonthlyChartData,
  getTransactionsByCategory,
  formatCurrency,
} from "@/lib/transactionUtils";
import { getCurrentMonth, getMonthSummary, getChartData } from "@/lib/utils";

// ─── Palette ────────────────────────────────────────────────
const PIE_COLORS = [
  "#8b5cf6","#3b82f6","#10b981","#f59e0b","#ef4444",
  "#06b6d4","#ec4899","#84cc16","#f97316","#6366f1",
];

// ─── Helpers ────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency", currency: "THB",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

function fmtBaht(v: number) {
  if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `฿${(v / 1_000).toFixed(0)}K`;
  return `฿${v.toLocaleString("th-TH")}`;
}

// ─── Custom Tooltip ─────────────────────────────────────────
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl text-xs">
      <p className="mb-2 font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center justify-between gap-6 mb-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="text-slate-400">
              {e.name === "income" ? "รายรับ" : e.name === "expense" ? "รายจ่าย" : e.name === "installment" ? "ผ่อนจ่าย" : e.name}
            </span>
          </div>
          <span className="font-bold text-white">{fmtBaht(e.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-white">{payload[0].name}</p>
      <p className="text-slate-400">{fmtBaht(payload[0].value)}</p>
    </div>
  );
}

// ─── Summary Card ────────────────────────────────────────────
function StatCard({
  title, value, sub, icon: Icon, gradient, iconGradient, valueColor, delay,
}: {
  title: string; value: string; sub: string;
  icon: any; gradient: string; iconGradient: string; valueColor: string; delay: string;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${gradient} p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:scale-[1.02] shadow-xl animate-fade-in-up ${delay}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</p>
          <p className="text-xs text-slate-500 truncate">{sub}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconGradient} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ml-3`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function ReportsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { expenses, isLoading: expLoading, fetchExpenses } = useExpenses(user?.userId);
  const { transactions, isLoading: txLoading, fetchTransactions } = useTransactions(user?.userId);

  const [activeTab, setActiveTab] = useState<"overview" | "installments" | "transactions">("overview");

  useEffect(() => {
    if (user?.userId) {
      fetchExpenses();
      fetchTransactions();
    }
  }, [fetchExpenses, fetchTransactions, user?.userId]);

  const isLoading = (expLoading || txLoading) && expenses.length === 0 && transactions.length === 0;

  // ── Derived: Transactions ──
  const txSummary = useMemo(() => getTransactionSummary(transactions), [transactions]);
  const txMonthly = useMemo(() => getMonthlyChartData(transactions, 6), [transactions]);
  const expenseByCategory = useMemo(() => getTransactionsByCategory(transactions, "expense"), [transactions]);
  const incomeByCategory  = useMemo(() => getTransactionsByCategory(transactions, "income"),  [transactions]);

  // ── Derived: Installments ──
  const currentMonth = getCurrentMonth();
  const installmentMonthly = useMemo(() => getChartData(expenses, currentMonth, 6), [expenses, currentMonth]);
  const thisMonthInstallment = useMemo(() => getMonthSummary(expenses, currentMonth), [expenses, currentMonth]);
  const totalInstallmentDebt = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.itemName)))
      .reduce((sum, name) => {
        const item = expenses.find((e) => e.itemName === name);
        return sum + (item?.totalPrice ?? 0);
      }, 0),
    [expenses]
  );
  const activeInstallments = useMemo(
    () => new Set(expenses.filter((e) => e.dueMonth >= currentMonth).map((e) => e.itemName)).size,
    [expenses, currentMonth]
  );

  // ── Pie data ──
  const expensePieData = useMemo(
    () => Object.entries(expenseByCategory)
      .map(([name, d]) => ({ name, value: d.total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    [expenseByCategory]
  );
  const incomePieData = useMemo(
    () => Object.entries(incomeByCategory)
      .map(([name, d]) => ({ name, value: d.total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    [incomeByCategory]
  );

  // ── Combined monthly (installment + expense) ──
  const combinedMonthly = useMemo(() => {
    return txMonthly.map((m, i) => ({
      month: m.month,
      income: m.income,
      expense: m.expense,
      installment: installmentMonthly[i]?.amount ?? 0,
    }));
  }, [txMonthly, installmentMonthly]);

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
          <div className="mb-8 flex items-center gap-3 animate-fade-in-up">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">รายงาน</h2>
              <p className="mt-0.5 text-sm text-slate-400">ภาพรวมการเงินทั้งหมด</p>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <div className="mb-6 flex rounded-2xl border border-white/10 bg-slate-900/50 p-1 gap-1">
            {([
              { key: "overview",      label: "ภาพรวม"       },
              { key: "installments",  label: "ผ่อนจ่าย"     },
              { key: "transactions",  label: "รายรับรายจ่าย" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all min-h-[44px] ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white shadow-sm"
                    : "text-slate-400 hover:text-white active:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
              ))}
            </div>
          ) : (
            <>
              {/* ══════════════════════════════════════════════
                  TAB: ภาพรวม
              ══════════════════════════════════════════════ */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Summary cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="รายรับทั้งหมด" value={fmt(txSummary.totalIncome)}
                      sub={`${txSummary.incomeCount} รายการ`}
                      icon={TrendingUp} gradient="from-emerald-500/15 to-teal-500/5"
                      iconGradient="from-emerald-500 to-teal-600" valueColor="text-emerald-400"
                      delay="animation-delay-0"
                    />
                    <StatCard
                      title="รายจ่ายทั้งหมด" value={fmt(txSummary.totalExpense)}
                      sub={`${txSummary.expenseCount} รายการ`}
                      icon={TrendingDown} gradient="from-red-500/15 to-pink-500/5"
                      iconGradient="from-red-500 to-pink-600" valueColor="text-red-400"
                      delay="animation-delay-100"
                    />
                    <StatCard
                      title="คงเหลือสุทธิ" value={fmt(Math.abs(txSummary.balance))}
                      sub={txSummary.balance >= 0 ? "รายรับมากกว่า" : "รายจ่ายมากกว่า"}
                      icon={Scale} gradient="from-blue-500/15 to-violet-500/5"
                      iconGradient="from-blue-500 to-violet-600"
                      valueColor={txSummary.balance >= 0 ? "text-blue-400" : "text-orange-400"}
                      delay="animation-delay-200"
                    />
                    <StatCard
                      title="ผ่อนจ่ายเดือนนี้" value={fmt(thisMonthInstallment.totalAmount)}
                      sub={`${activeInstallments} รายการที่ผ่อนอยู่`}
                      icon={CreditCard} gradient="from-violet-500/15 to-purple-500/5"
                      iconGradient="from-violet-500 to-purple-600" valueColor="text-violet-400"
                      delay="animation-delay-300"
                    />
                  </div>

                  {/* Combined bar chart */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-white">ภาพรวม 6 เดือน</h3>
                      <p className="text-xs text-slate-500">รายรับ · รายจ่าย · ผ่อนจ่าย</p>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={combinedMonthly} barGap={3} barCategoryGap="28%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={fmtBaht} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="income"      name="income"      fill="#10b981" radius={[5,5,0,0]} maxBarSize={32} />
                        <Bar dataKey="expense"     name="expense"     fill="#ef4444" radius={[5,5,0,0]} maxBarSize={32} />
                        <Bar dataKey="installment" name="installment" fill="#8b5cf6" radius={[5,5,0,0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 flex flex-wrap gap-4 justify-center">
                      {[["#10b981","รายรับ"],["#ef4444","รายจ่าย"],["#8b5cf6","ผ่อนจ่าย"]].map(([color, label]) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-xs text-slate-400">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top expense categories */}
                  {expensePieData.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                      <h3 className="mb-4 text-sm font-semibold text-white">หมวดหมู่รายจ่ายสูงสุด</h3>
                      <div className="space-y-3">
                        {expensePieData.slice(0, 5).map((item, i) => {
                          const pct = txSummary.totalExpense > 0 ? (item.value / txSummary.totalExpense) * 100 : 0;
                          return (
                            <div key={item.name}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                                  <span className="text-sm text-slate-300 truncate max-w-[160px]">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                                  <span className="text-sm font-semibold text-white">{fmt(item.value)}</span>
                                </div>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i] }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  TAB: ผ่อนจ่าย
              ══════════════════════════════════════════════ */}
              {activeTab === "installments" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard
                      title="ผ่อนจ่ายเดือนนี้" value={fmt(thisMonthInstallment.totalAmount)}
                      sub={`${thisMonthInstallment.items.length} รายการ`}
                      icon={CreditCard} gradient="from-violet-500/15 to-purple-500/5"
                      iconGradient="from-violet-500 to-purple-600" valueColor="text-violet-400"
                      delay="animation-delay-0"
                    />
                    <StatCard
                      title="รายการที่ผ่อนอยู่" value={`${activeInstallments} รายการ`}
                      sub="Active installments"
                      icon={Wallet} gradient="from-blue-500/15 to-cyan-500/5"
                      iconGradient="from-blue-500 to-cyan-600" valueColor="text-blue-400"
                      delay="animation-delay-100"
                    />
                    <StatCard
                      title="มูลค่ารวมทั้งหมด" value={fmt(totalInstallmentDebt)}
                      sub="Total installment value"
                      icon={BarChart3} gradient="from-amber-500/15 to-orange-500/5"
                      iconGradient="from-amber-500 to-orange-600" valueColor="text-amber-400"
                      delay="animation-delay-200"
                    />
                  </div>

                  {/* Installment bar chart */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-white">ยอดผ่อนจ่าย 6 เดือน</h3>
                      <p className="text-xs text-slate-500">Monthly installment forecast</p>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={installmentMonthly} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={fmtBaht} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="amount" name="installment" fill="#8b5cf6" radius={[6,6,0,0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Installment by category */}
                  {expenses.length > 0 && (() => {
                    const byCat: Record<string, number> = {};
                    expenses.forEach((e) => { byCat[e.category || "ไม่ระบุ"] = (byCat[e.category || "ไม่ระบุ"] || 0) + e.monthlyPayment; });
                    const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
                    const total = sorted.reduce((s, [, v]) => s + v, 0);
                    return (
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <h3 className="mb-4 text-sm font-semibold text-white">ผ่อนจ่ายตามหมวดหมู่ (เดือนนี้)</h3>
                        <div className="space-y-3">
                          {sorted.map(([cat, val], i) => {
                            const pct = total > 0 ? (val / total) * 100 : 0;
                            return (
                              <div key={cat}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-sm text-slate-300 truncate max-w-[160px]">{cat}</span>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                                    <span className="text-sm font-semibold text-white">{fmt(val)}</span>
                                  </div>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  TAB: รายรับรายจ่าย
              ══════════════════════════════════════════════ */}
              {activeTab === "transactions" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard
                      title="รายรับทั้งหมด" value={fmt(txSummary.totalIncome)}
                      sub={`${txSummary.incomeCount} รายการ`}
                      icon={TrendingUp} gradient="from-emerald-500/15 to-teal-500/5"
                      iconGradient="from-emerald-500 to-teal-600" valueColor="text-emerald-400"
                      delay="animation-delay-0"
                    />
                    <StatCard
                      title="รายจ่ายทั้งหมด" value={fmt(txSummary.totalExpense)}
                      sub={`${txSummary.expenseCount} รายการ`}
                      icon={TrendingDown} gradient="from-red-500/15 to-pink-500/5"
                      iconGradient="from-red-500 to-pink-600" valueColor="text-red-400"
                      delay="animation-delay-100"
                    />
                    <StatCard
                      title="คงเหลือสุทธิ" value={fmt(Math.abs(txSummary.balance))}
                      sub={txSummary.balance >= 0 ? "รายรับมากกว่ารายจ่าย" : "รายจ่ายมากกว่ารายรับ"}
                      icon={Scale} gradient="from-blue-500/15 to-violet-500/5"
                      iconGradient="from-blue-500 to-violet-600"
                      valueColor={txSummary.balance >= 0 ? "text-blue-400" : "text-orange-400"}
                      delay="animation-delay-200"
                    />
                  </div>

                  {/* Income vs Expense bar chart */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">รายรับ vs รายจ่าย 6 เดือน</h3>
                        <p className="text-xs text-slate-500">Income vs Expense trend</p>
                      </div>
                      <div className="flex gap-4">
                        {[["#10b981","รายรับ"],["#ef4444","รายจ่าย"]].map(([c,l]) => (
                          <div key={l} className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
                            <span className="text-xs text-slate-400">{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={txMonthly} barGap={4} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={fmtBaht} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="income"  name="income"  fill="#10b981" radius={[5,5,0,0]} maxBarSize={36} />
                        <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[5,5,0,0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie charts side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Expense pie */}
                    {expensePieData.length > 0 && (
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <h3 className="mb-4 text-sm font-semibold text-white">รายจ่ายตามหมวดหมู่</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <ResponsiveContainer width={160} height={160}>
                            <PieChart>
                              <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                {expensePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip content={<PieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex-1 space-y-2 w-full">
                            {expensePieData.map((item, i) => (
                              <div key={item.name} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                                  <span className="text-xs text-slate-400 truncate">{item.name}</span>
                                </div>
                                <span className="text-xs font-semibold text-white flex-shrink-0">{fmt(item.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Income pie */}
                    {incomePieData.length > 0 && (
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <h3 className="mb-4 text-sm font-semibold text-white">รายรับตามหมวดหมู่</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <ResponsiveContainer width={160} height={160}>
                            <PieChart>
                              <Pie data={incomePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                {incomePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip content={<PieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex-1 space-y-2 w-full">
                            {incomePieData.map((item, i) => (
                              <div key={item.name} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                                  <span className="text-xs text-slate-400 truncate">{item.name}</span>
                                </div>
                                <span className="text-xs font-semibold text-white flex-shrink-0">{fmt(item.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {expensePieData.length === 0 && incomePieData.length === 0 && (
                      <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                        <div className="mx-auto mb-4 rounded-full bg-slate-800 p-4 w-fit">
                          <Wallet className="h-10 w-10 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium">ยังไม่มีข้อมูลรายรับรายจ่าย</p>
                        <p className="text-slate-600 text-sm mt-1">เพิ่มรายการในหน้ารายรับรายจ่ายก่อนครับ</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
