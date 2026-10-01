// app/(dashboard)/command/tasks/[id]/page.tsx — Task Detail (Admin view)
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTaskById } from '@/lib/db/tasks'
import { getSubmissionsForTask } from '@/lib/db/submissions'
import { getTaskLogs } from '@/lib/db/task-logs'
import { getAuditLog } from '@/lib/db/audit-log'
import { getCommentsForTask } from '@/lib/db/comments'
import { getExtensionRequestsForTask } from '@/lib/db/extensions'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { ReviewQueueSection, type ReviewQueueSubmission } from '@/components/dashboard/command/ReviewQueueSection'
import { CommentThread } from '@/components/tasks/CommentThread'
import { ExtensionHistory } from '@/components/tasks/ExtensionHistory'
import { FileDownloadButton } from '@/components/tasks/FileDownloadButton'
import { StopRecurrenceButton } from '@/components/tasks/StopRecurrenceButton'
import { formatDate, formatDueDate, isOverdue } from '@/lib/utils'
import { ArrowLeft, Calendar, User, Clock, Flag, Link as LinkIcon, ExternalLink, Repeat } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const task = await getTaskById(id)
  return { title: task ? task.title : 'Task Not Found' }
}

export default async function AdminTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('id, full_name, role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/head')

  const { id } = await params
  const task = await getTaskById(id)
  if (!task) notFound()

  const overdue = isOverdue(task.due_date, task.status)

  const [submissions, logs, auditLogs, comments, extensionRequests] = await Promise.all([
    getSubmissionsForTask(task.id),
    getTaskLogs(task.id),
    getAuditLog(task.id),
    getCommentsForTask(task.id),
    getExtensionRequestsForTask(task.id),
  ])

  const pendingSubmission = submissions.find((s) => s.review_status === 'pending')

  const isKpiUrl = task.kpi_ref && (task.kpi_ref.startsWith('http://') || task.kpi_ref.startsWith('https://'))
  const kpiHref = isKpiUrl ? task.kpi_ref! : task.kpi_ref ? `https://${task.kpi_ref}` : ''

  return (
    <div className="page-content" style={{ maxWidth: '900px' }}>
      {/* Back */}
      <Link
        href="/command"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', textDecoration: 'none' }}
        className="hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={14} />
        Back to Command Center
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, flex: 1, minWidth: '200px' }}>{task.title}</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={task.status} isOverdue={overdue} />
            <PriorityBadge priority={task.priority} />
            {task.recurrence && task.recurrence !== 'none' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                  background: 'rgba(185, 251, 194, 0.12)',
                  border: '1px solid rgba(185, 251, 194, 0.3)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                <Repeat size={12} />
                Recurring ({task.recurrence})
              </span>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <StopRecurrenceButton taskId={task.id} />
            )}
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)' }}>
          {task.pillar && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Flag size={12} />
              {task.pillar.name}
            </span>
          )}
          {task.assignee && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={12} />
              {task.assignee.full_name}
            </span>
          )}
          {task.due_date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: overdue ? 'var(--color-orange)' : 'inherit' }}>
              <Calendar size={12} />
              {formatDueDate(task.due_date)}
            </span>
          )}
          {task.kpi_ref && (
            <a
              href={kpiHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-accent)', textDecoration: 'none' }}
              className="hover:underline"
              id="task-kpi-meta-link"
            >
              <LinkIcon size={12} />
              {task.kpi_ref}
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {/* KPI Reference Section */}
      {task.kpi_ref && (
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(185, 251, 194, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
              }}
            >
              <LinkIcon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                KPI Reference
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {task.kpi_ref}
              </div>
            </div>
          </div>
          <a
            href={kpiHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            id="task-kpi-cta-link"
          >
            <ExternalLink size={13} />
            Open KPI Link
          </a>
        </div>
      )}

      {/* Description */}
      {task.description && (
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {task.description}
        </div>
      )}

      {/* Pending submission in review */}
      {pendingSubmission && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Pending Review</h2>
          <ReviewQueueSection
            submissions={[{
              ...pendingSubmission,
              task: { id: task.id, title: task.title },
              user: task.assignee ? { id: task.assignee.id, full_name: task.assignee.full_name } : undefined,
            } as ReviewQueueSubmission]}
          />
        </div>
      )}

      {/* Submission history */}
      {submissions.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Submissions ({submissions.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {submissions.map((sub) => (
              <div
                key={sub.id}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <span className={`badge badge-${sub.review_status === 'approved' ? 'approved' : sub.review_status === 'returned' ? 'returned' : 'submitted'}`}>
                    {sub.review_status.charAt(0).toUpperCase() + sub.review_status.slice(1)}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(sub.submitted_at)}</span>
                </div>
                {sub.note && <p style={{ fontSize: '13px', marginBottom: '4px' }}>{sub.note}</p>}
                {sub.links.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: sub.file_paths && sub.file_paths.length > 0 ? '6px' : 0 }}>
                    {sub.links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: 'var(--color-accent)' }}>
                        Link {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                {sub.file_paths && sub.file_paths.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {sub.file_paths.map((fp, i) => (
                      <FileDownloadButton key={i} filePath={fp} />
                    ))}
                  </div>
                )}
                {sub.feedback && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-default)', paddingTop: '8px', fontSize: '12px', color: '#FF9A50', fontStyle: 'italic' }}>
                    Feedback: {sub.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Extension History (Phase 2) */}
      <ExtensionHistory requests={extensionRequests} />

      {/* Work Logs */}
      {logs.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Work Log ({logs.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map((log) => (
              <div key={log.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>{formatDate(log.log_date)}</span>
                  {log.hours && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: 'var(--text-muted)' }}>
                      <Clock size={10} />
                      {log.hours}h
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{log.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Audit log */}
      {auditLogs.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Activity Log</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: '12px', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid var(--border-default)' }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{formatDate(log.created_at)}</span>
                <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>{log.action}</span>
                <span style={{ color: 'var(--text-secondary)' }}>by {log.actor?.full_name ?? 'Unknown'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Thread (Phase 2) */}
      <CommentThread
        taskId={task.id}
        initialComments={comments}
        currentUserId={user.id}
        currentUserName={profile?.full_name || 'Admin'}
      />
    </div>
  )
}
