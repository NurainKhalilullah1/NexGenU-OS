// app/error.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log sanitized error to monitoring service
    console.error('Application error:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-base)',
        color: 'var(--text-primary)',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '12px',
            background: 'rgba(255, 99, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <AlertTriangle size={28} style={{ color: 'var(--color-orange)' }} />
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          An unexpected system issue occurred. Please retry or contact technical support if the issue persists.
        </p>

        <button
          onClick={reset}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RotateCcw size={16} />
          Try Again
        </button>
      </div>
    </div>
  )
}
