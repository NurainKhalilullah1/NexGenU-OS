// components/dashboard/head/HeadTaskTabs.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, TaskStatus } from '@/types/database'
import { TaskCard } from '@/components/tasks/TaskCard'
import { EmptyState } from '@/components/dashboard/shared/EmptyState'
import { CheckCircle2, Clock, AlertCircle, Send, RotateCcw, ListTodo } from 'lucide-react'

type TabKey = 'all' | 'not_started' | 'in_progress' | 'blocked' | 'submitted' | 'returned' | 'approved'

interface HeadTaskTabsProps {
  tasks: Task[]
}

const TABS: { key: TabKey; label: string; status?: TaskStatus }[] = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'To Do', status: 'not_started' },
  { key: 'in_progress', label: 'In Progress', status: 'in_progress' },
  { key: 'blocked', label: 'Blocked', status: 'blocked' },
  { key: 'submitted', label: 'Submitted', status: 'submitted' },
  { key: 'returned', label: 'Returned', status: 'returned' },
  { key: 'approved', label: 'Done', status: 'approved' },
]

export function HeadTaskTabs({ tasks }: HeadTaskTabsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const counts: Record<TabKey, number> = {
    all: tasks.length,
    not_started: tasks.filter((t) => t.status === 'not_started').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    submitted: tasks.filter((t) => t.status === 'submitted').length,
    returned: tasks.filter((t) => t.status === 'returned').length,
    approved: tasks.filter((t) => t.status === 'approved').length,
  }

  const filteredTasks = activeTab === 'all'
    ? tasks
    : tasks.filter((t) => t.status === activeTab)

  return (
    <div>
      {/* Tabs navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = counts[tab.key]

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                border: 'none',
                background: isActive ? 'var(--surface-2)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'all 150ms ease-out',
                whiteSpace: 'nowrap',
              }}
              className="hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--color-surface)' : 'var(--surface-1)',
                  color: isActive ? 'var(--color-accent)' : 'var(--text-muted)',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Task list or empty state */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={
            activeTab === 'approved'
              ? CheckCircle2
              : activeTab === 'blocked'
              ? AlertCircle
              : activeTab === 'returned'
              ? RotateCcw
              : activeTab === 'submitted'
              ? Send
              : ListTodo
          }
          title={`No ${activeTab === 'all' ? '' : TABS.find((t) => t.key === activeTab)?.label} tasks`}
          description={
            activeTab === 'all'
              ? 'No tasks assigned to your pillar yet.'
              : `There are currently no tasks in "${TABS.find((t) => t.key === activeTab)?.label}" status.`
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => router.push(`/head/tasks/${task.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
