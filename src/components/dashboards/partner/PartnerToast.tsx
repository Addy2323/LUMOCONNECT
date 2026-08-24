'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface PartnerToastContextType {
  showToast: (type: ToastType, title: string, description?: string) => void
}

const PartnerToastContext = createContext<PartnerToastContextType | undefined>(undefined)

export function PartnerToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`
    setToasts((prev) => [...prev, { id, type, title, description }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <PartnerToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-start justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white ring-1 ring-emerald-500/20'
                : toast.type === 'error'
                ? 'bg-white dark:bg-slate-900 border-red-300 dark:border-red-800 text-slate-900 dark:text-white ring-1 ring-red-500/20'
                : toast.type === 'warning'
                ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white ring-1 ring-amber-500/20'
                : 'bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-800 text-slate-900 dark:text-white ring-1 ring-blue-500/20'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}

              <div>
                <div className="font-extrabold text-xs leading-snug">{toast.title}</div>
                {toast.description && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {toast.description}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </PartnerToastContext.Provider>
  )
}

export function usePartnerToast() {
  const context = useContext(PartnerToastContext)
  if (!context) {
    throw new Error('usePartnerToast must be used within a PartnerToastProvider')
  }
  return context
}
