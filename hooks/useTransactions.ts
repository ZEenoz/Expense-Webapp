import { useState, useCallback } from "react";
import { Transaction, TransactionFormData } from "@/types/transaction";
import { useToast } from "@/context/ToastContext";

export function useTransactions(userId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  /**
   * Fetch all transactions
   */
  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/transactions", {
        headers: {
          "x-user-id": userId,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTransactions(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      showToast(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, showToast]);

  /**
   * Add a new transaction
   */
  const addTransaction = useCallback(
    async (data: TransactionFormData) => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          showToast(
            data.type === "income" ? "เพิ่มรายรับสำเร็จ" : "เพิ่มรายจ่ายสำเร็จ",
            "success"
          );
          await fetchTransactions(); // Refresh data
        } else {
          throw new Error(result.error || "Failed to add transaction");
        }
      } catch (error) {
        console.error("Error adding transaction:", error);
        showToast(
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเพิ่มรายการ",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [userId, showToast, fetchTransactions]
  );

  /**
   * Update a transaction
   */
  const updateTransaction = useCallback(
    async (rowIndex: number, data: TransactionFormData) => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/transactions/${rowIndex}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          showToast("แก้ไขรายการสำเร็จ", "success");
          await fetchTransactions(); // Refresh data
        } else {
          throw new Error(result.error || "Failed to update transaction");
        }
      } catch (error) {
        console.error("Error updating transaction:", error);
        showToast(
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขรายการ",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [userId, showToast, fetchTransactions]
  );

  /**
   * Delete a transaction
   */
  const deleteTransaction = useCallback(
    async (rowIndex: number) => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/transactions?rowIndex=${rowIndex}`, {
          method: "DELETE",
          headers: {
            "x-user-id": userId,
          },
        });

        const result = await response.json();

        if (result.success) {
          showToast("ลบรายการสำเร็จ", "success");
          await fetchTransactions(); // Refresh data
        } else {
          throw new Error(result.error || "Failed to delete transaction");
        }
      } catch (error) {
        console.error("Error deleting transaction:", error);
        showToast(
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบรายการ",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [userId, showToast, fetchTransactions]
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
