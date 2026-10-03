// app/(dashboard)/command/actions.ts — Server Actions for admin mutations
'use server'

import { createClient } from '@/lib/supabase/server'
import { createTaskSchema } from '@/lib/validations/task'
import {
  createTask,
  updateTaskStatus,
  bulkReassignTasks,
  bulkUpdateDueDate,
  bulkUpdatePriority,
  stopTaskRecurrence,
} from '@/lib/db/tasks'
import { reviewSubmission } from '@/lib/db/submissions'
import { createNotifications } from '@/lib/db/notifications'
import { addAuditLog } from '@/lib/db/audit-log'
import {
  sendTaskAssignedEmail,
  sendSubmissionApprovedEmail,
  sendSubmissionReturnedEmail,
} from '@/lib/email/notifications'
import type { ActionResult, Task, TaskRecurrence, TaskPriority } from '@/types/database'
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

  const recurrenceValue = (formData.get('recurrence') as string) || 'none'
  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || '',
    pillar_id: formData.get('pillar_id') as string,
    assignee_id: (formData.get('assignee_id') as string) || null,
    priority: formData.get('priority') as string || 'medium',
    due_date: (formData.get('due_date') as string) || null,
    kpi_ref: (formData.get('kpi_ref') as string) || null,
    recurrence: recurrenceValue as TaskRecurrence,
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
    after: { title: task.title, status: task.status, priority: task.priority, recurrence: task.recurrence },
  })

  // Notify assignee and pillar team (heads + members)
  const supabase = await createClient()

  if (task.assignee_id) {
    // Notify the specific assignee (head or member)
    await createNotifications([{
      user_id: task.assignee_id,
      type: 'task_assigned',
      task_id: task.id,
      message: `New task assigned to you: "${task.title}"`,
    }])

    sendTaskAssignedEmail({
      recipientId: task.assignee_id,
      taskTitle: task.title,
      dueDate: task.due_date,
      priority: task.priority,
      taskId: task.id,
    }).catch(console.error)

    // Also notify other active members and heads in this pillar
    if (task.pillar_id) {
      const { data: pillarTeam } = await supabase
        .from('users')
        .select('id, role')
        .eq('pillar_id', task.pillar_id)
        .in('role', ['head', 'member'])
        .neq('id', task.assignee_id)
        .eq('active', true)

      if (pillarTeam && pillarTeam.length > 0) {
        await createNotifications(
          pillarTeam.map((u) => ({
            user_id: u.id,
            type: 'task_assigned' as const,
            task_id: task.id,
            message: `New task added to your pillar: "${task.title}"`,
          }))
        )
        for (const u of pillarTeam) {
          sendTaskAssignedEmail({
            recipientId: u.id,
            taskTitle: task.title,
            dueDate: task.due_date,
            priority: task.priority,
            taskId: task.id,
          }).catch(console.error)
        }
      }
    }
  } else if (task.pillar_id) {
    // Unassigned task: notify ALL active heads AND members of this pillar
    const { data: pillarTeam } = await supabase
      .from('users')
      .select('id, role')
      .eq('pillar_id', task.pillar_id)
      .in('role', ['head', 'member'])
      .eq('active', true)

    if (pillarTeam && pillarTeam.length > 0) {
      await createNotifications(
        pillarTeam.map((u) => ({
          user_id: u.id,
          type: 'task_assigned' as const,
          task_id: task.id,
          message: `New task added to your pillar: "${task.title}"`,
        }))
      )
      for (const u of pillarTeam) {
        sendTaskAssignedEmail({
          recipientId: u.id,
          taskTitle: task.title,
          dueDate: task.due_date,
          priority: task.priority,
          taskId: task.id,
        }).catch(console.error)
      }
    }
  }

  revalidatePath('/command')
  revalidatePath('/command/tasks')
  revalidatePath('/head')
  revalidatePath('/member')
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
  const { data: taskBefore } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

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

  sendSubmissionApprovedEmail({
    headId: assigneeId,
    taskTitle: taskBefore?.title ?? 'Task',
    taskId,
    feedback: null,
  }).catch(console.error)

  // Phase 3: Check recurrence on the task
  if (taskBefore && taskBefore.recurrence && taskBefore.recurrence !== 'none') {
    let nextDueDate: string | null = null
    const baseDate = taskBefore.due_date ? new Date(taskBefore.due_date) : new Date()

    if (taskBefore.recurrence === 'weekly') {
      const nextDate = new Date(baseDate)
      nextDate.setDate(nextDate.getDate() + 7)
      nextDueDate = nextDate.toISOString().split('T')[0]
    } else if (taskBefore.recurrence === 'monthly') {
      const nextDate = new Date(baseDate)
      nextDate.setMonth(nextDate.getMonth() + 1)
      nextDueDate = nextDate.toISOString().split('T')[0]
    } else if (taskBefore.recurrence === 'biweekly') {
      const nextDate = new Date(baseDate)
      nextDate.setDate(nextDate.getDate() + 14)
      nextDueDate = nextDate.toISOString().split('T')[0]
    }

    const newInstanceResult = await createTask(
      {
        title: taskBefore.title,
        description: taskBefore.description || '',
        pillar_id: taskBefore.pillar_id,
        assignee_id: taskBefore.assignee_id,
        priority: taskBefore.priority,
        due_date: nextDueDate,
        kpi_ref: taskBefore.kpi_ref,
        recurrence: taskBefore.recurrence,
      },
      admin.id
    )

    if (newInstanceResult.data) {
      const nextTask = newInstanceResult.data
      await addAuditLog({
        actor_id: admin.id,
        action: 'task.recurring_instance_created',
        entity: 'tasks',
        entity_id: nextTask.id,
        before: { parent_task_id: taskId },
        after: {
          title: nextTask.title,
          recurrence: nextTask.recurrence,
          due_date: nextDueDate,
        },
      })

      if (nextTask.assignee_id) {
        await createNotifications([
          {
            user_id: nextTask.assignee_id,
            type: 'task_assigned',
            task_id: nextTask.id,
            message: `New recurring instance created: "${nextTask.title}"`,
          },
        ])
      }
    }
  }

  revalidatePath('/command')
  revalidatePath('/command/tasks')
  revalidatePath('/head')
  return { data: null, error: null }
}

export async function stopTaskRecurrenceAction(taskId: string): Promise<ActionResult<null>> {
  const admin = await getAdminUser()
  if (!admin) return { data: null, error: 'Unauthorized' }

  const supabase = await createClient()
  const { data: before } = await supabase.from('tasks').select('recurrence').eq('id', taskId).single()

  const result = await stopTaskRecurrence(taskId)
  if (result.error) return { data: null, error: result.error }

  await addAuditLog({
    actor_id: admin.id,
    action: 'task.recurrence_stopped',
    entity: 'tasks',
    entity_id: taskId,
    before: { recurrence: before?.recurrence },
    after: { recurrence: 'none' },
  })

  revalidatePath('/command')
  revalidatePath('/command/tasks')
  revalidatePath(`/command/tasks/${taskId}`)
  revalidatePath('/head')
  return { data: null, error: null }
}

export async function bulkReassignAction(
  taskIds: string[],
  newAssigneeId: string
): Promise<ActionResult<{ count: number }>> {
  const admin = await getAdminUser()
  if (!admin) return { data: null, error: 'Unauthorized' }

  if (!taskIds || taskIds.length === 0) {
    return { data: null, error: 'No tasks selected' }
  }

  const result = await bulkReassignTasks(taskIds, newAssigneeId)
  if (result.error) return result

  // Write ONE grouped audit_log entry
  await addAuditLog({
    actor_id: admin.id,
    action: 'bulk_reassign',
    entity: 'tasks',
    entity_id: taskIds[0],
    before: { taskIds },
    after: { newAssigneeId, count: taskIds.length },
  })

  // Notify new assignee ONCE with count
  await createNotifications([
    {
      user_id: newAssigneeId,
      type: 'task_assigned',
      task_id: taskIds[0],
      message: `You have been assigned ${taskIds.length} tasks`,
    },
  ])

  revalidatePath('/command')
  revalidatePath('/command/tasks')
  revalidatePath('/head')
  return result
}

export async function bulkChangeDueDateAction(
  taskIds: string[],
  dueDate: string
): Promise<ActionResult<{ count: number }>> {
  const admin = await getAdminUser()
  if (!admin) return { data: null, error: 'Unauthorized' }

  if (!taskIds || taskIds.length === 0) {
    return { data: null, error: 'No tasks selected' }
  }

  const result = await bulkUpdateDueDate(taskIds, dueDate)
  if (result.error) return result

  await addAuditLog({
    actor_id: admin.id,
    action: 'bulk_change_due_date',
    entity: 'tasks',
    entity_id: taskIds[0],
    before: { taskIds },
    after: { due_date: dueDate, count: taskIds.length },
  })

  revalidatePath('/command')
  revalidatePath('/command/tasks')
  revalidatePath('/head')
  return result
}

export async function bulkChangePriorityAction(
  taskIds: string[],
  priority: TaskPriority
): Promise<ActionResult<{ count: number }>> {
  const admin = await getAdminUser()
  if (!admin) return { data: null, error: 'Unauthorized' }

  if (!taskIds || taskIds.length === 0) {
    return { data: null, error: 'No tasks selected' }
  }

  const result = await bulkUpdatePriority(taskIds, priority)
  if (result.error) return result

  await addAuditLog({
    actor_id: admin.id,
    action: 'bulk_change_priority',
    entity: 'tasks',
    entity_id: taskIds[0],
    before: { taskIds },
    after: { priority, count: taskIds.length },
  })

  revalidatePath('/command')
  revalidatePath('/command/tasks')
  revalidatePath('/head')
  return result
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
  const { data: taskBefore } = await supabase.from('tasks').select('status, title').eq('id', taskId).single()

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

  sendSubmissionReturnedEmail({
    headId: assigneeId,
    taskTitle: taskBefore?.title ?? 'Task',
    taskId,
    feedback,
  }).catch(console.error)

  revalidatePath('/command')
  revalidatePath('/head')
  return { data: null, error: null }
}
