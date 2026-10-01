// components/tasks/PriorityBadge.tsx
import type { TaskPriority } from '@/types/database'
import { PRIORITY_LABELS } from '@/lib/utils'
import { ArrowDown, ArrowUp, AlertCircle, Flame } from 'lucide-react'

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { className: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  low: { className: 'badge badge-low', Icon: ArrowDown },
  medium: { className: 'badge badge-medium', Icon: ArrowUp },
  high: { className: 'badge badge-high', Icon: AlertCircle },
  critical: { className: 'badge badge-critical', Icon: Flame },
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  const { Icon } = config

  return (
    <span className={`${config.className} ${className}`}>
      <Icon size={10} />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
