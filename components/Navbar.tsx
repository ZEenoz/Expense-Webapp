"use client";

import { Plus, Receipt } from "lucide-react";

interface NavbarProps {
  onAddClick: () => void;
}

export default function Navbar({ onAddClick }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/25">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Installment Dashboard
            </h1>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
              ระบบติดตามรายจ่ายผ่อนชำระ
            </p>
          </div>
        </div>

        {/* Add Button */}
        <button
          id="add-expense-btn"
          onClick={onAddClick}
          className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
          <span className="hidden sm:inline">เพิ่มรายการ</span>
        </button>
      </div>
    </nav>
  );
}
