"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Sparkles, CheckCircle2, Sheet, Plus } from "lucide-react";
import { ExpenseFormData } from "@/types/expense";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/hooks/useSettings";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<boolean | void>;
}

export default function AddExpenseModal({ isOpen, onClose, onSubmit }: AddExpenseModalProps) {
  const { user } = useAuth();
  const { categories, fetchCategories, addCategory } = useSettings();

  const [formData, setFormData] = useState<ExpenseFormData>({
    itemName: "",
    totalPrice: 0,
    totalInstallments: 1,
    startMonth: new Date().toISOString().slice(0, 7),
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedItemName, setSavedItemName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    if (isOpen && user?.userId) fetchCategories();
  }, [isOpen, user?.userId, fetchCategories]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setIsAddingCategory(true);
    const success = await addCategory(newCategory.trim());
    if (success) {
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory("");
    }
    setIsAddingCategory(false);
  };

  const monthlyPayment = formData.totalInstallments > 0 ? formData.totalPrice / formData.totalInstallments : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setSavedItemName(formData.itemName);
      setShowSuccess(true);
      setFormData({ itemName: "", totalPrice: 0, totalInstallments: 1, startMonth: new Date().toISOString().slice(0, 7), category: "" });
      setTimeout(() => { setShowSuccess(false); onClose(); }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => { setShowSuccess(false); onClose(); };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg sm:mx-4 animate-scale-in
          rounded-t-3xl sm:rounded-3xl
          border border-white/[0.08] bg-slate-900/98 shadow-2xl shadow-black/50 backdrop-blur-xl
          overflow-y-auto"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Drag handle — mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Close */}
        <button
          id="close-modal-btn"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white active:bg-white/15 z-10"
          aria-label="ปิด"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 pb-6 pt-4 sm:p-6">
          {/* ─── Success ─── */}
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" style={{ animationDuration: "1.5s" }} />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-xl shadow-emerald-500/30 animate-success-bounce">
                  <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 animate-fade-in-up animation-delay-200">Saved to Sheet!</h3>
              <div className="flex items-center gap-2 animate-fade-in-up animation-delay-300">
                <Sheet className="h-4 w-4 text-emerald-400" />
                <p className="text-sm text-slate-400">
                  บันทึก <span className="font-semibold text-emerald-400">&ldquo;{savedItemName}&rdquo;</span> สำเร็จ
                </p>
              </div>
              <div className="mt-6 w-48 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-progress-bar" />
              </div>
              <p className="mt-2 text-xs text-slate-600">ปิดอัตโนมัติ...</p>
            </div>
          ) : (
            <>
              <div className="mb-5 pr-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  <h2 className="text-xl font-bold text-white">เพิ่มรายการผ่อนใหม่</h2>
                </div>
                <p className="mt-1 text-sm text-slate-400">Add a new installment item</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Item Name */}
                <div>
                  <label htmlFor="item-name" className="mb-1.5 block text-sm font-medium text-slate-300">ชื่อรายการ *</label>
                  <input
                    id="item-name"
                    type="text"
                    required
                    placeholder="เช่น MacBook Pro, iPhone..."
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                {/* Price + Installments */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="total-price" className="mb-1.5 block text-sm font-medium text-slate-300">ราคารวม (฿) *</label>
                    <input
                      id="total-price"
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={formData.totalPrice || ""}
                      onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="installments" className="mb-1.5 block text-sm font-medium text-slate-300">จำนวนงวด *</label>
                    <input
                      id="installments"
                      type="number"
                      required
                      min="1"
                      max="60"
                      inputMode="numeric"
                      value={formData.totalInstallments || ""}
                      onChange={(e) => setFormData({ ...formData, totalInstallments: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                {/* Start Month + Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="start-month" className="mb-1.5 block text-sm font-medium text-slate-300">เดือนเริ่มต้น *</label>
                    <input
                      id="start-month"
                      type="month"
                      required
                      value={formData.startMonth}
                      onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20 [color-scheme:dark] min-h-[52px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-slate-300">หมวดหมู่</label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-800 px-4 py-3.5 text-white outline-none transition-all focus:border-violet-500/50 [color-scheme:dark] min-h-[52px]"
                    >
                      <option value="" className="bg-slate-900">ไม่ระบุ</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add category */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เพิ่มหมวดหมู่ใหม่..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                    className="flex-1 min-w-0 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={isAddingCategory || !newCategory.trim()}
                    className="flex items-center justify-center rounded-xl bg-violet-500/20 px-3 py-2.5 text-xs font-medium text-violet-300 hover:bg-violet-500/30 active:bg-violet-500/40 disabled:opacity-50 min-h-[44px] min-w-[44px]"
                  >
                    {isAddingCategory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Monthly preview */}
                {formData.totalPrice > 0 && formData.totalInstallments > 0 && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-violet-300">ยอดต่อเดือน</span>
                      <span className="text-xl font-bold text-white">
                        ฿{monthlyPayment.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-violet-400">
                      × {formData.totalInstallments} งวด ({formData.startMonth} →{" "}
                      {(() => {
                        const [y, m] = formData.startMonth.split("-").map(Number);
                        const end = new Date(y, m - 1 + formData.totalInstallments - 1);
                        return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`;
                      })()})
                    </p>
                  </div>
                )}

                <button
                  id="submit-expense-btn"
                  type="submit"
                  disabled={isSubmitting || !formData.itemName || !formData.totalPrice}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 min-h-[52px]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </span>
                  ) : "บันทึกรายการ"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
