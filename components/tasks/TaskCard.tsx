// components/tasks/TaskCard.tsx
'use client'
import type { Task } from '@/types/database'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { formatDueDate, isOverdue } from '@/lib/utils'
import { Calendar, User, CalendarClock, MessageSquare } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  showPillar?: boolean
}

export function TaskCard({ task, onClick, showPillar = false }: TaskCardProps) {
  const overdue = isOverdue(task.due_date, task.status)

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      style={{
        background: 'var(--surface-1)',
        border: `1px solid ${overdue ? 'rgba(255,99,0,0.3)' : 'var(--border-default)'}`,
        borderLeft: overdue ? '3px solid var(--color-orange)' : '1px solid var(--border-default)',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms ease-out',
        outline: 'none',
      }}
      className="hover:bg-[var(--surface-2)] hover:border-[var(--border-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      {/* Priority indicator dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          background:
            task.priority === 'critical' || task.priority === 'high'
              ? 'var(--color-orange)'
              : task.priority === 'medium'
              ? 'var(--color-lavender)'
              : 'var(--text-muted)',
        }}
      />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {task.title}
          </span>
          {showPillar && task.pillar && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                flexShrink: 0,
                background: 'var(--surface-3)',
                borderRadius: '4px',
                padding: '1px 6px',
              }}
            >
              {task.pillar.nickname}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge status={task.status} isOverdue={overdue} />
          <PriorityBadge priority={task.priority} />

          {task.due_date && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '11px',
                color: overdue ? 'var(--color-orange)' : 'var(--text-muted)',
              }}
            >
              <Calendar size={10} />
              {formatDueDate(task.due_date)}
            </span>
          )}

          {task.assignee && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              <User size={10} />
              {task.assignee.full_name}
            </span>
          )}

          {task.has_pending_extension && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '11px',
                color: 'var(--color-lavender)',
                background: 'rgba(207, 193, 252, 0.15)',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(207, 193, 252, 0.35)',
              }}
              title="Extension Request Pending"
            >
              <CalendarClock size={10} />
              Extension Pending
            </span>
          )}

          {typeof task.comments_count === 'number' && task.comments_count > 0 && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '11px',
                color: 'var(--color-accent)',
                background: 'rgba(185, 251, 194, 0.1)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
              title={`${task.comments_count} comments`}
            >
              <MessageSquare size={10} />
              {task.comments_count}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
