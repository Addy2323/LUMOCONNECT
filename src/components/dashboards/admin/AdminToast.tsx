'use client'

import React, { createContext, useContext, useCallback } from 'react'
import Swal, { SweetAlertIcon } from 'sweetalert2'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, description?: string) => void
  showAlert: (options: { icon?: SweetAlertIcon; title: string; text?: string; confirmButtonText?: string }) => Promise<any>
  confirmAlert: (options: { title: string; text?: string; confirmButtonText?: string; cancelButtonText?: string; icon?: SweetAlertIcon }) => Promise<boolean>
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const ToastSwal = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
    title: 'text-xs font-black',
    htmlContainer: 'text-[11px] text-slate-500 dark:text-slate-400',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((type: ToastType, title: string, description?: string) => {
    ToastSwal.fire({
      icon: type,
      title: title,
      text: description || undefined,
    })
  }, [])

  const showAlert = useCallback(async (options: { icon?: SweetAlertIcon; title: string; text?: string; confirmButtonText?: string }) => {
    return Swal.fire({
      icon: options.icon || 'info',
      title: options.title,
      text: options.text,
      confirmButtonText: options.confirmButtonText || 'OK',
      confirmButtonColor: '#FF6A00',
      customClass: {
        popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-sans',
        title: 'text-lg font-black text-slate-900 dark:text-white',
        htmlContainer: 'text-xs text-slate-600 dark:text-slate-300',
        confirmButton: 'px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer',
      },
    })
  }, [])

  const confirmAlert = useCallback(async (options: { title: string; text?: string; confirmButtonText?: string; cancelButtonText?: string; icon?: SweetAlertIcon }) => {
    const result = await Swal.fire({
      title: options.title,
      text: options.text,
      icon: options.icon || 'warning',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Yes, proceed',
      cancelButtonText: options.cancelButtonText || 'Cancel',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      customClass: {
        popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-sans',
        title: 'text-lg font-black text-slate-900 dark:text-white',
        htmlContainer: 'text-xs text-slate-600 dark:text-slate-300',
        confirmButton: 'px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer',
        cancelButton: 'px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer',
      },
    })
    return result.isConfirmed
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, showAlert, confirmAlert }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useAdminToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useAdminToast must be used within an AdminToastProvider')
  }
  return context
}

export { Swal }
