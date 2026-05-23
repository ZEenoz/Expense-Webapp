"use client";

import { useState, useEffect } from "react";
import { X, Bell, BellOff, Calendar, Save, Loader2, Settings2, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/hooks/useSettings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const { userConfig, fetchConfig, saveConfig, isLoading } = useSettings(user?.userId);

  const [isNotifyEnabled, setIsNotifyEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState<number[]>([1]);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Initial fetch when modal opens
  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchConfig();
    }
  }, [isOpen, user?.userId, fetchConfig]);

  // 2. Sync local state when userConfig changes (from database)
  // OR when modal opens (if we already have the config)
  useEffect(() => {
    if (isOpen && userConfig) {
      setIsNotifyEnabled(userConfig.isNotifyEnabled);
      setReminderDays(userConfig.reminderDays || [1]);
    }
  }, [isOpen, userConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveConfig({ reminderDays, isNotifyEnabled });
    if (success) {
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      {/* Modal - Stop Propagation to prevent closing when clicking inside */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-md flex flex-col animate-scale-in rounded-3xl border border-white/[0.08] bg-slate-900 shadow-2xl shadow-black/50 backdrop-blur-xl"
        style={{ maxHeight: "calc(100vh - 40px)" }}
      >

        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-5 pb-0 sm:p-6 sm:pb-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">การตั้งค่าแจ้งเตือน</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="mt-2 text-sm text-slate-400">กำลังโหลดการตั้งค่า...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Notification Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4 border border-white/5 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isNotifyEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
                    {isNotifyEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">แจ้งเตือนผ่าน LINE</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">ส่งสรุปยอดค้างชำระอัตโนมัติ</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotifyEnabled(!isNotifyEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 ${isNotifyEnabled ? 'bg-violet-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isNotifyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Reminder Day Selection */}
              {isNotifyEnabled && (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <Calendar className="h-4 w-4 text-violet-400" />
                      วันที่ต้องการแจ้งเตือน (เลือกได้หลายวัน)
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 10, 15, 20, 25, 28].map((day) => {
                      const isSelected = reminderDays.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`flex h-10 min-w-[42px] flex-1 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                            isSelected
                              ? 'border-violet-500 bg-violet-500/20 text-white shadow-lg shadow-violet-500/10'
                              : 'border-white/5 bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20">
                    <p className="text-[10px] text-amber-300 leading-relaxed italic">
                      💡 <b>คำแนะนำ:</b> สำหรับรายการที่ต้องจ่ายวันที่ 1-10 (เช่น Shopee)
                      แนะนำให้ตั้งเตือนเป็น<b>วันที่ 1</b> เพื่อให้มีเวลาจัดการ และระบบจะหยุดเตือนทันทีที่คุณกด "ชำระแล้ว" ครับ
                    </p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-violet-500/20 transition-all hover:shadow-violet-500/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                  บันทึกการตั้งค่า
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
