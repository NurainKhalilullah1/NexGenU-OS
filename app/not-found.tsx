// app/not-found.tsx
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
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
          <AlertCircle size={28} style={{ color: 'var(--color-orange)' }} />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          The requested task, route, or workspace does not exist or you do not have permission to view it.
        </p>

        <Link
          href="/"
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
