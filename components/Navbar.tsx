"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Plus, Receipt, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onAddClick?: () => void;
  showAddButton?: boolean;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "ระบบผ่อนจ่าย", subtitle: "ติดตามรายจ่ายผ่อนชำระทั้งหมดของคุณ" },
  "/transactions": { title: "รายรับรายจ่าย", subtitle: "จัดการรายรับและรายจ่ายประจำวัน" },
  "/reports": { title: "รายงาน", subtitle: "วิเคราะห์และสรุปข้อมูลการเงิน" },
  "/settings": { title: "ตั้งค่า", subtitle: "จัดการการตั้งค่าและข้อมูลส่วนตัว" },
};

export default function Navbar({ onAddClick, showAddButton = true }: NavbarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageInfo = PAGE_TITLES[pathname] ?? PAGE_TITLES["/"];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-30 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">

          {/* Mobile: Logo + hamburger */}
          <div className="flex items-center gap-3 lg:hidden min-w-0">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
              aria-label="เมนู"
              className="mr-1 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/25">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-base font-bold text-white tracking-tight truncate">
              {pageInfo.title}
            </h1>
          </div>

          {/* Desktop: Page title (dynamic) */}
          <div className="hidden lg:block min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight">{pageInfo.title}</h1>
            <p className="text-xs text-slate-400 -mt-0.5">{pageInfo.subtitle}</p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

            {/* User profile — click/tap to open dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 transition-all hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 min-h-[44px]"
                >
                  {user.pictureUrl ? (
                    <img
                      src={user.pictureUrl}
                      alt={user.displayName}
                      className="h-7 w-7 rounded-lg border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 border border-violet-500/30 flex-shrink-0">
                      {user.displayName.charAt(0)}
                    </div>
                  )}
                  <div className="hidden md:block text-left pr-1">
                    <p className="text-[11px] font-semibold text-white leading-none max-w-[120px] truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Line User</p>
                  </div>
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 origin-top-right rounded-2xl border border-white/10 bg-slate-900 p-1.5 shadow-2xl z-50 animate-scale-in">
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">บัญชีผู้ใช้</p>
                      <p className="text-xs font-semibold text-white truncate mt-1">{user.displayName}</p>
                    </div>
                    <div className="p-1 space-y-1 mt-1">
                      <button
                        onClick={() => { logout(); setIsDropdownOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 active:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 min-h-[44px]"
                      >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add button — desktop */}
            {showAddButton && onAddClick && (
              <button
                id="add-expense-btn"
                onClick={onAddClick}
                className="group hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 min-h-[44px]"
              >
                <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                <span>เพิ่มรายการ</span>
              </button>
            )}

            {/* Add button — mobile */}
            {showAddButton && onAddClick && (
              <button
                onClick={onAddClick}
                aria-label="เพิ่มรายการ"
                className="flex sm:hidden h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}