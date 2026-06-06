"use client";

import { useState, useCallback, useMemo } from "react";
import { Expense } from "@/types/expense";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

export function useExpenses() {
  const { idToken } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchExpenses = useCallback(async () => {
    if (!idToken) return;
    setIsLoading(true);
    setError(null);
    
    const res = await apiClient<Expense[]>("/api/expenses", {}, idToken);
    if (res.success && res.data) {
      setExpenses(res.data);
    } else {
      setError(res.error || "Failed to fetch expenses");
    }
    setIsLoading(false);
  }, [idToken]);

  const markPaid = useCallback(async (rowIndex: number, paid: boolean, rowId?: string) => {
    if (!idToken) return false;
    // Prefer UUID (drift-safe); fall back to rowIndex for legacy rows without UUID
    const body = rowId
      ? { rowId, paid }
      : { rowIndex, paid };
    const res = await apiClient("/api/expenses", {
      method: "PATCH",
      body: JSON.stringify(body),
    }, idToken);
    
    if (res.success) {
      await fetchExpenses();
      showToast(paid ? "ชำระเงินเรียบร้อยแล้ว" : "ยกเลิกการชำระเงินแล้ว", "success");
      return true;
    } else {
      showToast(res.error || "เกิดข้อผิดพลาด", "error");
      return false;
    }
  }, [idToken, fetchExpenses, showToast]);

  const payAll = useCallback(async (rowIndices: number[], rowIds?: string[]) => {
    if (!idToken || rowIndices.length === 0) return false;
    // Prefer UUIDs when available
    const body = (rowIds && rowIds.length > 0)
      ? { rowIds, paid: true }
      : { rowIndices, paid: true };
    const res = await apiClient("/api/expenses", {
      method: "PATCH",
      body: JSON.stringify(body),
    }, idToken);
    
    if (res.success) {
      await fetchExpenses();
      showToast(`ชำระทั้งหมด ${rowIndices.length} รายการเรียบร้อย`, "success");
      return true;
    } else {
      showToast(res.error || "เกิดข้อผิดพลาด", "error");
      return false;
    }
  }, [idToken, fetchExpenses, showToast]);

  const addExpense = useCallback(async (data: any) => {
    if (!idToken) return false;
    const res = await apiClient("/api/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }, idToken);
    
    if (res.success) {
      await fetchExpenses();
      showToast("บันทึกรายการผ่อนชำระใหม่แล้ว", "success");
      return true;
    } else {
      showToast(res.error || "ไม่สามารถบันทึกได้", "error");
      return false;
    }
  }, [idToken, fetchExpenses, showToast]);

  const deleteExpense = useCallback(async (rowIndex: number, rowId?: string) => {
    if (!idToken) return false;
    
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การลบนี้ไม่สามารถย้อนกลับได้")) {
      return false;
    }

    // Prefer UUID (drift-safe); fall back to rowIndex for legacy rows without UUID
    const url = rowId
      ? `/api/expenses?rowId=${encodeURIComponent(rowId)}`
      : `/api/expenses?rowIndex=${rowIndex}`;

    const res = await apiClient(url, { method: "DELETE" }, idToken);
    
    if (res.success) {
      await fetchExpenses();
      showToast("ลบรายการเรียบร้อยแล้ว", "success");
      return true;
    } else {
      showToast(res.error || "ไม่สามารถลบรายการได้", "error");
      return false;
    }
  }, [idToken, fetchExpenses, showToast]);

  return {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    markPaid,
    payAll,
    addExpense,
    deleteExpense,
  };
}
