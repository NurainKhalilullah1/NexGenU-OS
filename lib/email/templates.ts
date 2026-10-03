// lib/email/templates.ts
// Branded email templates for NexGenU Workforce Dashboard

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  'http://localhost:3000'

interface BaseEmailOptions {
  title: string
  preheader?: string
  contentHtml: string
  actionUrl?: string
  actionLabel?: string
  accentColor?: string
}

function renderBaseEmail({
  title,
  contentHtml,
  actionUrl,
  actionLabel,
  accentColor = '#B9FBC2',
}: BaseEmailOptions): string {
  const settingsUrl = `${APP_URL}/settings/notifications`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #1B2E34; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
    <!-- Logo Header -->
    <tr>
      <td style="padding-bottom: 20px;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background-color: ${accentColor}; width: 28px; height: 28px; border-radius: 6px; text-align: center; vertical-align: middle; font-weight: bold; color: #1B2E34; font-size: 16px;">
              ⚡
            </td>
            <td style="padding-left: 10px; font-size: 16px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em;">
              NexGenU Workforce
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Card -->
    <tr>
      <td style="background-color: #2A4954; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); padding: 32px;">
        <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #FFFFFF; line-height: 1.3;">
          ${title}
        </h1>
        <div style="font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.85); margin-bottom: 24px;">
          ${contentHtml}
        </div>
        ${
          actionUrl && actionLabel
            ? `
        <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
          <tr>
            <td style="border-radius: 8px; background-color: ${accentColor};">
              <a href="${actionUrl}" target="_blank" style="padding: 12px 24px; font-size: 14px; font-weight: 600; color: #1B2E34; text-decoration: none; display: inline-block; border-radius: 8px;">
                ${actionLabel} &rarr;
              </a>
            </td>
          </tr>
        </table>
        `
            : ''
        }
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding-top: 24px; text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.45); line-height: 1.5;">
        You received this because of your notification settings in NexGenU OS.<br/>
        <a href="${settingsUrl}" style="color: #B9FBC2; text-decoration: underline;">Update Notification Preferences</a> &middot;
        <a href="${settingsUrl}" style="color: rgba(255, 255, 255, 0.45); text-decoration: underline;">Unsubscribe</a>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function taskAssignedEmail(params: {
  headName?: string
  recipientName?: string
  taskTitle: string
  dueDate: string | null
  priority: string
  taskId: string
  role?: string
}): { subject: string; html: string } {
  const name = params.recipientName || params.headName || 'Team Member'
  const isMember = params.role === 'member'
  const taskUrl = isMember ? `${APP_URL}/member` : `${APP_URL}/head/tasks/${params.taskId}`
  return {
    subject: `New Task Assigned: ${params.taskTitle}`,
    html: renderBaseEmail({
      title: 'New Task Assigned',
      contentHtml: `
        <p>Hello ${name},</p>
        <p>A new task has been added to your workspace:</p>
        <div style="background-color: #1B2E34; padding: 16px; border-radius: 8px; border-left: 4px solid #B9FBC2; margin: 16px 0;">
          <strong style="color: #FFFFFF; font-size: 15px;">${params.taskTitle}</strong><br/>
          <span style="color: rgba(255,255,255,0.7); font-size: 13px;">Priority: <strong style="text-transform: capitalize; color: #B9FBC2;">${params.priority}</strong></span><br/>
          ${params.dueDate ? `<span style="color: rgba(255,255,255,0.7); font-size: 13px;">Due Date: <strong>${params.dueDate}</strong></span>` : ''}
        </div>
        <p>Please review the task details and initiate work when ready.</p>
      `,
      actionUrl: taskUrl,
      actionLabel: 'Open Task in Workspace',
    }),
  }
}

export function taskDueReminderEmail(params: {
  headName: string
  taskTitle: string
  dueDate: string
  taskId: string
}): { subject: string; html: string } {
  const taskUrl = `${APP_URL}/head/tasks/${params.taskId}`
  return {
    subject: `Task Due Tomorrow: ${params.taskTitle}`,
    html: renderBaseEmail({
      title: 'Task Due in 24 Hours',
      accentColor: '#FF6300',
      contentHtml: `
        <p>Hello ${params.headName},</p>
        <p>This is a reminder that the following task is scheduled for completion tomorrow:</p>
        <div style="background-color: #1B2E34; padding: 16px; border-radius: 8px; border-left: 4px solid #FF6300; margin: 16px 0;">
          <strong style="color: #FFFFFF; font-size: 15px;">${params.taskTitle}</strong><br/>
          <span style="color: #FF9A50; font-size: 13px;">Due Date: <strong>${params.dueDate}</strong></span>
        </div>
        <p>If you anticipate needing additional time, please submit an extension request before the deadline.</p>
      `,
      actionUrl: taskUrl,
      actionLabel: 'View Task & Submit Work',
    }),
  }
}

export function taskOverdueEmail(params: {
  recipientName: string
  taskTitle: string
  dueDate: string
  pillarName: string
  taskId: string
  isAdmin: boolean
}): { subject: string; html: string } {
  const taskUrl = `${APP_URL}/${params.isAdmin ? 'command' : 'head'}/tasks/${params.taskId}`
  return {
    subject: `[URGENT] Overdue Task: ${params.taskTitle}`,
    html: renderBaseEmail({
      title: 'Task Overdue Alert',
      accentColor: '#FF6300',
      contentHtml: `
        <p>Hello ${params.recipientName},</p>
        <p>The following task is now past its scheduled due date and has not been approved:</p>
        <div style="background-color: #1B2E34; padding: 16px; border-radius: 8px; border-left: 4px solid #FF6300; margin: 16px 0;">
          <strong style="color: #FFFFFF; font-size: 15px;">${params.taskTitle}</strong><br/>
          <span style="color: rgba(255,255,255,0.7); font-size: 13px;">Pillar: <strong>${params.pillarName}</strong></span><br/>
          <span style="color: #FF6300; font-weight: bold; font-size: 13px;">Scheduled Due Date: ${params.dueDate}</span>
        </div>
        <p>Please resolve this task immediately or submit an extension request.</p>
      `,
      actionUrl: taskUrl,
      actionLabel: 'Review Task Now',
    }),
  }
}

export function workSubmittedEmail(params: {
  headName: string
  pillarName: string
  taskTitle: string
  taskId: string
  note?: string
  attachmentCount: number
}): { subject: string; html: string } {
  const taskUrl = `${APP_URL}/command/tasks/${params.taskId}`
  return {
    subject: `Work Submitted for Review: ${params.taskTitle}`,
    html: renderBaseEmail({
      title: 'Work Submitted for Review',
      accentColor: '#CFC1FC',
      contentHtml: `
        <p><strong>${params.headName}</strong> (${params.pillarName}) has submitted work for approval:</p>
        <div style="background-color: #1B2E34; padding: 16px; border-radius: 8px; border-left: 4px solid #CFC1FC; margin: 16px 0;">
          <strong style="color: #FFFFFF; font-size: 15px;">${params.taskTitle}</strong><br/>
          ${params.note ? `<p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 8px 0 0 0;"><em>"${params.note}"</em></p>` : ''}
          ${params.attachmentCount > 0 ? `<span style="color: #B9FBC2; font-size: 12px; display: inline-block; margin-top: 6px;">📎 ${params.attachmentCount} file(s) attached</span>` : ''}
        </div>
        <p>The submission is currently pending in the Command Center Review Queue.</p>
      `,
      actionUrl: taskUrl,
      actionLabel: 'Open in Review Queue',
    }),
  }
}

export function submissionApprovedEmail(params: {
  headName: string
  taskTitle: string
  taskId: string
  feedback?: string | null
}): { subject: string; html: string } {
  const taskUrl = `${APP_URL}/head/tasks/${params.taskId}`
  return {
    subject: `Submission Approved: ${params.taskTitle}`,
    html: renderBaseEmail({
      title: 'Submission Approved! 🎉',
      accentColor: '#B9FBC2',
      contentHtml: `
        <p>Hello ${params.headName},</p>
        <p>Great work! Your submission for the following task has been approved by leadership:</p>
        <div style="background-color: #1B2E34; padding: 16px; border-radius: 8px; border-left: 4px solid #B9FBC2; margin: 16px 0;">
          <strong style="color: #FFFFFF; font-size: 15px;">${params.taskTitle}</strong>
          ${params.feedback ? `<p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 8px 0 0 0;"><strong>Feedback:</strong> ${params.feedback}</p>` : ''}
        </div>
        <p>This task is now marked as Approved.</p>
      `,
      actionUrl: taskUrl,
      actionLabel: 'View Approved Task',
    }),
  }
}

export function submissionReturnedEmail(params: {
  headName: string
  taskTitle: string
  taskId: string
  feedback: string
}): { subject: string; html: string } {
  const taskUrl = `${APP_URL}/head/tasks/${params.taskId}`
  return {
    subject: `Action Required: Submission Returned for ${params.taskTitle}`,
    html: renderBaseEmail({
      title: 'Submission Returned for Revision',
      accentColor: '#FF6300',
      contentHtml: `
        <p>Hello ${params.headName},</p>
        <p>Your submission for <strong>${params.taskTitle}</strong> was returned with revision requests:</p>
        <div style="background-color: #1B2E34; padding: 16px; border-radius: 8px; border-left: 4px solid #FF6300; margin: 16px 0;">
          <strong style="color: #FF9A50; font-size: 13px;">Reviewer Feedback:</strong>
          <p style="color: #FFFFFF; font-size: 14px; margin: 6px 0 0 0; line-height: 1.5;">${params.feedback}</p>
        </div>
        <p>Please address the feedback and re-submit for review.</p>
      `,
      actionUrl: taskUrl,
      actionLabel: 'Revise & Re-Submit',
    }),
  }
}

export function extensionRequestedEmail(params: {
  headName: string
  pillarName: string
  taskTitle: string
  currentDueDate: string
  requestedDueDate: string
  reason: string
  taskId: string
}): { subject: string; html: string } {
  const taskUrl = `${APP_URL}/command/tasks/${params.taskId}`
  return {
    subject: `Extension Request: ${params.taskTitle}`,
    html: renderBaseEmail({
      title: 'Deadline Extension Requested',
      accentColor: '#CFC1FC',
      contentHtml: `
        <p><strong>${params.headName}</strong> (${params.pillarName}) has requested a deadline extension for:</p>
        <div style="background-color: #1B2E34; padding: 16px; border-radius: 8px; border-left: 4px solid #CFC1FC; margin: 16px 0;">
          <strong style="color: #FFFFFF; font-size: 15px;">${params.taskTitle}</strong><br/>
          <span style="color: rgba(255,255,255,0.7); font-size: 13px;">Current Due Date: ${params.currentDueDate}</span><br/>
          <span style="color: #B9FBC2; font-weight: bold; font-size: 13px;">Proposed Due Date: ${params.requestedDueDate}</span><br/>
          <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
            <strong style="font-size: 12px; color: rgba(255,255,255,0.6);">Reason:</strong>
            <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 4px 0 0 0;">${params.reason}</p>
          </div>
        </div>
        <p>You can approve or decline this request in the Command Center.</p>
      `,
      actionUrl: taskUrl,
      actionLabel: 'Review Extension Request',
    }),
  }
}

export function extensionDecidedEmail(params: {
  headName: string
  taskTitle: string
  decision: 'approved' | 'declined' | 'denied'
  newDueDate?: string
  decisionNote?: string | null
  taskId: string
}): { subject: string; html: string } {
  const isApproved = params.decision === 'approved'
  const taskUrl = `${APP_URL}/head/tasks/${params.taskId}`
  return {
    subject: `Extension Request ${isApproved ? 'Approved' : 'Declined'}: ${params.taskTitle}`,
    html: renderBaseEmail({
      title: `Extension Request ${isApproved ? 'Approved' : 'Declined'}`,
      accentColor: isApproved ? '#B9FBC2' : '#FF6300',
      contentHtml: `
        <p>Hello ${params.headName},</p>
        <p>Leadership has ${isApproved ? 'approved' : 'declined'} your extension request for <strong>${params.taskTitle}</strong>.</p>
        <div style="background-color: #1B2E34; padding: 16px; border-radius: 8px; border-left: 4px solid ${isApproved ? '#B9FBC2' : '#FF6300'}; margin: 16px 0;">
          <strong style="color: ${isApproved ? '#B9FBC2' : '#FF9A50'}; font-size: 14px; text-transform: uppercase;">Decision: ${params.decision}</strong><br/>
          ${isApproved && params.newDueDate ? `<span style="color: #FFFFFF; font-size: 13px;">New Due Date: <strong>${params.newDueDate}</strong></span><br/>` : ''}
          ${params.decisionNote ? `<div style="margin-top: 8px; font-size: 13px; color: rgba(255,255,255,0.85);"><strong>Note:</strong> ${params.decisionNote}</div>` : ''}
        </div>
      `,
      actionUrl: taskUrl,
      actionLabel: 'View Task in Workspace',
    }),
  }
}

export function newCommentEmail(params: {
  recipientName: string
  commenterName: string
  taskTitle: string
  commentBody: string
  taskId: string
  isAdmin: boolean
}): { subject: string; html: string } {
  const taskUrl = `${APP_URL}/${params.isAdmin ? 'command' : 'head'}/tasks/${params.taskId}`
  return {
    subject: `New Comment on: ${params.taskTitle}`,
    html: renderBaseEmail({
      title: 'New Comment Added',
      contentHtml: `
        <p>Hello ${params.recipientName},</p>
        <p><strong>${params.commenterName}</strong> left a comment on <strong>${params.taskTitle}</strong>:</p>
        <div style="background-color: #1B2E34; padding: 16px; border-radius: 8px; border-left: 4px solid #B9FBC2; margin: 16px 0;">
          <p style="color: #FFFFFF; font-size: 14px; margin: 0; line-height: 1.5; white-space: pre-wrap;">${params.commentBody}</p>
        </div>
      `,
      actionUrl: taskUrl,
      actionLabel: 'Reply to Comment',
    }),
  }
}

export function dailyDigestEmail(params: {
  headName: string
  pillarName: string
  overdueTasks: Array<{ id: string; title: string; due_date: string | null }>
  dueTodayTasks: Array<{ id: string; title: string }>
}): { subject: string; html: string } {
  const workspaceUrl = `${APP_URL}/head`

  const overdueHtml =
    params.overdueTasks.length > 0
      ? `
    <h3 style="color: #FF6300; font-size: 15px; margin: 16px 0 8px 0;">⚠️ Overdue Tasks (${params.overdueTasks.length})</h3>
    <ul style="padding-left: 20px; margin: 0 0 16px 0; color: rgba(255,255,255,0.85); font-size: 13px;">
      ${params.overdueTasks.map((t) => `<li style="margin-bottom: 6px;"><a href="${APP_URL}/head/tasks/${t.id}" style="color: #FF9A50; text-decoration: underline;">${t.title}</a> (Due: ${t.due_date})</li>`).join('')}
    </ul>
    `
      : '<p style="color: #B9FBC2; font-size: 13px;">✓ No overdue tasks.</p>'

  const dueTodayHtml =
    params.dueTodayTasks.length > 0
      ? `
    <h3 style="color: #CFC1FC; font-size: 15px; margin: 16px 0 8px 0;">⏰ Due Today (${params.dueTodayTasks.length})</h3>
    <ul style="padding-left: 20px; margin: 0 0 16px 0; color: rgba(255,255,255,0.85); font-size: 13px;">
      ${params.dueTodayTasks.map((t) => `<li style="margin-bottom: 6px;"><a href="${APP_URL}/head/tasks/${t.id}" style="color: #FFFFFF; text-decoration: underline;">${t.title}</a></li>`).join('')}
    </ul>
    `
      : '<p style="color: rgba(255,255,255,0.6); font-size: 13px;">No tasks due today.</p>'

  return {
    subject: `Daily Briefing: ${params.pillarName} Focus for Today`,
    html: renderBaseEmail({
      title: `Daily Workspace Briefing`,
      contentHtml: `
        <p>Good morning ${params.headName},</p>
        <p>Here is your daily task summary for <strong>${params.pillarName}</strong>:</p>
        <div style="background-color: #1B2E34; padding: 18px; border-radius: 8px; margin: 16px 0;">
          ${overdueHtml}
          ${dueTodayHtml}
        </div>
      `,
      actionUrl: workspaceUrl,
      actionLabel: 'Open Head Workspace',
    }),
  }
}
