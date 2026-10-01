// components/dashboard/shared/SummaryCard.tsx
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SummaryCardProps {
  label: string
  value: number | string
  trend?: 'up' | 'down'
  color?: 'accent' | 'orange' | 'lavender' | 'white'
  icon: LucideIcon
  sublabel?: string
}

const COLOR_CONFIG = {
  accent: {
    icon: 'rgba(185, 251, 194, 0.15)',
    iconColor: '#B9FBC2',
    value: '#B9FBC2',
  },
  orange: {
    icon: 'rgba(255, 99, 0, 0.15)',
    iconColor: '#FF6300',
    value: '#FF6300',
  },
  lavender: {
    icon: 'rgba(207, 193, 252, 0.15)',
    iconColor: '#CFC1FC',
    value: '#CFC1FC',
  },
  white: {
    icon: 'rgba(255, 255, 255, 0.08)',
    iconColor: 'rgba(255, 255, 255, 0.65)',
    value: '#FFFFFF',
  },
}

export function SummaryCard({
  label,
  value,
  trend,
  color = 'white',
  icon: Icon,
  sublabel,
}: SummaryCardProps) {
  const colors = COLOR_CONFIG[color]

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 200ms ease',
      }}
      className="hover:border-[var(--border-subtle)] hover:bg-[var(--surface-2)]"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            background: colors.icon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={colors.iconColor} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <span
          style={{
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: colors.value,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {trend && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontSize: '12px',
              color: trend === 'up' ? '#FF6300' : '#B9FBC2',
              marginBottom: '4px',
            }}
          >
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </span>
        )}
      </div>

      {sublabel && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sublabel}</span>
      )}
    </div>
  )
}
