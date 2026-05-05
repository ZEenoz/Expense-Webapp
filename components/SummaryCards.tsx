"use client";

import { Wallet, CalendarClock, Package, CircleCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  thisMonthTotal: number;
  nextMonthTotal: number;
  activeItemCount: number;
  thisMonthPaid: number;
  isLoading: boolean;
}

interface CardConfig {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Wallet;
  gradient: string;
  iconBg: string;
  shadowColor: string;
  delay: string;
}

export default function SummaryCards({
  thisMonthTotal,
  nextMonthTotal,
  activeItemCount,
  thisMonthPaid,
  isLoading,
}: SummaryCardsProps) {
  const remaining = thisMonthTotal - thisMonthPaid;

  const cards: CardConfig[] = [
    {
      id: "this-month-total",
      title: "ยอดค้างจ่ายเดือนนี้",
      value: formatCurrency(remaining),
      subtitle: remaining <= 0 && thisMonthTotal > 0 ? "✅ จ่ายครบแล้ว!" : `จ่ายแล้ว ${formatCurrency(thisMonthPaid)} / ${formatCurrency(thisMonthTotal)}`,
      icon: remaining <= 0 && thisMonthTotal > 0 ? CircleCheck : Wallet,
      gradient: remaining <= 0 && thisMonthTotal > 0 ? "from-emerald-500/15 to-green-500/5" : "from-violet-500/15 to-purple-500/5",
      iconBg: remaining <= 0 && thisMonthTotal > 0 ? "from-emerald-500 to-green-600" : "from-violet-500 to-purple-600",
      shadowColor: remaining <= 0 && thisMonthTotal > 0 ? "shadow-emerald-500/10" : "shadow-violet-500/10",
      delay: "animation-delay-0",
    },
    {
      id: "next-month-total",
      title: "ยอดเดือนหน้า",
      value: formatCurrency(nextMonthTotal),
      subtitle: "Total next month",
      icon: CalendarClock,
      gradient: "from-blue-500/15 to-cyan-500/5",
      iconBg: "from-blue-500 to-cyan-600",
      shadowColor: "shadow-blue-500/10",
      delay: "animation-delay-100",
    },
    {
      id: "active-items",
      title: "รายการที่ผ่อนอยู่",
      value: `${activeItemCount} รายการ`,
      subtitle: "Active installments",
      icon: Package,
      gradient: "from-amber-500/15 to-orange-500/5",
      iconBg: "from-amber-500 to-orange-600",
      shadowColor: "shadow-amber-500/10",
      delay: "animation-delay-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${card.gradient} p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:scale-[1.02] ${card.shadowColor} shadow-xl animate-fade-in-up ${card.delay}`}
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-400">
                  {card.title}
                </p>
                {isLoading ? (
                  <div className="h-8 w-32 animate-pulse rounded-lg bg-white/10" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-white">
                    {card.value}
                  </p>
                )}
                <p className="text-xs text-slate-500">{card.subtitle}</p>
              </div>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.iconBg} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
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
