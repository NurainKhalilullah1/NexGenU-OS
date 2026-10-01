// components/dashboard/shared/EmptyState.tsx
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '16px',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={28} color="var(--text-muted)" />
      </div>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{title}</h3>
        {description && (
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '360px' }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
