// app/(dashboard)/head/page.tsx — Head Dashboard (Pillar-scoped)
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTasksForHead, getHeadDashboardStats } from '@/lib/db/tasks'
import { SummaryCard } from '@/components/dashboard/shared/SummaryCard'
import { HeadFocusSection } from '@/components/dashboard/head/HeadFocusSection'
import { HeadTaskTabs } from '@/components/dashboard/head/HeadTaskTabs'
import { CheckCircle2, Clock, Calendar, RotateCcw, ClipboardList } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pillar Workspace | NexGenU OS',
}

export default async function HeadDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, pillar:pillars(id, name, nickname)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Role routing enforcement
  if (profile.role === 'admin') {
    redirect('/command')
  }

  if (!profile.pillar_id) {
    return (
      <div className="page-content">
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Pillar Assignment Required</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Your account is not yet assigned to an active pillar. Please reach out to NexGenU leadership.
          </p>
        </div>
      </div>
    )
  }

  const [stats, tasks] = await Promise.all([
    getHeadDashboardStats(profile.pillar_id),
    getTasksForHead(profile.pillar_id),
  ])

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(207, 193, 252, 0.15)',
              color: 'var(--color-lavender)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {profile.pillar?.nickname ?? 'Pillar Head'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Workspace</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {profile.pillar?.name ?? 'My Pillar Dashboard'}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Welcome back, {profile.full_name}. Here is your team&apos;s active execution pipeline.
        </p>
      </div>

      {/* Summary Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '28px',
        }}
      >
        <SummaryCard
          label="Assigned"
          value={stats.assigned}
          color="white"
          icon={ClipboardList}
        />
        <SummaryCard
          label="In Progress"
          value={stats.inProgress}
          color="accent"
          icon={Clock}
        />
        <SummaryCard
          label="Due This Week"
          value={stats.dueThisWeek}
          color="lavender"
          icon={Calendar}
        />
        <SummaryCard
          label="Returned"
          value={stats.returned}
          color="orange"
          icon={RotateCcw}
        />
        <SummaryCard
          label="Approved (Month)"
          value={stats.approvedThisMonth}
          color="accent"
          icon={CheckCircle2}
        />
      </div>

      {/* My Focus Section (pinned at top) */}
      <HeadFocusSection tasks={tasks} />

      {/* Tabbed Task List */}
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>All Pillar Tasks</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Filter and track every deliverable assigned to {profile.pillar?.name ?? 'your pillar'}.
          </p>
        </div>

        <HeadTaskTabs tasks={tasks} />
      </div>
    </div>
  )
}
