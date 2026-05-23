import { useState, useCallback } from "react";
import { Transaction, TransactionFormData } from "@/types/transaction";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

export function useTransactions() {
  const { idToken } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!idToken) return;
    setIsLoading(true);
    const res = await apiClient<Transaction[]>("/api/transactions", {}, idToken);
    
    if (res.success && res.data) {
      setTransactions(res.data);
    } else {
      console.error("Error fetching transactions:", res.error);
      showToast(res.error || "เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    }
    setIsLoading(false);
  }, [idToken, showToast]);

  const addTransaction = useCallback(
    async (data: TransactionFormData) => {
      if (!idToken) return;
      setIsLoading(true);
      const res = await apiClient("/api/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      }, idToken);

      if (res.success) {
        showToast(
          data.type === "income" ? "เพิ่มรายรับสำเร็จ" : "เพิ่มรายจ่ายสำเร็จ",
          "success"
        );
        await fetchTransactions();
      } else {
        console.error("Error adding transaction:", res.error);
        showToast(res.error || "เกิดข้อผิดพลาดในการเพิ่มรายการ", "error");
      }
      setIsLoading(false);
    },
    [idToken, showToast, fetchTransactions]
  );

  const updateTransaction = useCallback(
    async (rowIndex: number, data: TransactionFormData) => {
      if (!idToken) return;
      setIsLoading(true);
      const res = await apiClient(`/api/transactions/${rowIndex}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }, idToken);

      if (res.success) {
        showToast("แก้ไขรายการสำเร็จ", "success");
        await fetchTransactions();
      } else {
        console.error("Error updating transaction:", res.error);
        showToast(res.error || "เกิดข้อผิดพลาดในการแก้ไขรายการ", "error");
      }
      setIsLoading(false);
    },
    [idToken, showToast, fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (rowIndex: number) => {
      if (!idToken) return;
      setIsLoading(true);
      const res = await apiClient(`/api/transactions?rowIndex=${rowIndex}`, {
        method: "DELETE",
      }, idToken);

      if (res.success) {
        showToast("ลบรายการสำเร็จ", "success");
        await fetchTransactions();
      } else {
        console.error("Error deleting transaction:", res.error);
        showToast(res.error || "เกิดข้อผิดพลาดในการลบรายการ", "error");
      }
      setIsLoading(false);
    },
    [idToken, showToast, fetchTransactions]
  );

  return {
    transactions,
    isLoading,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
