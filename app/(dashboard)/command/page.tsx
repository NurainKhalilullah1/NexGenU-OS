// app/(dashboard)/command/page.tsx — Command Dashboard (Admin)
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCommandDashboardStats, getAllTasks } from '@/lib/db/tasks'
import { getPendingSubmissions } from '@/lib/db/submissions'
import { getPendingExtensionRequests } from '@/lib/db/extensions'
import { SummaryCard } from '@/components/dashboard/shared/SummaryCard'
import { TaskCard } from '@/components/tasks/TaskCard'
import { EmptyState } from '@/components/dashboard/shared/EmptyState'
import { CreateTaskButton } from '@/components/dashboard/command/CreateTaskButton'
import { ReviewQueueSection } from '@/components/dashboard/command/ReviewQueueSection'
import { ExtensionRequestsWidget } from '@/components/dashboard/command/ExtensionRequestsWidget'
import { TaskFilters } from '@/components/dashboard/command/TaskFilters'
import {
  AlertOctagon,
  Clock,
  CheckSquare,
  AlertTriangle,
  Ban,
  Plus,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Command Center' }

interface SearchParams {
  pillar?: string
  status?: string
  priority?: string
  search?: string
}

export default async function CommandPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/head')

  const sp = await searchParams

  const [stats, tasks, pendingSubmissions, pendingExtensions] = await Promise.all([
    getCommandDashboardStats(),
    getAllTasks({ pillar_id: sp.pillar, status: sp.status, priority: sp.priority, search: sp.search }),
    getPendingSubmissions(),
    getPendingExtensionRequests(),
  ])

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Command Center</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            All pillars · All tasks
          </p>
        </div>
        <CreateTaskButton />
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        <SummaryCard label="Open Tasks" value={stats.open} icon={CheckSquare} color="white" />
        <SummaryCard label="Overdue" value={stats.overdue} icon={AlertTriangle} color="orange" trend={stats.overdue > 0 ? 'up' : undefined} />
        <SummaryCard label="Due This Week" value={stats.dueThisWeek} icon={Clock} color="lavender" />
        <SummaryCard label="Awaiting Review" value={stats.awaitingReview} icon={AlertOctagon} color="accent" />
        <SummaryCard label="Blocked" value={stats.blocked} icon={Ban} color="orange" />
      </div>

      {/* Extension Requests Widget (Phase 2) */}
      <ExtensionRequestsWidget requests={pendingExtensions} />

      {/* Review Queue */}
      {pendingSubmissions.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={16} color="var(--color-lavender)" />
            Review Queue
            <span className="badge badge-submitted" style={{ fontSize: '11px' }}>
              {pendingSubmissions.length}
            </span>
          </h2>
          <ReviewQueueSection submissions={pendingSubmissions} />
        </section>
      )}

      {/* All Tasks */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>All Tasks</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{tasks.length} tasks</span>
        </div>

        <TaskFilters />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks found"
              description="Try adjusting your filters, or create a new task."
              action={<CreateTaskButton />}
            />
          ) : (
            tasks.map((task) => (
              <Link
                key={task.id}
                href={`/command/tasks/${task.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <TaskCard task={task} showPillar />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
