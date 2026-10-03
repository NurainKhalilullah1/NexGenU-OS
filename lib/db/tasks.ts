import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Task, ActionResult, PillarWorkload, TaskPriority } from '@/types/database'
import type { CreateTaskInput } from '@/lib/validations/task'
import { isOverdue } from '@/lib/utils'
import { getAllPillars } from '@/lib/db/pillars'

export async function getAllTasks(filters?: {
  pillar_id?: string
  status?: string
  priority?: string
  search?: string
  has_kpi_ref?: boolean
}): Promise<Task[]> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(`
      *,
      pillar:pillars(id, name, nickname),
      assignee:users!tasks_assignee_id_fkey(id, full_name, email),
      creator:users!tasks_created_by_fkey(id, full_name, email),
      comments:comments(count),
      extension_requests:extension_requests(status)
    `)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (filters?.pillar_id) query = query.eq('pillar_id', filters.pillar_id)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)
  if (filters?.has_kpi_ref === true) {
    query = query.not('kpi_ref', 'is', null).neq('kpi_ref', '')
  } else if (filters?.has_kpi_ref === false) {
    query = query.or('kpi_ref.is.null,kpi_ref.eq.""')
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  interface TaskQueryRow extends Task {
    comments?: Array<{ count: number }>
    extension_requests?: Array<{ status: string }>
  }

  return ((data ?? []) as unknown as TaskQueryRow[]).map((t) => ({
    ...t,
    is_overdue: isOverdue(t.due_date, t.status),
    comments_count: t.comments?.[0]?.count ?? 0,
    has_pending_extension: (t.extension_requests ?? []).some((e) => e.status === 'pending'),
  }))
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      pillar:pillars(id, name, nickname),
      assignee:users!tasks_assignee_id_fkey(id, full_name, email, pillar_id),
      creator:users!tasks_created_by_fkey(id, full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) return null

  return {
    ...data,
    is_overdue: isOverdue(data.due_date, data.status),
  } as Task
}

export async function getTasksForHead(pillarId: string, filters?: {
  status?: string
}): Promise<Task[]> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(`
      *,
      pillar:pillars(id, name, nickname),
      assignee:users!tasks_assignee_id_fkey(id, full_name, email),
      comments:comments(count),
      extension_requests:extension_requests(status)
    `)
    .eq('pillar_id', pillarId)
    .eq('archived', false)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  interface TaskQueryRow extends Task {
    comments?: Array<{ count: number }>
    extension_requests?: Array<{ status: string }>
  }

  return ((data ?? []) as unknown as TaskQueryRow[]).map((t) => ({
    ...t,
    is_overdue: isOverdue(t.due_date, t.status),
    comments_count: t.comments?.[0]?.count ?? 0,
    has_pending_extension: (t.extension_requests ?? []).some((e) => e.status === 'pending'),
  }))
}

export async function createTask(
  input: CreateTaskInput,
  createdById: string
): Promise<ActionResult<Task>> {
  // Use service client so the INSERT bypasses RLS.
  // Auth check (admin only) is enforced in the Server Action before calling this.
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...input,
      created_by: createdById,
      status: 'not_started',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Task, error: null }
}

export async function updateTaskStatus(
  taskId: string,
  status: Task['status'],
  extra?: { blocked_reason?: string }
): Promise<ActionResult<Task>> {
  const supabase = await createClient()

  const update: Record<string, unknown> = { status }
  if (extra?.blocked_reason) {
    update.description = extra.blocked_reason // or a separate field if added later
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(update)
    .eq('id', taskId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Task, error: null }
}

export async function getCommandDashboardStats(): Promise<{
  open: number
  overdue: number
  dueThisWeek: number
  awaitingReview: number
  blocked: number
}> {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, due_date')
    .eq('archived', false)

  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const open = tasks?.filter((t) =>
    !['approved', 'archived'].includes(t.status)
  ).length ?? 0

  const overdue = tasks?.filter((t) =>
    isOverdue(t.due_date, t.status)
  ).length ?? 0

  const dueThisWeek = tasks?.filter((t) => {
    if (!t.due_date || t.status === 'approved') return false
    const d = new Date(t.due_date)
    return d >= now && d <= weekEnd
  }).length ?? 0

  const awaitingReview = tasks?.filter((t) => t.status === 'submitted').length ?? 0
  const blocked = tasks?.filter((t) => t.status === 'blocked').length ?? 0

  return { open, overdue, dueThisWeek, awaitingReview, blocked }
}

export async function getHeadDashboardStats(pillarId: string): Promise<{
  assigned: number
  inProgress: number
  dueThisWeek: number
  returned: number
  approvedThisMonth: number
}> {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, due_date, updated_at')
    .eq('pillar_id', pillarId)
    .eq('archived', false)

  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const assigned = tasks?.filter((t) => t.status !== 'approved').length ?? 0
  const inProgress = tasks?.filter((t) => t.status === 'in_progress').length ?? 0
  const dueThisWeek = tasks?.filter((t) => {
    if (!t.due_date || t.status === 'approved') return false
    const d = new Date(t.due_date)
    return d >= now && d <= weekEnd
  }).length ?? 0
  const returned = tasks?.filter((t) => t.status === 'returned').length ?? 0
  const approvedThisMonth = tasks?.filter((t) => {
    if (t.status !== 'approved') return false
    return new Date(t.updated_at) >= monthStart
  }).length ?? 0

  return { assigned, inProgress, dueThisWeek, returned, approvedThisMonth }
}

export async function getPillarWorkloadStats(): Promise<PillarWorkload[]> {
  const supabase = await createClient()
  const pillars = await getAllPillars()

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, pillar_id, status, due_date, updated_at')
    .eq('archived', false)

  if (error) {
    console.error('Error fetching tasks for workload:', error)
    return pillars.map((p) => ({
      pillar: p,
      open: 0,
      overdue: 0,
      completedThisMonth: 0,
      totalAssigned: 0,
      capacityPercentage: 0,
    }))
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return pillars.map((pillar) => {
    const pillarTasks = tasks?.filter((t) => t.pillar_id === pillar.id) ?? []
    const open = pillarTasks.filter((t) => t.status !== 'approved').length
    const overdue = pillarTasks.filter((t) => isOverdue(t.due_date, t.status)).length
    const completedThisMonth = pillarTasks.filter(
      (t) => t.status === 'approved' && new Date(t.updated_at) >= monthStart
    ).length
    const totalAssigned = pillarTasks.length
    const capacityPercentage =
      totalAssigned > 0 ? Math.min(100, Math.round((open / totalAssigned) * 100)) : 0

    return {
      pillar,
      open,
      overdue,
      completedThisMonth,
      totalAssigned,
      capacityPercentage,
    }
  })
}

export async function bulkReassignTasks(
  taskIds: string[],
  newAssigneeId: string
): Promise<ActionResult<{ count: number }>> {
  if (taskIds.length === 0) return { data: { count: 0 }, error: null }
  const supabase = await createClient()

  // 1. Fetch selected tasks to verify their pillar
  const { data: tasks, error: fetchErr } = await supabase
    .from('tasks')
    .select('id, pillar_id, assignee_id')
    .in('id', taskIds)

  if (fetchErr || !tasks || tasks.length === 0) {
    return { data: null, error: fetchErr?.message || 'Tasks not found' }
  }

  // Check if tasks belong to different pillars
  const firstPillarId = tasks[0].pillar_id
  const hasMixedPillars = tasks.some((t) => t.pillar_id !== firstPillarId)
  if (hasMixedPillars) {
    return {
      data: null,
      error: 'Cannot bulk reassign tasks from multiple different pillars. All selected tasks must belong to the same pillar.',
    }
  }

  // 2. Fetch new assignee and check pillar_id
  const { data: assignee, error: userErr } = await supabase
    .from('users')
    .select('id, pillar_id, full_name')
    .eq('id', newAssigneeId)
    .single()

  if (userErr || !assignee) {
    return { data: null, error: 'Assignee not found' }
  }

  if (assignee.pillar_id !== firstPillarId) {
    return {
      data: null,
      error: `Cannot reassign across pillars. Selected tasks belong to a different pillar than ${assignee.full_name}.`,
    }
  }

  // 3. Update all tasks
  const { error: updateErr } = await supabase
    .from('tasks')
    .update({ assignee_id: newAssigneeId })
    .in('id', taskIds)

  if (updateErr) return { data: null, error: updateErr.message }

  return { data: { count: taskIds.length }, error: null }
}

export async function bulkUpdateDueDate(
  taskIds: string[],
  dueDate: string
): Promise<ActionResult<{ count: number }>> {
  if (taskIds.length === 0) return { data: { count: 0 }, error: null }
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ due_date: dueDate })
    .in('id', taskIds)

  if (error) return { data: null, error: error.message }
  return { data: { count: taskIds.length }, error: null }
}

export async function bulkUpdatePriority(
  taskIds: string[],
  priority: TaskPriority
): Promise<ActionResult<{ count: number }>> {
  if (taskIds.length === 0) return { data: { count: 0 }, error: null }
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ priority })
    .in('id', taskIds)

  if (error) return { data: null, error: error.message }
  return { data: { count: taskIds.length }, error: null }
}

export async function stopTaskRecurrence(taskId: string): Promise<ActionResult<Task>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .update({ recurrence: 'none' })
    .eq('id', taskId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Task, error: null }
}

