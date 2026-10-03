// lib/toast.ts — Global toast notification system
import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastStore {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = { ...toast, id, duration: toast.duration ?? 4500 }
    set((state) => ({ toasts: [...state.toasts, newToast] }))
    return id
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}))

export const toast = {
  success: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
    useToastStore.getState().addToast({ type: 'success', message, ...options }),
  error: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
    useToastStore.getState().addToast({ type: 'error', message, ...options }),
  info: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
    useToastStore.getState().addToast({ type: 'info', message, ...options }),
  warning: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
    useToastStore.getState().addToast({ type: 'warning', message, ...options }),
  dismiss: (id: string) => useToastStore.getState().removeToast(id),
}
