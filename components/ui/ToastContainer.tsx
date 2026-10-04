// components/ui/ToastContainer.tsx
'use client'
import { useEffect } from 'react'
import { useToastStore, type ToastItem } from '@/lib/toast'
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react'

function ToastRow({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, onDismiss])

  const iconMap = {
    success: <CheckCircle2 size={18} color="var(--color-accent)" style={{ flexShrink: 0 }} />,
    error: <AlertTriangle size={18} color="var(--color-orange)" style={{ flexShrink: 0 }} />,
    info: <Info size={18} color="var(--color-lavender)" style={{ flexShrink: 0 }} />,
    warning: <AlertCircle size={18} color="#FBBF24" style={{ flexShrink: 0 }} />,
  }

  const borderMap = {
    success: '1px solid rgba(185, 251, 194, 0.35)',
    error: '1px solid rgba(255, 99, 0, 0.35)',
    info: '1px solid rgba(207, 193, 252, 0.35)',
    warning: '1px solid rgba(251, 191, 36, 0.35)',
  }

  const glowMap = {
    success: '0 4px 20px rgba(185, 251, 194, 0.15)',
    error: '0 4px 20px rgba(255, 99, 0, 0.15)',
    info: '0 4px 20px rgba(207, 193, 252, 0.15)',
    warning: '0 4px 20px rgba(251, 191, 36, 0.15)',
  }

  return (
    <div
      style={{
        background: 'rgba(27, 46, 52, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: borderMap[toast.type],
        boxShadow: `${glowMap[toast.type]}, 0 8px 32px rgba(0, 0, 0, 0.45)`,
        borderRadius: '12px',
        padding: '12px 14px',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '420px',
        pointerEvents: 'auto',
        animation: 'slideInToast 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        transition: 'all 200ms ease',
      }}
    >
      {iconMap[toast.type]}

      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{ fontWeight: 600, fontSize: '13px', margin: 0, marginBottom: '2px', color: '#FFFFFF' }}>
            {toast.title}
          </p>
        )}
        <p style={{ fontSize: '12.5px', margin: 0, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {toast.message}
        </p>
      </div>

      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick()
            onDismiss(toast.id)
          }}
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 8px', fontSize: '11px', flexShrink: 0 }}
        >
          {toast.action.label}
        </button>
      )}

      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.5)',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          flexShrink: 0,
        }}
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((item) => (
          <ToastRow key={item.id} toast={item} onDismiss={removeToast} />
        ))}
      </div>
    </>
  )
}
