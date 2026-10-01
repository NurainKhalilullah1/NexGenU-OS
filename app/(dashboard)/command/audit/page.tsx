// app/(dashboard)/command/audit/page.tsx — Audit Log Viewer (Admin Only)
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFilteredAuditLogs } from '@/lib/db/audit-log'
import { AuditLogViewer } from '@/components/dashboard/command/AuditLogViewer'
import type { User } from '@/types/database'

export const metadata: Metadata = { title: 'Audit Log | Command Center' }

interface SearchParams {
  actor?: string
  entity?: string
  action?: string
  start_date?: string
  end_date?: string
  page?: string
}

export default async function AuditLogPage({
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
  const currentPage = parseInt(sp.page || '1', 10)
  const pageSize = 50

  const [{ logs, totalCount }, { data: usersData }] = await Promise.all([
    getFilteredAuditLogs({
      actorId: sp.actor,
      entity: sp.entity,
      action: sp.action,
      startDate: sp.start_date,
      endDate: sp.end_date,
      page: currentPage,
      pageSize,
    }),
    supabase.from('users').select('id, full_name, email, role').order('full_name'),
  ])

  return (
    <div className="page-content" style={{ maxWidth: '1100px' }}>
      <AuditLogViewer
        logs={logs}
        totalCount={totalCount}
        users={(usersData ?? []) as User[]}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  )
}
