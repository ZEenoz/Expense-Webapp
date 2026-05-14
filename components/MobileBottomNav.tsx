"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Wallet, BarChart3, Settings } from "lucide-react";

const navItems = [
  { name: "Installments", href: "/",            icon: CreditCard, label: "ผ่อนจ่าย" },
  { name: "Transactions", href: "/transactions", icon: Wallet,     label: "รายการ"   },
  { name: "Reports",      href: "/reports",      icon: BarChart3,  label: "รายงาน"   },
  { name: "Settings",     href: "/settings",     icon: Settings,   label: "ตั้งค่า"   },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    /* nav ครอบ safe area ทั้งหมด รวม background */
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-1 pt-1 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`
                relative flex flex-col items-center justify-center gap-1
                rounded-xl px-3 py-2 flex-1
                min-h-[52px] transition-all duration-200
                ${isActive
                  ? "text-white"
                  : "text-slate-400 active:bg-white/5 active:text-white"
                }
              `}
            >
              {/* Active background pill */}
              {isActive && (
                <div className="absolute inset-x-1 inset-y-0.5 rounded-xl bg-gradient-to-r from-violet-500/20 to-blue-500/20" />
              )}

              <Icon className={`relative h-5 w-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
              <span className="relative text-[10px] font-semibold whitespace-nowrap">{item.label}</span>

              {/* Active dot indicator */}
              {isActive && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
