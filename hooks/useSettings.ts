"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { UserConfig } from "@/lib/googleSheets";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

export function useSettings() {
  const { idToken } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    if (!idToken) return;
    const res = await apiClient<string[]>("/api/categories", {}, idToken);
    if (res.success && res.data) {
      setCategories(res.data);
    }
  }, [idToken]);

  const addCategory = useCallback(async (name: string) => {
    if (!idToken) return false;
    const res = await apiClient("/api/categories", {
      method: "POST",
      body: JSON.stringify({ categoryName: name }),
    }, idToken);
    
    if (res.success) {
      await fetchCategories();
      showToast(`เพิ่มหมวดหมู่ "${name}" เรียบร้อย`, "success");
      return true;
    } else {
      showToast(res.error || "ไม่สามารถเพิ่มหมวดหมู่ได้", "error");
      return false;
    }
  }, [idToken, fetchCategories, showToast]);

  const fetchConfig = useCallback(async () => {
    if (!idToken) return;
    setIsLoading(true);
    const res = await apiClient<UserConfig>("/api/settings", {}, idToken);
    if (res.success && res.data) {
      setUserConfig(res.data);
    }
    setIsLoading(false);
  }, [idToken]);

  const saveConfig = useCallback(async (config: Partial<UserConfig>) => {
    if (!idToken) return false;
    const res = await apiClient("/api/settings", {
      method: "POST",
      body: JSON.stringify(config),
    }, idToken);
    
    if (res.success) {
      await fetchConfig();
      showToast("บันทึกการตั้งค่าแล้ว", "success");
      return true;
    } else {
      showToast(res.error || "บันทึกไม่สำเร็จ", "error");
      return false;
    }
  }, [idToken, fetchConfig, showToast]);

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
