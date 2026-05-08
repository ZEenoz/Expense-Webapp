"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { UserConfig } from "@/lib/googleSheets";
import { useToast } from "@/context/ToastContext";

export function useSettings(userId: string | undefined) {
  const [categories, setCategories] = useState<string[]>([]);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    if (!userId) return;
    const res = await apiClient<string[]>("/api/categories", {}, userId);
    if (res.success && res.data) {
      setCategories(res.data);
    }
  }, [userId]);

  const addCategory = useCallback(async (name: string) => {
    if (!userId) return false;
    const res = await apiClient("/api/categories", {
      method: "POST",
      body: JSON.stringify({ categoryName: name }),
    }, userId);
    
    if (res.success) {
      await fetchCategories();
      showToast(`เพิ่มหมวดหมู่ "${name}" เรียบร้อย`, "success");
      return true;
    } else {
      showToast(res.error || "ไม่สามารถเพิ่มหมวดหมู่ได้", "error");
      return false;
    }
  }, [userId, fetchCategories, showToast]);

  const fetchConfig = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const res = await apiClient<UserConfig>("/api/settings", {}, userId);
    if (res.success && res.data) {
      setUserConfig(res.data);
    }
    setIsLoading(false);
  }, [userId]);

  const saveConfig = useCallback(async (config: Partial<UserConfig>) => {
    if (!userId) return false;
    const res = await apiClient("/api/settings", {
      method: "POST",
      body: JSON.stringify(config),
    }, userId);
    
    if (res.success) {
      await fetchConfig();
      showToast("บันทึกการตั้งค่าแล้ว", "success");
      return true;
    } else {
      showToast(res.error || "บันทึกไม่สำเร็จ", "error");
      return false;
    }
  }, [userId, fetchConfig, showToast]);

  return {
    categories,
    userConfig,
    isLoading,
    fetchCategories,
    addCategory,
    fetchConfig,
    saveConfig,
  };
}
