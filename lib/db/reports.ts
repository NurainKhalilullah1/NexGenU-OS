// lib/db/reports.ts
// Typed query helpers and statistical aggregations for Phase 3 Reports
import { createClient } from '@/lib/supabase/server'
import { getAllPillars } from '@/lib/db/pillars'
import { isOverdue } from '@/lib/utils'
import type { TaskStatus } from '@/types/database'

export type PeriodType = 'this_month' | 'last_month' | 'all_time' | 'custom'

export interface CompletionRateRow {
  pillarId: string
  pillarName: string
  nickname: string
  assignedCount: number
  completedCount: number
  completionRate: number // percentage 0-100
  period: string
}

export interface OverdueTaskRow {
  taskId: string
  pillarId: string
  pillarName: string
  headName: string
  taskTitle: string
  dueDate: string
  daysOverdue: number
}

export interface AvgApprovalTimeRow {
  pillarId: string
  pillarName: string
  avgDays: number
  minDays: number
  maxDays: number
  sampleSize: number
}

export interface WeeklyTrendPoint {
  week: string
  avgDays: number
  approvalsCount: number
}

export interface ReturnRateRow {
  pillarId: string
  pillarName: string
  nickname: string
  submittedCount: number
  returnedCount: number
  returnRate: number // percentage 0-100
}

export async function getCompletionRateReport(period: PeriodType = 'this_month', customStart?: string, customEnd?: string): Promise<{
  rows: CompletionRateRow[]
  periodLabel: string
}> {
  const supabase = await createClient()
  const pillars = await getAllPillars()

  const now = new Date()
  let startDate: Date
  let endDate: Date = now
  let periodLabel = 'This Month'

  if (period === 'last_month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    periodLabel = 'Last Month'
  } else if (period === 'all_time') {
    startDate = new Date(2020, 0, 1)
    periodLabel = 'All Time'
  } else if (period === 'custom' && customStart) {
    startDate = new Date(customStart)
    endDate = customEnd ? new Date(`${customEnd}T23:59:59`) : now
    periodLabel = `${customStart} to ${customEnd || 'Now'}`
  } else {
    // Default this_month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    periodLabel = 'This Month'
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, pillar_id, status, created_at, updated_at')
    .eq('archived', false)

  if (error || !tasks) {
    return {
      rows: pillars.map((p) => ({
        pillarId: p.id,
        pillarName: p.name,
        nickname: p.nickname,
        assignedCount: 0,
        completedCount: 0,
        completionRate: 0,
        period: periodLabel,
      })),
      periodLabel,
    }
  }

  const rows: CompletionRateRow[] = pillars.map((pillar) => {
    const pillarTasks = tasks.filter((t) => t.pillar_id === pillar.id)

    // Tasks assigned (created in or active during period)
    const assignedInPeriod = pillarTasks.filter((t) => {
      const created = new Date(t.created_at)
      return created <= endDate
    })

    // Tasks approved/completed during period
    const completedInPeriod = pillarTasks.filter((t) => {
      if (t.status !== 'approved') return false
      const updated = new Date(t.updated_at)
      return updated >= startDate && updated <= endDate
    })

    const assignedCount = assignedInPeriod.length
    const completedCount = completedInPeriod.length
    const completionRate =
      assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0

    return {
      pillarId: pillar.id,
      pillarName: pillar.name,
      nickname: pillar.nickname,
      assignedCount,
      completedCount,
      completionRate,
      period: periodLabel,
    }
  })

  return { rows, periodLabel }
}

export async function getOverdueTasksReport(): Promise<{
  rows: OverdueTaskRow[]
  byPillarSummary: { pillarName: string; overdueCount: number }[]
}> {
  const supabase = await createClient()
  const pillars = await getAllPillars()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      due_date,
      status,
      pillar_id,
      pillar:pillars(id, name, nickname),
      assignee:users!tasks_assignee_id_fkey(full_name)
    `)
    .eq('archived', false)

  const now = new Date()
  const rows: OverdueTaskRow[] = []

  interface TaskWithRelations {
    id: string
    title: string
    due_date: string | null
    status: string
    pillar_id: string
    pillar?: { id: string; name: string; nickname: string }
    assignee?: { full_name: string }
  }

  const rawTasks = (tasks ?? []) as unknown as TaskWithRelations[]

  for (const t of rawTasks) {
    if (isOverdue(t.due_date, t.status as TaskStatus) && t.due_date) {
      const due = new Date(t.due_date)
      const diffMs = now.getTime() - due.getTime()
      const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

      rows.push({
        taskId: t.id,
        pillarId: t.pillar_id,
        pillarName: t.pillar?.name || 'Unassigned',
        headName: t.assignee?.full_name || 'Unassigned',
        taskTitle: t.title,
        dueDate: t.due_date,
        daysOverdue,
      })
    }
  }

  // Sort descending by days overdue
  rows.sort((a, b) => b.daysOverdue - a.daysOverdue)

  const byPillarSummary = pillars.map((p) => ({
    pillarName: p.nickname || p.name,
    overdueCount: rows.filter((r) => r.pillarId === p.id).length,
  }))

  return { rows, byPillarSummary }
}

export async function getAvgApprovalTimeReport(): Promise<{
  rows: AvgApprovalTimeRow[]
  weeklyTrend: WeeklyTrendPoint[]
}> {
  const supabase = await createClient()
  const pillars = await getAllPillars()

  // Fetch approved submissions with task info
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      submitted_at,
      reviewed_at,
      review_status,
      task_id,
      task:tasks(id, created_at, pillar_id, title)
    `)
    .eq('review_status', 'approved')
    .not('reviewed_at', 'is', null)

  interface SubWithTask {
    id: string
    submitted_at: string
    reviewed_at: string
    review_status: string
    task_id: string
    task?: { id: string; created_at: string; pillar_id: string; title: string }
  }

  const rawSubs = (submissions ?? []) as unknown as SubWithTask[]

  // Group by pillar
  const rows: AvgApprovalTimeRow[] = pillars.map((pillar) => {
    const pillarSubs = rawSubs.filter((s) => s.task?.pillar_id === pillar.id)
    if (pillarSubs.length === 0) {
      return {
        pillarId: pillar.id,
        pillarName: pillar.name,
        avgDays: 0,
        minDays: 0,
        maxDays: 0,
        sampleSize: 0,
      }
    }

    const durations = pillarSubs.map((s) => {
      // Calculate days from task creation (assignment) to approval review
      const start = new Date(s.task?.created_at || s.submitted_at).getTime()
      const end = new Date(s.reviewed_at).getTime()
      const days = Math.max(0.1, (end - start) / (1000 * 60 * 60 * 24))
      return Number(days.toFixed(1))
    })

    const sum = durations.reduce((acc, d) => acc + d, 0)
    const avgDays = Number((sum / durations.length).toFixed(1))
    const minDays = Math.min(...durations)
    const maxDays = Math.max(...durations)

    return {
      pillarId: pillar.id,
      pillarName: pillar.name,
      avgDays,
      minDays,
      maxDays,
      sampleSize: pillarSubs.length,
    }
  })

  // 12-week trend
  const weeklyTrend: WeeklyTrendPoint[] = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - i * 7)

    const weekLabel = `W-${12 - i}`
    const inWeek = rawSubs.filter((s) => {
      const reviewed = new Date(s.reviewed_at)
      return reviewed >= weekStart && reviewed < weekEnd
    })

    if (inWeek.length === 0) {
      weeklyTrend.push({ week: weekLabel, avgDays: 0, approvalsCount: 0 })
    } else {
      const daysList = inWeek.map((s) => {
        const start = new Date(s.task?.created_at || s.submitted_at).getTime()
        const end = new Date(s.reviewed_at).getTime()
        return (end - start) / (1000 * 60 * 60 * 24)
      })
      const avg = Number((daysList.reduce((a, b) => a + b, 0) / daysList.length).toFixed(1))
      weeklyTrend.push({ week: weekLabel, avgDays: avg, approvalsCount: inWeek.length })
    }
  }

  return { rows, weeklyTrend }
}

export async function getReturnRateReport(): Promise<{
  rows: ReturnRateRow[]
  totals: { submitted: number; returned: number; returnRate: number }
}> {
  const supabase = await createClient()
  const pillars = await getAllPillars()

  // Fetch all reviewed submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      review_status,
      task_id,
      task:tasks(id, pillar_id)
    `)

  interface SubItem {
    id: string
    review_status: string
    task_id: string
    task?: { id: string; pillar_id: string }
  }

  const rawSubs = (submissions ?? []) as unknown as SubItem[]

  let totalSubmitted = 0
  let totalReturned = 0

  const rows: ReturnRateRow[] = pillars.map((pillar) => {
    const pillarSubs = rawSubs.filter((s) => s.task?.pillar_id === pillar.id)
    const submittedCount = pillarSubs.length
    const returnedCount = pillarSubs.filter((s) => s.review_status === 'returned').length

    totalSubmitted += submittedCount
    totalReturned += returnedCount

    const returnRate =
      submittedCount > 0 ? Math.round((returnedCount / submittedCount) * 100) : 0

    return {
      pillarId: pillar.id,
      pillarName: pillar.name,
      nickname: pillar.nickname,
      submittedCount,
      returnedCount,
      returnRate,
    }
  })

  const overallRate =
    totalSubmitted > 0 ? Math.round((totalReturned / totalSubmitted) * 100) : 0

  return {
    rows,
    totals: {
      submitted: totalSubmitted,
      returned: totalReturned,
      returnRate: overallRate,
    },
  }
}
