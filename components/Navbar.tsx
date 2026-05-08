"use client";

import { Plus, Receipt, Settings, Settings2, Settings2Icon, Wrench } from "lucide-react";
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

          {/* User Profile & Add Button */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-white">
                    {user.displayName}
                    {process.env.NEXT_PUBLIC_SKIP_LIFF === "true" && (
                      <span className="ml-2 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-500 border border-amber-500/30">
                        Dev Mode
                      </span>
                    )}
                  </p>
                  <button
                    onClick={logout}
                    className="text-[10px] text-slate-400 hover:text-red-400 transition-colors"
                  >
                    Logout
                  </button>
                </div>
                {user.pictureUrl && (
                  <img
                    src={user.pictureUrl}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full border border-white/20"
                  />
                )}
              </div>
            )}

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
              title="การตั้งค่าแจ้งเตือน"
            >
              <Settings className="h-5 w-5" />
            </button>

            <button
              id="add-expense-btn"
              onClick={onAddClick}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              <span className="hidden sm:inline">เพิ่มรายการ</span>
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
