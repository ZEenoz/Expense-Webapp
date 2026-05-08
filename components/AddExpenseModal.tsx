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

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSubmit,
}: AddExpenseModalProps) {
  const { user } = useAuth();
  const { categories, fetchCategories, addCategory } = useSettings(user?.userId);
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    itemName: "",
    totalPrice: 0,
    totalInstallments: 1,
    startMonth: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    category: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedItemName, setSavedItemName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchCategories();
    }
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

  const monthlyPayment =
    formData.totalInstallments > 0
      ? formData.totalPrice / formData.totalInstallments
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setSavedItemName(formData.itemName);
      setShowSuccess(true);

      // Reset form
      setFormData({
        itemName: "",
        totalPrice: 0,
        totalInstallments: 1,
        startMonth: new Date().toISOString().slice(0, 7),
        category: "",
      });

      // Auto-close after 2.5 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2500);
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      {/* Modal */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-lg animate-scale-in rounded-3xl border border-white/[0.08] bg-slate-900/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl"
        style={{ maxHeight: "calc(100vh - 40px)" }}
      >
        {/* Close button */}
        <button
          id="close-modal-btn"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ─── Success State ─── */}
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            {/* Animated circle background */}
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" style={{ animationDuration: "1.5s" }} />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-xl shadow-emerald-500/30 animate-success-bounce">
                <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Success text */}
            <h3 className="text-2xl font-bold text-white mb-2 animate-fade-in-up animation-delay-200">
              Saved to Sheet!
            </h3>
            <div className="flex items-center gap-2 animate-fade-in-up animation-delay-300">
              <Sheet className="h-4 w-4 text-emerald-400" />
              <p className="text-sm text-slate-400">
                บันทึก <span className="font-semibold text-emerald-400">&ldquo;{savedItemName}&rdquo;</span> สำเร็จ
              </p>
            </div>

            {/* Progress bar auto-close */}
            <div className="mt-6 w-48 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-progress-bar" />
            </div>
            <p className="mt-2 text-xs text-slate-600">ปิดอัตโนมัติ...</p>
          </div>
        ) : (
          /* ─── Form State ─── */
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <h2 className="text-xl font-bold text-white">เพิ่มรายการผ่อนใหม่</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">Add a new installment item</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="item-name" className="mb-1.5 block text-sm font-medium text-slate-300">ชื่อรายการ *</label>
                <input
                  id="item-name"
                  type="text"
                  required
                  placeholder="เช่น MacBook Pro, iPhone..."
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="total-price" className="mb-1.5 block text-sm font-medium text-slate-300">ราคารวม (฿) *</label>
                  <input
                    id="total-price"
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalPrice || ""}
                    onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
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
                    value={formData.totalInstallments || ""}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start-month" className="mb-1.5 block text-sm font-medium text-slate-300">เดือนเริ่มต้น *</label>
                  <input
                    id="start-month"
                    type="month"
                    required
                    value={formData.startMonth}
                    onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-slate-300">หมวดหมู่</label>
                  <div className="flex gap-2">
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20 [color-scheme:dark]"
                    >
                      <option value="" className="bg-slate-900">ไม่ระบุ</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="เพิ่มหมวดหมู่ใหม่..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={isAddingCategory || !newCategory.trim()}
                      className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/30 disabled:opacity-50"
                    >
                      {isAddingCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {formData.totalPrice > 0 && formData.totalInstallments > 0 && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-violet-300">ยอดต่อเดือน</span>
                    <span className="text-xl font-bold text-white">
                      ฿{monthlyPayment.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-violet-400">
                    × {formData.totalInstallments} งวด (
                    {formData.startMonth} →{" "}
                    {(() => {
                      const [y, m] = formData.startMonth.split("-").map(Number);
                      const endDate = new Date(y, m - 1 + formData.totalInstallments - 1);
                      return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}`;
                    })()}
                    )
                  </p>
                </div>
              )}

              <button
                id="submit-expense-btn"
                type="submit"
                disabled={isSubmitting || !formData.itemName || !formData.totalPrice}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </span>
                ) : (
                  "บันทึกรายการ"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
