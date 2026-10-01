// components/dashboard/shared/LoadingSpinner.tsx
export function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        border: `2px solid var(--border-default)`,
        borderTop: `2px solid var(--color-accent)`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
      }}
    >
      <LoadingSpinner size={32} />
    </div>
  )
}

export function SkeletonLine({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 4,
        background: 'var(--surface-3)',
        opacity: 0.6,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <SkeletonLine width="60%" />
      <SkeletonLine width="90%" height={12} />
      <div style={{ display: 'flex', gap: 8 }}>
        <SkeletonLine width={64} height={20} />
        <SkeletonLine width={48} height={20} />
      </div>
    </div>
  )
}
