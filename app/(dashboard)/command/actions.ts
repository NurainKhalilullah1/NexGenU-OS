// app/(dashboard)/command/actions.ts — Server Actions for admin mutations
'use server'

import { createClient } from '@/lib/supabase/server'
import { createTaskSchema } from '@/lib/validations/task'
import { createTask, updateTaskStatus } from '@/lib/db/tasks'
import { reviewSubmission } from '@/lib/db/submissions'
import { createNotifications } from '@/lib/db/notifications'
import { addAuditLog } from '@/lib/db/audit-log'
import type { ActionResult, Task } from '@/types/database'
import { revalidatePath } from 'next/cache'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return null
  return profile
}

export async function createTaskAction(formData: FormData): Promise<ActionResult<Task>> {
  const admin = await getAdminUser()
  if (!admin) return { data: null, error: 'Unauthorized' }

  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || '',
    pillar_id: formData.get('pillar_id') as string,
    assignee_id: (formData.get('assignee_id') as string) || null,
    priority: formData.get('priority') as string || 'medium',
    due_date: (formData.get('due_date') as string) || null,
    kpi_ref: (formData.get('kpi_ref') as string) || null,
    recurrence: 'none' as const,
  }

  const parsed = createTaskSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    return { data: null, error: firstError.message }
  }

  const result = await createTask(parsed.data, admin.id)
  if (result.error) return result

  const task = result.data!

  // Audit log
  await addAuditLog({
    actor_id: admin.id,
    action: 'task.created',
    entity: 'tasks',
    entity_id: task.id,
    before: null,
    after: { title: task.title, status: task.status, priority: task.priority },
  })

  // Notify assignee
  if (task.assignee_id) {
    await createNotifications([{
      user_id: task.assignee_id,
      type: 'task_assigned',
      task_id: task.id,
      message: `New task assigned to you: "${task.title}"`,
    }])
  }

  revalidatePath('/command')
  revalidatePath('/head')
  return result
}

export async function approveSubmissionAction(
  submissionId: string,
  taskId: string,
  assigneeId: string
): Promise<ActionResult<null>> {
  const admin = await getAdminUser()
  if (!admin) return { data: null, error: 'Unauthorized' }

  const supabase = await createClient()
  const { data: taskBefore } = await supabase.from('tasks').select('status').eq('id', taskId).single()

  const subResult = await reviewSubmission(submissionId, 'approved', null, admin.id)
  if (subResult.error) return { data: null, error: subResult.error }

  const taskResult = await updateTaskStatus(taskId, 'approved')
  if (taskResult.error) return { data: null, error: taskResult.error }

  await addAuditLog({
    actor_id: admin.id,
    action: 'submission.approved',
    entity: 'submissions',
    entity_id: submissionId,
    before: { status: taskBefore?.status },
    after: { status: 'approved' },
  })

  await createNotifications([{
    user_id: assigneeId,
    type: 'submission_approved',
    task_id: taskId,
    message: 'Your submission was approved! 🎉',
  }])

  revalidatePath('/command')
  revalidatePath('/head')
  return { data: null, error: null }
}

export async function returnSubmissionAction(
  submissionId: string,
  taskId: string,
  assigneeId: string,
  feedback: string
): Promise<ActionResult<null>> {
  const admin = await getAdminUser()
  if (!admin) return { data: null, error: 'Unauthorized' }

  if (!feedback || feedback.trim().length < 10) {
    return { data: null, error: 'Feedback must be at least 10 characters' }
  }

  const supabase = await createClient()
  const { data: taskBefore } = await supabase.from('tasks').select('status').eq('id', taskId).single()

  const subResult = await reviewSubmission(submissionId, 'returned', feedback, admin.id)
  if (subResult.error) return { data: null, error: subResult.error }

  const taskResult = await updateTaskStatus(taskId, 'returned')
  if (taskResult.error) return { data: null, error: taskResult.error }

  await addAuditLog({
    actor_id: admin.id,
    action: 'submission.returned',
    entity: 'submissions',
    entity_id: submissionId,
    before: { status: taskBefore?.status },
    after: { status: 'returned', feedback },
  })

  await createNotifications([{
    user_id: assigneeId,
    type: 'submission_returned',
    task_id: taskId,
    message: `Your submission was returned with feedback: "${feedback.slice(0, 80)}${feedback.length > 80 ? '…' : ''}"`,
  }])

  revalidatePath('/command')
  revalidatePath('/head')
  return { data: null, error: null }
}
