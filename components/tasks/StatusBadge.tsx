// components/tasks/StatusBadge.tsx
import type { TaskStatus } from '@/types/database'
import { STATUS_LABELS } from '@/lib/utils'
import {
  Circle,
  Loader2,
  Ban,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

interface StatusBadgeProps {
  status: TaskStatus
  showIcon?: boolean
  isOverdue?: boolean
  className?: string
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { className: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  not_started: { className: 'badge badge-not-started', Icon: Circle },
  in_progress: { className: 'badge badge-in-progress', Icon: Loader2 },
  blocked: { className: 'badge badge-blocked', Icon: Ban },
  submitted: { className: 'badge badge-submitted', Icon: Upload },
  returned: { className: 'badge badge-returned', Icon: RotateCcw },
  approved: { className: 'badge badge-approved', Icon: CheckCircle2 },
}

export function StatusBadge({ status, showIcon = true, isOverdue, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const { Icon } = config

  if (isOverdue && status !== 'approved') {
    return (
      <span className={`badge badge-overdue ${className}`}>
        {showIcon && <AlertTriangle size={10} />}
        Overdue
      </span>
    )
  }

  return (
    <span className={`${config.className} ${className}`}>
      {showIcon && <Icon size={10} />}
      {STATUS_LABELS[status]}
    </span>
  )
}
