// components/dashboard/head/HeadFocusSection.tsx
'use client'

import { useRouter } from 'next/navigation'
import type { Task } from '@/types/database'
import { TaskCard } from '@/components/tasks/TaskCard'
import { isOverdue } from '@/lib/utils'
import { isToday } from 'date-fns'
import { Zap, CheckCircle2 } from 'lucide-react'

interface HeadFocusSectionProps {
  tasks: Task[]
}

export function HeadFocusSection({ tasks }: HeadFocusSectionProps) {
  const router = useRouter()

  const focusTasks = tasks.filter((t) => {
    if (t.status === 'approved' || t.archived) return false
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return isOverdue(t.due_date, t.status) || isToday(d)
  })

  return (
    <section style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Zap size={18} style={{ color: 'var(--color-orange)' }} />
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          My Focus
        </h2>
        {focusTasks.length > 0 && (
          <span
            style={{
              background: 'rgba(255, 99, 0, 0.2)',
              color: 'var(--color-orange)',
              border: '1px solid rgba(255, 99, 0, 0.4)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '1px 7px',
              borderRadius: '10px',
            }}
          >
            {focusTasks.length} urgent
          </span>
        )}
      </div>

      {focusTasks.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span>All clear! No overdue tasks or items due today. Keep building.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {focusTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => router.push(`/head/tasks/${task.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
