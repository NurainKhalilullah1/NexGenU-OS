// lib/email/notifications.ts
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from './send'
import {
  taskAssignedEmail,
  taskOverdueEmail,
  workSubmittedEmail,
  submissionApprovedEmail,
  submissionReturnedEmail,
  extensionRequestedEmail,
  extensionDecidedEmail,
  newCommentEmail,
} from './templates'
import { shouldSendEmail } from '@/lib/db/notification-settings'

export async function sendTaskAssignedEmail(params: {
  headId: string
  taskTitle: string
  dueDate: string | null
  priority: string
  taskId: string
}) {
  const allowed = await shouldSendEmail(params.headId, 'task_assigned')
  if (!allowed) return

  const supabase = createServiceClient()
  const { data: user } = await supabase.from('users').select('full_name, email').eq('id', params.headId).single()
  if (!user || !user.email) return

  const emailData = taskAssignedEmail({
    headName: user.full_name || 'Team Lead',
    taskTitle: params.taskTitle,
    dueDate: params.dueDate,
    priority: params.priority,
    taskId: params.taskId,
  })

  await sendEmail({
    to: user.email,
    subject: emailData.subject,
    html: emailData.html,
  })
}

export async function sendWorkSubmittedEmail(params: {
  headName: string
  pillarName: string
  taskTitle: string
  taskId: string
  note?: string
  attachmentCount: number
}) {
  const supabase = createServiceClient()
  // Fetch active admins
  const { data: admins } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('role', 'admin')
    .eq('active', true)

  if (!admins || admins.length === 0) return

  const emailData = workSubmittedEmail({
    headName: params.headName,
    pillarName: params.pillarName,
    taskTitle: params.taskTitle,
    taskId: params.taskId,
    note: params.note,
    attachmentCount: params.attachmentCount,
  })

  for (const admin of admins) {
    if (!admin.email) continue
    const allowed = await shouldSendEmail(admin.id, 'submission_received')
    if (allowed) {
      await sendEmail({
        to: admin.email,
        subject: emailData.subject,
        html: emailData.html,
      })
    }
  }
}

export async function sendSubmissionApprovedEmail(params: {
  headId: string
  taskTitle: string
  taskId: string
  feedback?: string | null
}) {
  const allowed = await shouldSendEmail(params.headId, 'submission_approved')
  if (!allowed) return

  const supabase = createServiceClient()
  const { data: user } = await supabase.from('users').select('full_name, email').eq('id', params.headId).single()
  if (!user || !user.email) return

  const emailData = submissionApprovedEmail({
    headName: user.full_name || 'Team Lead',
    taskTitle: params.taskTitle,
    taskId: params.taskId,
    feedback: params.feedback,
  })

  await sendEmail({
    to: user.email,
    subject: emailData.subject,
    html: emailData.html,
  })
}

export async function sendSubmissionReturnedEmail(params: {
  headId: string
  taskTitle: string
  taskId: string
  feedback: string
}) {
  const allowed = await shouldSendEmail(params.headId, 'submission_returned')
  if (!allowed) return

  const supabase = createServiceClient()
  const { data: user } = await supabase.from('users').select('full_name, email').eq('id', params.headId).single()
  if (!user || !user.email) return

  const emailData = submissionReturnedEmail({
    headName: user.full_name || 'Team Lead',
    taskTitle: params.taskTitle,
    taskId: params.taskId,
    feedback: params.feedback,
  })

  await sendEmail({
    to: user.email,
    subject: emailData.subject,
    html: emailData.html,
  })
}

export async function sendExtensionRequestedEmail(params: {
  headName: string
  pillarName: string
  taskTitle: string
  currentDueDate: string
  requestedDueDate: string
  reason: string
  taskId: string
}) {
  const supabase = createServiceClient()
  const { data: admins } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'admin')
    .eq('active', true)

  if (!admins || admins.length === 0) return

  const emailData = extensionRequestedEmail({
    headName: params.headName,
    pillarName: params.pillarName,
    taskTitle: params.taskTitle,
    currentDueDate: params.currentDueDate,
    requestedDueDate: params.requestedDueDate,
    reason: params.reason,
    taskId: params.taskId,
  })

  for (const admin of admins) {
    if (!admin.email) continue
    const allowed = await shouldSendEmail(admin.id, 'extension_requested')
    if (allowed) {
      await sendEmail({
        to: admin.email,
        subject: emailData.subject,
        html: emailData.html,
      })
    }
  }
}

export async function sendExtensionDecidedEmail(params: {
  requesterId: string
  taskTitle: string
  decision: 'approved' | 'declined' | 'denied'
  newDueDate?: string
  decisionNote?: string | null
  taskId: string
}) {
  const allowed = await shouldSendEmail(params.requesterId, 'extension_decided')
  if (!allowed) return

  const supabase = createServiceClient()
  const { data: user } = await supabase.from('users').select('full_name, email').eq('id', params.requesterId).single()
  if (!user || !user.email) return

  const emailData = extensionDecidedEmail({
    headName: user.full_name || 'Team Lead',
    taskTitle: params.taskTitle,
    decision: params.decision,
    newDueDate: params.newDueDate,
    decisionNote: params.decisionNote,
    taskId: params.taskId,
  })

  await sendEmail({
    to: user.email,
    subject: emailData.subject,
    html: emailData.html,
  })
}

export async function sendNewCommentEmail(params: {
  recipientId: string
  commenterName: string
  taskTitle: string
  commentBody: string
  taskId: string
  isAdmin: boolean
}) {
  const allowed = await shouldSendEmail(params.recipientId, 'new_comment')
  if (!allowed) return

  const supabase = createServiceClient()
  const { data: recipient } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', params.recipientId)
    .single()

  if (!recipient || !recipient.email) return

  const emailData = newCommentEmail({
    recipientName: recipient.full_name || 'Colleague',
    commenterName: params.commenterName,
    taskTitle: params.taskTitle,
    commentBody: params.commentBody,
    taskId: params.taskId,
    isAdmin: params.isAdmin,
  })

  await sendEmail({
    to: recipient.email,
    subject: emailData.subject,
    html: emailData.html,
  })
}
