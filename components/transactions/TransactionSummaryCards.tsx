"use client";

import { TrendingUp, TrendingDown, Scale } from "lucide-react";

interface TransactionSummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  isLoading: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function TransactionSummaryCards({
  totalIncome,
  totalExpense,
  balance,
  isLoading,
}: TransactionSummaryCardsProps) {
  const isPositive = balance >= 0;

  const cards = [
    {
      id: "total-income",
      title: "รายรับทั้งหมด",
      value: formatCurrency(totalIncome),
      subtitle: "Income",
      icon: TrendingUp,
      gradient: "from-emerald-500/15 to-teal-500/5",
      iconGradient: "from-emerald-500 to-teal-600",
      valueColor: "text-emerald-400",
      shadowColor: "shadow-emerald-500/10",
      delay: "animation-delay-0",
    },
    {
      id: "total-expense",
      title: "รายจ่ายทั้งหมด",
      value: formatCurrency(totalExpense),
      subtitle: "Expense",
      icon: TrendingDown,
      gradient: "from-red-500/15 to-pink-500/5",
      iconGradient: "from-red-500 to-pink-600",
      valueColor: "text-red-400",
      shadowColor: "shadow-red-500/10",
      delay: "animation-delay-100",
    },
    {
      id: "balance",
      title: "คงเหลือสุทธิ",
      value: formatCurrency(Math.abs(balance)),
      subtitle: isPositive ? "รายรับมากกว่ารายจ่าย" : "รายจ่ายมากกว่ารายรับ",
      icon: Scale,
      gradient: isPositive
        ? "from-blue-500/15 to-violet-500/5"
        : "from-orange-500/15 to-red-500/5",
      iconGradient: isPositive
        ? "from-blue-500 to-violet-600"
        : "from-orange-500 to-red-600",
      valueColor: isPositive ? "text-blue-400" : "text-orange-400",
      shadowColor: isPositive ? "shadow-blue-500/10" : "shadow-orange-500/10",
      delay: "animation-delay-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${card.gradient} p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:scale-[1.02] ${card.shadowColor} shadow-xl animate-fade-in-up ${card.delay}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400">{card.title}</p>
                {isLoading ? (
                  <div className="h-8 w-32 animate-pulse rounded-lg bg-white/10" />
                ) : (
                  <p className={`text-2xl font-bold tracking-tight ${card.valueColor}`}>
                    {card.value}
                  </p>
                )}
                <p className="text-xs text-slate-500">{card.subtitle}</p>
              </div>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.iconGradient} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
