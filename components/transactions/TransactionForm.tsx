"use client";

import { useState, useEffect } from "react";
import { X, Loader2, TrendingUp, TrendingDown, CheckCircle2, Plus } from "lucide-react";
import {
  TransactionFormData,
  TransactionType,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from "@/types/transaction";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  initialData?: TransactionFormData & { rowIndex?: number };
  mode?: "add" | "edit";
}

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = (): TransactionFormData => ({
  type: "expense",
  amount: 0,
  category: "",
  description: "",
  date: today(),
  paymentMethod: "cash",
  tags: [],
});

export default function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "add",
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData
        ? { type: initialData.type, amount: initialData.amount, category: initialData.category,
            description: initialData.description, date: initialData.date,
            paymentMethod: initialData.paymentMethod, tags: initialData.tags || [] }
        : emptyForm()
      );
      setShowSuccess(false);
      setNewCategory("");
    }
  }, [isOpen, initialData]);

  const defaultCategories = formData.type === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  const allCategories = [...defaultCategories.map((c) => c.name), ...customCategories];

  const handleAddCustomCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || allCategories.includes(trimmed)) return;
    setCustomCategories((prev) => [...prev, trimmed]);
    setFormData((prev) => ({ ...prev, category: trimmed }));
    setNewCategory("");
  };

  const handleTypeChange = (type: TransactionType) => {
    setFormData((prev) => ({ ...prev, type, category: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.date) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      if (mode === "add") {
        setShowSuccess(true);
        setTimeout(() => { setShowSuccess(false); onClose(); setFormData(emptyForm()); }, 2000);
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isIncome = formData.type === "income";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Sheet on mobile (slides from bottom), centered modal on sm+ */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg sm:mx-4 animate-scale-in
          rounded-t-3xl sm:rounded-3xl
          border border-white/[0.08] bg-slate-900/98 shadow-2xl shadow-black/50 backdrop-blur-xl
          overflow-y-auto"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white active:bg-white/15 z-10"
          aria-label="ปิด"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 pb-6 pt-4 sm:p-6">
          {/* ─── Success ─── */}
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-xl shadow-emerald-500/30 animate-success-bounce">
                  <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">บันทึกสำเร็จ!</h3>
              <p className="text-sm text-slate-400 text-center">
                {isIncome ? "เพิ่มรายรับ" : "เพิ่มรายจ่าย"}{" "}
                <span className={`font-semibold ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
                  ฿{formData.amount.toLocaleString("th-TH")}
                </span>{" "}
                เรียบร้อยแล้ว
              </p>
              <div className="mt-6 w-48 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-progress-bar" />
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-5 pr-8">
                <h2 className="text-xl font-bold text-white">
                  {mode === "edit" ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  {mode === "edit" ? "Edit transaction" : "Add new transaction"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  {(["income", "expense"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeChange(type)}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition-all min-h-[48px] ${
                        formData.type === type
                          ? type === "income"
                            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/10"
                            : "border-red-500/50 bg-red-500/15 text-red-400 shadow-lg shadow-red-500/10"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white active:bg-white/10"
                      }`}
                    >
                      {type === "income" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {type === "income" ? "รายรับ" : "รายจ่าย"}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">จำนวนเงิน (฿) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none">฿</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={formData.amount || ""}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-8 pr-4 py-3.5 text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20 text-lg font-semibold"
                    />
                  </div>
                </div>

                {/* Category chips */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">หมวดหมู่ *</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allCategories.map((cat) => {
                      const defaultCat = defaultCategories.find((c) => c.name === cat);
                      const isSelected = formData.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat })}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all min-h-[36px] ${
                            isSelected
                              ? isIncome
                                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                                : "border-red-500/50 bg-red-500/20 text-red-300"
                              : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15"
                          }`}
                        >
                          {defaultCat?.icon && <span className="text-sm">{defaultCat.icon}</span>}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  {/* Add custom */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เพิ่มหมวดหมู่ใหม่..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomCategory(); } }}
                      className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      disabled={!newCategory.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-violet-500/20 px-3 py-2.5 text-xs font-medium text-violet-300 hover:bg-violet-500/30 active:bg-violet-500/40 disabled:opacity-50 transition-all flex-shrink-0 min-h-[44px]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">เพิ่ม</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">รายละเอียด</label>
                  <input
                    type="text"
                    placeholder="เช่น ค่าอาหารกลางวัน, เงินเดือนเดือนมกราคม..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                {/* Date + Payment Method */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">วันที่ *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20 [color-scheme:dark] min-h-[52px]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">วิธีชำระเงิน</label>
                    <select
                      value={formData.paymentMethod || "cash"}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-800 px-4 py-3.5 text-white outline-none transition-all focus:border-violet-500/50 [color-scheme:dark] min-h-[52px]"
                    >
                      {PAYMENT_METHODS.map((pm) => (
                        <option key={pm.value} value={pm.value}>{pm.icon} {pm.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {formData.amount > 0 && formData.category && (
                  <div className={`rounded-xl border p-4 ${isIncome ? "border-emerald-500/20 bg-emerald-500/10" : "border-red-500/20 bg-red-500/10"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isIncome ? <TrendingUp className="h-4 w-4 text-emerald-400 flex-shrink-0" /> : <TrendingDown className="h-4 w-4 text-red-400 flex-shrink-0" />}
                        <span className={`text-sm font-medium truncate ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
                          {isIncome ? "รายรับ" : "รายจ่าย"} · {formData.category}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-white flex-shrink-0">
                        ฿{formData.amount.toLocaleString("th-TH")}
                      </span>
                    </div>
                    {formData.description && (
                      <p className="mt-1 text-xs text-slate-400 truncate">{formData.description}</p>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.amount || !formData.category || !formData.date}
                  className={`w-full rounded-xl px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 min-h-[52px] ${
                    isIncome
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/25 hover:shadow-emerald-500/40"
                      : "bg-gradient-to-r from-red-600 to-pink-600 shadow-red-500/25 hover:shadow-red-500/40"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </span>
                  ) : mode === "edit" ? "บันทึกการแก้ไข" : isIncome ? "เพิ่มรายรับ" : "เพิ่มรายจ่าย"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
