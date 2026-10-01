// app/(dashboard)/command/tasks/page.tsx — Admin All Tasks View
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllTasks } from '@/lib/db/tasks'
import { AllTasksTable } from '@/components/dashboard/command/AllTasksTable'
import { TaskFilters } from '@/components/dashboard/command/TaskFilters'
import { CreateTaskButton } from '@/components/dashboard/command/CreateTaskButton'
import { EmptyState } from '@/components/dashboard/shared/EmptyState'
import { CheckSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'All Tasks | Command Center',
}

interface SearchParams {
  pillar?: string
  status?: string
  priority?: string
  search?: string
  kpi?: string
}

export default async function AdminAllTasksPage({
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
  const tasks = await getAllTasks({
    pillar_id: sp.pillar,
    status: sp.status,
    priority: sp.priority,
    search: sp.search,
    has_kpi_ref: sp.kpi === '1' ? true : undefined,
  })

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>All Tasks</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Unified view across all 5 pillars · {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        <CreateTaskButton />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <TaskFilters />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks match your criteria"
          description="Try changing or clearing your search and filters."
          action={<CreateTaskButton />}
        />
      ) : (
        <AllTasksTable tasks={tasks} showPillar />
      )}
    </div>
  )
}
