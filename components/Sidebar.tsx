"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  ChevronLeft,
  Receipt,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onLinkClick?: () => void;
}

const menuItems = [
  { name: "Installments", href: "/",            icon: CreditCard,      label: "ระบบผ่อนจ่าย"   },
  { name: "Transactions", href: "/transactions", icon: Wallet,          label: "รายรับรายจ่าย"  },
  { name: "Reports",      href: "/reports",      icon: BarChart3,       label: "รายงาน"         },
  { name: "Settings",     href: "/settings",     icon: Settings,        label: "ตั้งค่า"         },
];

export default function Sidebar({ isOpen, onToggle, onLinkClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-full flex flex-col
          bg-slate-900/95 backdrop-blur-xl border-r border-white/10
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"}
        `}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/25 flex-shrink-0">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "w-auto opacity-100" : "w-0 opacity-0 lg:hidden"}`}>
              <h2 className="text-sm font-bold text-white whitespace-nowrap">Expense Tracker</h2>
              <p className="text-[10px] text-slate-400 whitespace-nowrap">ระบบจัดการการเงิน</p>
            </div>
          </div>

          {/* Toggle — desktop only */}
          <button
            onClick={onToggle}
            aria-label={isOpen ? "ย่อ sidebar" : "ขยาย sidebar"}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white flex-shrink-0"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onLinkClick}
                    aria-current={isActive ? "page" : undefined}
                    className={`
                      group relative flex items-center gap-3 rounded-xl px-3 py-3
                      transition-all duration-200 min-h-[44px]
                      ${isActive
                        ? "bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-white shadow-lg shadow-violet-500/10"
                        : "text-slate-400 hover:bg-white/5 hover:text-white active:bg-white/10"
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-violet-500 to-blue-500" />
                    )}

                    <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />

                    <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden lg:hidden"}`}>
                      {item.label}
                    </span>

                    {/* Tooltip — collapsed desktop */}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-3 hidden lg:group-hover:block z-50">
                        <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white shadow-xl border border-white/10 whitespace-nowrap">
                          {item.label}
                        </div>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3 flex-shrink-0">
          <div className={`flex items-center gap-3 rounded-xl bg-white/5 p-3 ${!isOpen ? "lg:justify-center" : ""}`}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">ET</span>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 lg:hidden"}`}>
              <p className="text-xs font-semibold text-white whitespace-nowrap">Expense Tracker</p>
              <p className="text-[10px] text-slate-500 whitespace-nowrap">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
