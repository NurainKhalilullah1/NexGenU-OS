// app/(dashboard)/command/reports/page.tsx — Admin Reports View
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getCompletionRateReport,
  getOverdueTasksReport,
  getAvgApprovalTimeReport,
  getReturnRateReport,
} from '@/lib/db/reports'
import { ReportsView } from '@/components/dashboard/command/reports/ReportsView'

export const metadata: Metadata = {
  title: 'Reports & Analytics | Command Center',
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/head')

  // Fetch initial data for all 4 reports in parallel
  const [completion, overdue, avgApproval, returnRate] = await Promise.all([
    getCompletionRateReport('this_month'),
    getOverdueTasksReport(),
    getAvgApprovalTimeReport(),
    getReturnRateReport(),
  ])

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Reports & Insight</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
          Pillar performance, completion velocity, overdue task analysis, and submission return metrics
        </p>
      </div>

      <ReportsView
        initialCompletion={completion}
        initialOverdue={overdue}
        initialAvgApproval={avgApproval}
        initialReturnRate={returnRate}
      />
    </div>
  )
}
