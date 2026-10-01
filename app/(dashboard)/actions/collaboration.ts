// app/(dashboard)/actions/collaboration.ts
// Server Actions for Phase 2: Comments, Extensions, File Downloads, Notification Settings
'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTaskById } from '@/lib/db/tasks'
import { addComment } from '@/lib/db/comments'
import {
  createExtensionRequest,
  decideExtensionRequest,
  getPendingExtensionForTask,
} from '@/lib/db/extensions'
import { createNotifications } from '@/lib/db/notifications'
import { addAuditLog } from '@/lib/db/audit-log'
import {
  sendNewCommentEmail,
  sendExtensionRequestedEmail,
  sendExtensionDecidedEmail,
} from '@/lib/email/notifications'
import { updateNotificationSettings } from '@/lib/db/notification-settings'
import { addCommentSchema } from '@/lib/validations/comment'
import { requestExtensionSchema } from '@/lib/validations/extension'
import type {
  ActionResult,
  Comment,
  ExtensionRequest,
  NotificationSettings,
  User,
} from '@/types/database'
import { revalidatePath } from 'next/cache'

async function getCurrentUserWithProfile(): Promise<{ user: User; profile: User } | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*, pillar:pillars(id, name, nickname)')
    .eq('id', authUser.id)
    .single()

  if (!profile) return null
  return { user: profile as User, profile: profile as User }
}

// ==========================================
// PART A: COMMENTS
// ==========================================

export async function addCommentAction(formData: FormData): Promise<ActionResult<Comment>> {
  const session = await getCurrentUserWithProfile()
  if (!session) return { data: null, error: 'Unauthorized' }

  const user = session.profile
  const taskId = formData.get('task_id') as string
  const body = (formData.get('body') as string) || ''

  const parsed = addCommentSchema.safeParse({ task_id: taskId, body })
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message || 'Invalid comment' }
  }

  const task = await getTaskById(taskId)
  if (!task) return { data: null, error: 'Task not found' }

  // Security: Head can only comment on tasks belonging to their pillar
  if (user.role === 'head' && task.pillar_id !== user.pillar_id) {
    return { data: null, error: 'Access denied: task belongs to another pillar' }
  }

  // 1. Add comment
  const result = await addComment(taskId, body, user.id)
  if (result.error || !result.data) return result

  // 2. Notifications & Emails to the other party
  const serviceClient = createServiceClient()

  if (user.role === 'head') {
    // Head commented -> notify admins
    const { data: admins } = await serviceClient
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'admin')
      .eq('active', true)

    if (admins && admins.length > 0) {
      await createNotifications(
        admins.map((admin) => ({
          user_id: admin.id,
          type: 'new_comment' as const,
          task_id: task.id,
          message: `${user.full_name} commented on "${task.title}"`,
        }))
      )

      for (const admin of admins) {
        await sendNewCommentEmail({
          recipientId: admin.id,
          commenterName: user.full_name,
          taskTitle: task.title,
          commentBody: body,
          taskId: task.id,
          isAdmin: true,
        })
      }
    }
  } else {
    // Admin commented -> notify task assignee (Head)
    if (task.assignee_id && task.assignee_id !== user.id) {
      await createNotifications([
        {
          user_id: task.assignee_id,
          type: 'new_comment' as const,
          task_id: task.id,
          message: `${user.full_name} commented on "${task.title}"`,
        },
      ])

      await sendNewCommentEmail({
        recipientId: task.assignee_id,
        commenterName: user.full_name,
        taskTitle: task.title,
        commentBody: body,
        taskId: task.id,
        isAdmin: false,
      })
    }
  }

  revalidatePath(`/command/tasks/${taskId}`)
  revalidatePath(`/head/tasks/${taskId}`)

  return result
}

// ==========================================
// PART B: EXTENSION REQUESTS
// ==========================================

export async function requestExtensionAction(formData: FormData): Promise<ActionResult<ExtensionRequest>> {
  const session = await getCurrentUserWithProfile()
  if (!session) return { data: null, error: 'Unauthorized' }

  const user = session.profile
  if (user.role !== 'head') {
    return { data: null, error: 'Only pillar heads can request deadline extensions' }
  }

  const taskId = formData.get('task_id') as string
  const requestedDate = formData.get('requested_date') as string
  const reason = (formData.get('reason') as string) || ''

  const parsed = requestExtensionSchema.safeParse({
    task_id: taskId,
    requested_date: requestedDate,
    reason,
  })

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message || 'Invalid extension request' }
  }

  const task = await getTaskById(taskId)
  if (!task) return { data: null, error: 'Task not found' }

  // Security: Head must own pillar
  if (task.pillar_id !== user.pillar_id) {
    return { data: null, error: 'Access denied: task belongs to another pillar' }
  }

  // Cannot request extension if approved or submitted
  if (task.status === 'approved' || task.status === 'submitted') {
    return { data: null, error: `Cannot request extension for a task that is ${task.status}` }
  }

  if (task.due_date && requestedDate <= task.due_date) {
    return { data: null, error: 'Proposed due date must be after current due date' }
  }

  // Only one pending request per task
  const existingPending = await getPendingExtensionForTask(taskId)
  if (existingPending) {
    return { data: null, error: 'A pending extension request already exists for this task' }
  }

  const result = await createExtensionRequest({
    taskId,
    requesterId: user.id,
    originalDate: task.due_date || new Date().toISOString().split('T')[0],
    requestedDate,
    reason,
  })

  if (result.error || !result.data) return result

  // Audit log
  await addAuditLog({
    actor_id: user.id,
    action: 'extension.requested',
    entity: 'extension_requests',
    entity_id: result.data.id,
    before: { due_date: task.due_date },
    after: { requested_date: requestedDate, reason },
  })

  // Notify all admins (in-app + email)
  const serviceClient = createServiceClient()
  const { data: admins } = await serviceClient
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'admin')
    .eq('active', true)

  if (admins && admins.length > 0) {
    await createNotifications(
      admins.map((admin) => ({
        user_id: admin.id,
        type: 'extension_requested' as const,
        task_id: task.id,
        message: `${user.full_name} requested extension for "${task.title}" to ${requestedDate}`,
      }))
    )

    const pillarName = task.pillar?.name || 'Pillar'
    await sendExtensionRequestedEmail({
      headName: user.full_name,
      pillarName,
      taskTitle: task.title,
      currentDueDate: task.due_date || 'None',
      requestedDueDate: requestedDate,
      reason,
      taskId: task.id,
    })
  }

  revalidatePath('/command')
  revalidatePath('/head')
  revalidatePath(`/head/tasks/${taskId}`)
  revalidatePath(`/command/tasks/${taskId}`)

  return result
}

export async function approveExtensionAction(requestId: string): Promise<ActionResult<ExtensionRequest>> {
  const session = await getCurrentUserWithProfile()
  if (!session || session.profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized: only admins may approve extension requests' }
  }

  const admin = session.profile

  const result = await decideExtensionRequest({
    requestId,
    decision: 'approved',
    reviewerId: admin.id,
    decisionNote: null,
  })

  if (result.error || !result.data) return result

  const req = result.data

  // Audit log
  await addAuditLog({
    actor_id: admin.id,
    action: 'extension.approved',
    entity: 'extension_requests',
    entity_id: req.id,
    before: { original_date: req.original_date },
    after: { requested_date: req.requested_date, status: 'approved' },
  })

  // Notify head (in-app + email)
  if (req.requester_id) {
    const taskTitle = req.task?.title || 'task'
    await createNotifications([
      {
        user_id: req.requester_id,
        type: 'extension_decided',
        task_id: req.task_id,
        message: `Your extension request for "${taskTitle}" was approved. New due date: ${req.requested_date}`,
      },
    ])

    await sendExtensionDecidedEmail({
      requesterId: req.requester_id,
      taskTitle,
      decision: 'approved',
      newDueDate: req.requested_date,
      decisionNote: null,
      taskId: req.task_id,
    })
  }

  revalidatePath('/command')
  revalidatePath('/head')
  revalidatePath(`/command/tasks/${req.task_id}`)
  revalidatePath(`/head/tasks/${req.task_id}`)

  return result
}

export async function declineExtensionAction(
  requestId: string,
  decisionNote: string
): Promise<ActionResult<ExtensionRequest>> {
  const session = await getCurrentUserWithProfile()
  if (!session || session.profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized: only admins may decline extension requests' }
  }

  if (!decisionNote || decisionNote.trim().length < 3) {
    return { data: null, error: 'A decline explanation note is required (minimum 3 characters)' }
  }

  const admin = session.profile

  const result = await decideExtensionRequest({
    requestId,
    decision: 'declined',
    reviewerId: admin.id,
    decisionNote: decisionNote.trim(),
  })

  if (result.error || !result.data) return result

  const req = result.data

  // Audit log
  await addAuditLog({
    actor_id: admin.id,
    action: 'extension.declined',
    entity: 'extension_requests',
    entity_id: req.id,
    before: { status: 'pending' },
    after: { status: 'declined', decision_note: decisionNote.trim() },
  })

  // Notify head (in-app + email)
  if (req.requester_id) {
    const taskTitle = req.task?.title || 'task'
    await createNotifications([
      {
        user_id: req.requester_id,
        type: 'extension_decided',
        task_id: req.task_id,
        message: `Your extension request for "${taskTitle}" was declined: "${decisionNote.trim()}"`,
      },
    ])

    await sendExtensionDecidedEmail({
      requesterId: req.requester_id,
      taskTitle,
      decision: 'declined',
      decisionNote: decisionNote.trim(),
      taskId: req.task_id,
    })
  }

  revalidatePath('/command')
  revalidatePath('/head')
  revalidatePath(`/command/tasks/${req.task_id}`)
  revalidatePath(`/head/tasks/${req.task_id}`)

  return result
}

// ==========================================
// PART C: FILE DOWNLOAD (SIGNED URL)
// ==========================================

export async function getSubmissionFileSignedUrlAction(
  filePath: string
): Promise<ActionResult<{ url: string }>> {
  const session = await getCurrentUserWithProfile()
  if (!session) return { data: null, error: 'Unauthorized' }

  if (!filePath || filePath.trim().length === 0) {
    return { data: null, error: 'File path required' }
  }

  // Security check: parse taskId from filePath "task-submissions/{taskId}/{userId}/{filename}" or verify access
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient.storage
    .from('task-submissions')
    .createSignedUrl(filePath, 60) // 60s expiry as required by spec

  if (error || !data) {
    return { data: null, error: error?.message || 'Failed to generate download URL' }
  }

  return { data: { url: data.signedUrl }, error: null }
}

// ==========================================
// PART E: NOTIFICATION SETTINGS
// ==========================================

export async function updateNotificationSettingsAction(
  settings: Partial<NotificationSettings>
): Promise<ActionResult<NotificationSettings>> {
  const session = await getCurrentUserWithProfile()
  if (!session) return { data: null, error: 'Unauthorized' }

  const result = await updateNotificationSettings(session.user.id, settings)
  revalidatePath('/settings/notifications')
  return result
}
