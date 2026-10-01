// app/(dashboard)/head/tasks/page.tsx — Head My Tasks View
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTasksForHead } from '@/lib/db/tasks'
import { HeadTaskTabs } from '@/components/dashboard/head/HeadTaskTabs'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'My Tasks | Pillar Workspace',
}

export default async function HeadMyTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, pillar:pillars(id, name, nickname)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/command/tasks')
  if (!profile.pillar_id) redirect('/head')

  const tasks = await getTasksForHead(profile.pillar_id)

  return (
    <div className="page-content">
      <Link
        href="/head"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '20px',
          textDecoration: 'none',
        }}
        className="hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
          {profile.pillar?.name ?? 'Pillar'} Tasks
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
          Manage your tasks, work logs, and deliverables across all stages.
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <HeadTaskTabs tasks={tasks} />
      </div>
    </div>
  )
}
