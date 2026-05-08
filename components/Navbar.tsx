"use client";

import { LogOut, Plus, Receipt, Settings, Settings2, Settings2Icon, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import SettingsModal from "./SettingsModal";

interface NavbarProps {
  onAddClick: () => void;
}

export default function Navbar({ onAddClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
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

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="relative group">
                <button 
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 transition-all hover:bg-white/10"
                >
                  {user.pictureUrl ? (
                    <img
                      src={user.pictureUrl}
                      alt={user.displayName}
                      className="h-7 w-7 rounded-lg border border-white/10"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 border border-violet-500/30">
                      {user.displayName.charAt(0)}
                    </div>
                  )}
                  <div className="hidden md:block text-left pr-1">
                    <p className="text-[11px] font-semibold text-white leading-none">
                      {user.displayName}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-none">
                      Line User
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-2xl border border-white/10 bg-slate-900 p-1.5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">บัญชีผู้ใช้</p>
                    <p className="text-xs font-semibold text-white truncate mt-1">{user.displayName}</p>
                  </div>
                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      การตั้งค่าแจ้งเตือน
                    </button>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Add Button */}
            <button
              id="add-expense-btn"
              onClick={onAddClick}
              className="group hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              <span>เพิ่มรายการ</span>
            </button>

            {/* Mobile Add Button (Icon only) */}
            <button
              onClick={onAddClick}
              className="flex sm:hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
