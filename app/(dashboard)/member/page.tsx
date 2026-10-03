// app/(dashboard)/member/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTasksForHead } from '@/lib/db/tasks'
import { getInternalSubmissionsForMember } from '@/lib/db/internal-submissions'
import { MemberTaskList } from '@/components/dashboard/member/MemberTaskList'
import { SummaryCard } from '@/components/dashboard/shared/SummaryCard'
import { CheckCircle2, Clock, ClipboardList, RotateCcw } from 'lucide-react'

export const metadata: Metadata = { title: 'My Workspace | NexGenU OS' }

export default async function MemberDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, pillar:pillars(id, name, nickname)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/command')
  if (profile.role === 'head') redirect('/head')
  if (!profile.pillar_id) {
    return (
      <div className="page-content">
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
          <h2>Pillar Assignment Required</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You have not been assigned to a pillar yet. Contact your Pillar Head.</p>
        </div>
      </div>
    )
  }

  const [allPillarTasks, mySubmissions] = await Promise.all([
    getTasksForHead(profile.pillar_id),
    getInternalSubmissionsForMember(user.id),
  ])

  const myTasks = allPillarTasks.filter((t) => t.assignee_id === user.id)
  const inProgress = myTasks.filter((t) => t.status === 'in_progress').length
  const submitted = mySubmissions.filter((s) => s.status === 'pending').length
  const returned = mySubmissions.filter((s) => s.status === 'returned').length
  const approved = mySubmissions.filter((s) => s.status === 'approved').length

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(185,251,194,0.12)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '4px' }}>
            {profile.pillar?.nickname ?? 'Member'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Workspace</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          My Tasks
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Welcome back, {profile.full_name}. Here are your assigned deliverables.
        </p>
      </div>

      {/* Stats */}
      <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        <SummaryCard label="Assigned" value={myTasks.length} icon={ClipboardList} color="white" />
        <SummaryCard label="In Progress" value={inProgress} icon={Clock} color="accent" />
        <SummaryCard label="Awaiting Review" value={submitted} icon={ClipboardList} color="lavender" />
        <SummaryCard label="Returned" value={returned} icon={RotateCcw} color="orange" />
        <SummaryCard label="Approved" value={approved} icon={CheckCircle2} color="accent" />
      </div>

      {/* Task List */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>My Assigned Tasks</h2>
        <MemberTaskList tasks={myTasks} submissions={mySubmissions} memberId={user.id} />
      </div>
    </div>
  )
}
