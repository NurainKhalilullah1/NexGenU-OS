// app/(dashboard)/head/actions.ts — Server Actions for head mutations
'use server'

import { createClient } from '@/lib/supabase/server'
import { getTaskById, updateTaskStatus } from '@/lib/db/tasks'
import { addTaskLog } from '@/lib/db/task-logs'
import { createSubmission } from '@/lib/db/submissions'
import { addAuditLog } from '@/lib/db/audit-log'
import { createNotifications } from '@/lib/db/notifications'
import { updateTaskStatusSchema, UpdateTaskStatusInput } from '@/lib/validations/task'
import { addWorkLogSchema, submitTaskSchema } from '@/lib/validations/submission'
import type { ActionResult, Task, TaskLog, Submission } from '@/types/database'
import { revalidatePath } from 'next/cache'

async function getHeadUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'head' || !profile.pillar_id) return null
  return profile
}

export async function updateHeadTaskStatusAction(
  taskId: string,
  status: 'in_progress' | 'blocked',
  blockedReason?: string
): Promise<ActionResult<Task>> {
  const head = await getHeadUser()
  if (!head) return { data: null, error: 'Unauthorized: only pillar heads may perform this action' }

  const task = await getTaskById(taskId)
  if (!task) return { data: null, error: 'Task not found' }

  // Enforce pillar isolation
  if (task.pillar_id !== head.pillar_id) {
    return { data: null, error: 'Access denied: task belongs to another pillar' }
  }

  const parsed = updateTaskStatusSchema.safeParse({
    task_id: taskId,
    status,
    blocked_reason: blockedReason,
  })

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message || 'Invalid status transition' }
  }

  const prevStatus = task.status
  const result = await updateTaskStatus(taskId, status, {
    blocked_reason: blockedReason,
  })

  if (result.error) return result

  await addAuditLog({
    actor_id: head.id,
    action: status === 'blocked' ? 'task.blocked' : 'task.started',
    entity: 'tasks',
    entity_id: taskId,
    before: { status: prevStatus },
    after: { status, blocked_reason: blockedReason ?? null },
  })

  revalidatePath('/head')
  revalidatePath(`/head/tasks/${taskId}`)
  revalidatePath('/command')
  revalidatePath(`/command/tasks/${taskId}`)

  return result
}

export async function addWorkLogAction(formData: FormData): Promise<ActionResult<TaskLog>> {
  const head = await getHeadUser()
  if (!head) return { data: null, error: 'Unauthorized' }

  const taskId = formData.get('task_id') as string
  const task = await getTaskById(taskId)
  if (!task) return { data: null, error: 'Task not found' }

  if (task.pillar_id !== head.pillar_id) {
    return { data: null, error: 'Access denied: task belongs to another pillar' }
  }

  const hoursRaw = formData.get('hours') as string
  const hours = hoursRaw ? parseFloat(hoursRaw) : undefined

  const raw = {
    task_id: taskId,
    log_date: formData.get('log_date') as string,
    hours: isNaN(hours as number) ? undefined : hours,
    note: (formData.get('note') as string) || '',
  }

  const parsed = addWorkLogSchema.safeParse(raw)
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message || 'Invalid work log data' }
  }

  const result = await addTaskLog(parsed.data, head.id)
  if (result.error) return result

  await addAuditLog({
    actor_id: head.id,
    action: 'work_log.created',
    entity: 'task_logs',
    entity_id: result.data!.id,
    before: null,
    after: { task_id: taskId, hours: parsed.data.hours, log_date: parsed.data.log_date },
  })

  revalidatePath(`/head/tasks/${taskId}`)
  revalidatePath(`/command/tasks/${taskId}`)

  return result
}

export async function submitTaskAction(formData: FormData): Promise<ActionResult<Submission>> {
  const head = await getHeadUser()
  if (!head) return { data: null, error: 'Unauthorized' }

  const taskId = formData.get('task_id') as string
  const task = await getTaskById(taskId)
  if (!task) return { data: null, error: 'Task not found' }

  if (task.pillar_id !== head.pillar_id) {
    return { data: null, error: 'Access denied: task belongs to another pillar' }
  }

  const linksRaw = formData.getAll('links') as string[]
  const links = linksRaw.map((l) => l.trim()).filter((l) => l.length > 0)
  const filePathsRaw = formData.getAll('file_paths') as string[]
  const filePaths = filePathsRaw.map((f) => f.trim()).filter((f) => f.length > 0)

  const raw = {
    task_id: taskId,
    note: (formData.get('note') as string) || '',
    links,
    file_paths: filePaths,
  }

  const parsed = submitTaskSchema.safeParse(raw)
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message || 'Invalid submission data' }
  }

  const subResult = await createSubmission(parsed.data, head.id)
  if (subResult.error) return subResult

  // Transition task to 'submitted'
  const taskResult = await updateTaskStatus(taskId, 'submitted')
  if (taskResult.error) return { data: null, error: taskResult.error }

  await addAuditLog({
    actor_id: head.id,
    action: 'submission.created',
    entity: 'submissions',
    entity_id: subResult.data!.id,
    before: { status: task.status },
    after: { status: 'submitted', links: parsed.data.links, file_paths: parsed.data.file_paths },
  })

  // Notify admins (in-app)
  const supabase = await createClient()
  const { data: admins } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'admin')
    .eq('active', true)

  if (admins && admins.length > 0) {
    const notifs = admins.map((admin) => ({
      user_id: admin.id,
      type: 'submission_received' as const,
      task_id: taskId,
      message: `${head.full_name} submitted work for review: "${task.title}"`,
    }))
    await createNotifications(notifs)
  }

  // Send Google SMTP email to admins
  const { sendWorkSubmittedEmail } = await import('@/lib/email/notifications')
  await sendWorkSubmittedEmail({
    headName: head.full_name,
    pillarName: task.pillar?.name || 'Pillar',
    taskTitle: task.title,
    taskId: task.id,
    note: parsed.data.note,
    attachmentCount: parsed.data.file_paths ? parsed.data.file_paths.length : 0,
  })

  revalidatePath('/head')
  revalidatePath(`/head/tasks/${taskId}`)
  revalidatePath('/command')
  revalidatePath('/command/review')
  revalidatePath(`/command/tasks/${taskId}`)

  return subResult
}
