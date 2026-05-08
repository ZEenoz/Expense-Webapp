"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3.5 shadow-2xl backdrop-blur-xl animate-scale-in-fade-in ${
              toast.type === "success" ? "bg-emerald-500/90" : 
              toast.type === "error" ? "bg-red-500/90" : "bg-slate-800/90"
            }`}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
              {toast.type === "success" && <CheckCircle className="h-4 w-4 text-white" />}
              {toast.type === "error" && <AlertCircle className="h-4 w-4 text-white" />}
              {toast.type === "info" && <Info className="h-4 w-4 text-white" />}
            </div>
            
            <p className="text-sm font-bold text-white pr-2">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)} 
              className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
