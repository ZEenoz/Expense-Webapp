"use client";

import { useState, useEffect } from "react";
import {
  Settings, Bell, BellOff, User, Tag, Info,
  Calendar, Save, Loader2, Plus, X, LogOut,
  ExternalLink, ChevronRight, Check, Shield
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/context/ToastContext";

// ─── Section wrapper ─────────────────────────────────────────
function Section({
  title, subtitle, icon: Icon, iconColor, children,
}: {
  title: string; subtitle?: string;
  icon: any; iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden animate-fade-in-up">
      {/* Section header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Toggle row ──────────────────────────────────────────────
function ToggleRow({
  label, sub, enabled, onChange,
}: {
  label: string; sub?: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        aria-checked={enabled}
        role="switch"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all duration-300 ${
          enabled ? "bg-violet-500" : "bg-slate-700"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function SettingsPage() {
  const { user, isAdmin, logout, isLoading: isAuthLoading } = useAuth();
  const {
    categories, userConfig,
    isLoading: isSettingsLoading,
    fetchCategories, addCategory, fetchConfig, saveConfig,
  } = useSettings(user?.userId);

  // ── Notification state ──
  const [isNotifyEnabled, setIsNotifyEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState<number[]>([1]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [isTestingNotify, setIsTestingNotify] = useState(false);
  const { showToast } = useToast();

  // ── Category state ──
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      fetchConfig();
      fetchCategories();
    }
  }, [user?.userId, fetchConfig, fetchCategories]);

  useEffect(() => {
    if (userConfig) {
      setIsNotifyEnabled(userConfig.isNotifyEnabled);
      setReminderDays(userConfig.reminderDays || [1]);
    }
  }, [userConfig]);

  const handleSaveNotification = async () => {
    setIsSaving(true);
    const ok = await saveConfig({ reminderDays, isNotifyEnabled });
    if (ok) {
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    }
    setIsSaving(false);
  };

  const toggleDay = (day: number) => {
    setReminderDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day].sort((a,b) => a-b)
    );
  };

  const handleTestNotify = async () => {
    setIsTestingNotify(true);
    try {
      const res = await fetch("/api/notify/test", {
        method: "POST",
        headers: { "x-user-id": user?.userId || "" }
      });
      const data = await res.json();
      if (data.success) {
        showToast("ส่งข้อความทดสอบสำเร็จ เช็ค LINE ได้เลยครับ", "success");
      } else {
        showToast(`ส่งข้อความไม่สำเร็จ: ${data.error}`, "error");
      }
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
    }
    setIsTestingNotify(false);
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setIsAddingCat(true);
    await addCategory(trimmed);
    setNewCategoryName("");
    setIsAddingCat(false);
  };

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
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

          {/* ─── Page Header ─── */}
          <div className="mb-8 flex items-center gap-3 animate-fade-in-up">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">ตั้งค่า</h2>
              <p className="mt-0.5 text-sm text-slate-400">จัดการการตั้งค่าและข้อมูลส่วนตัว</p>
            </div>
          </div>

          <div className="space-y-5">

            {/* ══════════════════════════════════════════
                1. โปรไฟล์
            ══════════════════════════════════════════ */}
            <Section
              title="โปรไฟล์"
              subtitle="ข้อมูลบัญชีผู้ใช้จาก LINE"
              icon={User}
              iconColor="bg-blue-500/20 text-blue-400"
            >
              {user ? (
                <div className="space-y-4">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-4">
                    {user.pictureUrl ? (
                      <img
                        src={user.pictureUrl}
                        alt={user.displayName}
                        className="h-16 w-16 rounded-2xl border-2 border-white/10 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-violet-500/20 flex items-center justify-center text-2xl font-bold text-violet-400 border-2 border-violet-500/30 flex-shrink-0">
                        {user.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">LINE Account</p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        เชื่อมต่อแล้ว
                      </span>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">LINE User ID</p>
                    <p className="text-xs font-mono text-slate-400 break-all">{user.userId}</p>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 active:scale-[0.98] min-h-[48px]"
                  >
                    <LogOut className="h-4 w-4" />
                    ออกจากระบบ
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">ไม่พบข้อมูลผู้ใช้</p>
              )}
            </Section>

            {/* ══════════════════════════════════════════
                2. การแจ้งเตือน
            ══════════════════════════════════════════ */}
            <Section
              title="การแจ้งเตือน"
              subtitle="ตั้งค่าการแจ้งเตือนผ่าน LINE"
              icon={Bell}
              iconColor="bg-violet-500/20 text-violet-400"
            >
              {isSettingsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                </div>
              ) : (
                <div className="space-y-5">
                  <ToggleRow
                    label="แจ้งเตือนผ่าน LINE"
                    sub="ส่งสรุปยอดค้างชำระอัตโนมัติ"
                    enabled={isNotifyEnabled}
                    onChange={setIsNotifyEnabled}
                  />

                  {isNotifyEnabled && (
                    <div className="space-y-4 animate-fade-in-up">
                      <div className="h-px bg-white/[0.06]" />

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                          <Calendar className="h-4 w-4 text-violet-400" />
                          วันที่แจ้งเตือนทุกเดือน (เลือกได้หลายวัน)
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5, 10, 15, 20, 25, 28].map((day) => {
                          const isSelected = reminderDays.includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => toggleDay(day)}
                              className={`flex h-11 min-w-[44px] flex-1 items-center justify-center rounded-xl border text-sm font-semibold transition-all ${
                                isSelected
                                  ? "border-violet-500 bg-violet-500/20 text-white shadow-lg shadow-violet-500/10"
                                  : "border-white/[0.08] bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 active:bg-white/10"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                        <p className="text-xs text-amber-300 leading-relaxed">
                          💡 แนะนำให้ตั้งเตือน <strong>วันที่ 1</strong> สำหรับรายการที่ต้องจ่ายต้นเดือน
                          ระบบจะหยุดเตือนทันทีที่กด "ชำระแล้ว"
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveNotification}
                    disabled={isSaving}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 min-h-[48px] ${
                      savedOk
                        ? "bg-gradient-to-r from-emerald-600 to-green-600 shadow-emerald-500/25"
                        : "bg-gradient-to-r from-violet-600 to-blue-600 shadow-violet-500/25"
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : savedOk ? (
                      <><Check className="h-4 w-4" /> บันทึกแล้ว!</>
                    ) : (
                      <><Save className="h-4 w-4" /> บันทึกการตั้งค่า</>
                    )}
                  </button>

                  {isAdmin && (
                    <div className="mt-6 animate-fade-in-up">
                      <div className="h-px bg-white/[0.06] mb-6" />
                      <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-violet-400 flex items-center gap-2">
                              <Shield className="h-4 w-4" /> เมนูสำหรับผู้ดูแลระบบ (Admin)
                            </p>
                            <p className="text-xs text-slate-400 mt-1">ทดสอบระบบแจ้งเตือน (ระบบจะส่งข้อความเข้า LINE ของคุณทันที)</p>
                          </div>
                          <button
                            onClick={handleTestNotify}
                            disabled={isTestingNotify}
                            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-500/20 px-4 py-2.5 text-sm font-semibold text-violet-400 hover:bg-violet-500/30 transition-all disabled:opacity-50"
                          >
                            {isTestingNotify ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                            ทดสอบแจ้งเตือน
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* ══════════════════════════════════════════
                3. หมวดหมู่ผ่อนจ่าย
            ══════════════════════════════════════════ */}
            <Section
              title="หมวดหมู่ผ่อนจ่าย"
              subtitle="จัดการหมวดหมู่สำหรับรายการผ่อนชำระ"
              icon={Tag}
              iconColor="bg-emerald-500/20 text-emerald-400"
            >
              <div className="space-y-4">
                {/* Add new */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ชื่อหมวดหมู่ใหม่..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                    className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={isAddingCat || !newCategoryName.trim()}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/30 active:bg-emerald-500/40 disabled:opacity-50 transition-all flex-shrink-0 min-h-[48px]"
                  >
                    {isAddingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="hidden sm:inline">เพิ่ม</span>
                  </button>
                </div>

                {/* Category list */}
                {categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-300"
                      >
                        <Tag className="h-3 w-3 text-slate-500" />
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 text-center py-4">
                    ยังไม่มีหมวดหมู่ — เพิ่มหมวดหมู่แรกได้เลยครับ
                  </p>
                )}
              </div>
            </Section>

            {/* ══════════════════════════════════════════
                4. เกี่ยวกับแอป
            ══════════════════════════════════════════ */}
            <Section
              title="เกี่ยวกับแอป"
              subtitle="ข้อมูลระบบและเวอร์ชัน"
              icon={Info}
              iconColor="bg-slate-500/20 text-slate-400"
            >
              <div className="space-y-1">
                {[
                  { label: "เวอร์ชัน",       value: "1.0.0"                    },
                  { label: "Framework",      value: "Next.js 16 + Tailwind CSS" },
                  { label: "ฐานข้อมูล",      value: "Google Sheets"            },
                  { label: "Authentication", value: "LINE LIFF"                 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-sm font-medium text-slate-300">{value}</span>
                  </div>
                ))}
              </div>
            </Section>

          </div>
        </div>
      </main>
    </div>
  );
}
