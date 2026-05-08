"use client";

import { useState, useCallback, useMemo } from "react";
import { Expense } from "@/types/expense";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/context/ToastContext";

export function useExpenses(userId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchExpenses = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    
    const res = await apiClient<Expense[]>("/api/expenses", {}, userId);
    if (res.success && res.data) {
      setExpenses(res.data);
    } else {
      setError(res.error || "Failed to fetch expenses");
    }
    setIsLoading(false);
  }, [userId]);

  const markPaid = useCallback(async (rowIndex: number, paid: boolean) => {
    if (!userId) return false;
    const res = await apiClient("/api/expenses", {
      method: "PATCH",
      body: JSON.stringify({ rowIndex, paid }),
    }, userId);
    
    if (res.success) {
      await fetchExpenses();
      showToast(paid ? "ชำระเงินเรียบร้อยแล้ว" : "ยกเลิกการชำระเงินแล้ว", "success");
      return true;
    } else {
      showToast(res.error || "เกิดข้อผิดพลาด", "error");
      return false;
    }
  }, [userId, fetchExpenses, showToast]);

  const payAll = useCallback(async (rowIndices: number[]) => {
    if (!userId || rowIndices.length === 0) return false;
    const res = await apiClient("/api/expenses", {
      method: "PATCH",
      body: JSON.stringify({ rowIndices, paid: true }),
    }, userId);
    
    if (res.success) {
      await fetchExpenses();
      showToast(`ชำระทั้งหมด ${rowIndices.length} รายการเรียบร้อย`, "success");
      return true;
    } else {
      showToast(res.error || "เกิดข้อผิดพลาด", "error");
      return false;
    }
  }, [userId, fetchExpenses, showToast]);

  const addExpense = useCallback(async (data: any) => {
    if (!userId) return false;
    const res = await apiClient("/api/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }, userId);
    
    if (res.success) {
      await fetchExpenses();
      showToast("บันทึกรายการผ่อนชำระใหม่แล้ว", "success");
      return true;
    } else {
      showToast(res.error || "ไม่สามารถบันทึกได้", "error");
      return false;
    }
  }, [userId, fetchExpenses, showToast]);

  return {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    markPaid,
    payAll,
    addExpense,
  };
}
