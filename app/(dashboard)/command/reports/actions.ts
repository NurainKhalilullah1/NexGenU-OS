// app/(dashboard)/command/reports/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getCompletionRateReport,
  getOverdueTasksReport,
  getAvgApprovalTimeReport,
  getReturnRateReport,
  type PeriodType,
} from '@/lib/db/reports'
import type { ActionResult } from '@/types/database'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return user
}

export async function exportReportCSVAction(
  reportType: 'completion_rate' | 'overdue' | 'avg_approval' | 'return_rate',
  filters?: {
    period?: PeriodType
    startDate?: string
    endDate?: string
    pillarId?: string
  }
): Promise<ActionResult<{ csv: string; filename: string }>> {
  const admin = await verifyAdmin()
  if (!admin) return { data: null, error: 'Unauthorized' }

  const today = new Date().toISOString().split('T')[0]
  let csv = ''
  const filename = `nexgenu-report-${reportType}-${today}.csv`

  if (reportType === 'completion_rate') {
    const { rows } = await getCompletionRateReport(
      filters?.period ?? 'this_month',
      filters?.startDate,
      filters?.endDate
    )
    const header = 'pillar_name,assigned_count,completed_count,completion_rate,period\n'
    const body = rows
      .map(
        (r) =>
          `"${r.pillarName.replace(/"/g, '""')}",${r.assignedCount},${r.completedCount},${r.completionRate}%,"${r.period}"`
      )
      .join('\n')
    csv = header + body
  } else if (reportType === 'overdue') {
    const { rows } = await getOverdueTasksReport()
    const filteredRows = filters?.pillarId
      ? rows.filter((r) => r.pillarId === filters.pillarId)
      : rows

    const header = 'pillar_name,head_name,task_title,due_date,days_overdue\n'
    const body = filteredRows
      .map(
        (r) =>
          `"${r.pillarName.replace(/"/g, '""')}","${r.headName.replace(/"/g, '""')}","${r.taskTitle.replace(/"/g, '""')}",${r.dueDate},${r.daysOverdue}`
      )
      .join('\n')
    csv = header + body
  } else if (reportType === 'avg_approval') {
    const { rows } = await getAvgApprovalTimeReport()
    const header = 'pillar_name,avg_days,min_days,max_days,sample_size\n'
    const body = rows
      .map(
        (r) =>
          `"${r.pillarName.replace(/"/g, '""')}",${r.avgDays},${r.minDays},${r.maxDays},${r.sampleSize}`
      )
      .join('\n')
    csv = header + body
  } else if (reportType === 'return_rate') {
    const { rows } = await getReturnRateReport()
    const header = 'pillar_name,submitted_count,returned_count,return_rate\n'
    const body = rows
      .map(
        (r) =>
          `"${r.pillarName.replace(/"/g, '""')}",${r.submittedCount},${r.returnedCount},${r.returnRate}%`
      )
      .join('\n')
    csv = header + body
  }

  return { data: { csv, filename }, error: null }
}
