// app/(dashboard)/command/error.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function CommandError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Command center error:', error)
  }, [error])

  return (
    <div className="page-content" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '36px',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'rgba(255, 99, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <AlertTriangle size={24} style={{ color: 'var(--color-orange)' }} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          Failed to load Command Center
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          There was a problem communicating with the database or loading administrative records.
        </p>

        <button
          onClick={reset}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RotateCcw size={15} />
          Retry
        </button>
      </div>
    </div>
  )
}
