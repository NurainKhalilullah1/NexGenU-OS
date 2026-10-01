// app/(dashboard)/head/tasks/[id]/page.tsx — Task Detail (Head view)
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTaskById } from '@/lib/db/tasks'
import { getSubmissionsForTask } from '@/lib/db/submissions'
import { getTaskLogs } from '@/lib/db/task-logs'
import { getCommentsForTask } from '@/lib/db/comments'
import { getExtensionRequestsForTask, getPendingExtensionForTask } from '@/lib/db/extensions'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { ReturnedFeedbackBanner } from '@/components/dashboard/head/ReturnedFeedbackBanner'
import { HeadStatusControls } from '@/components/dashboard/head/HeadStatusControls'
import { WorkLogForm } from '@/components/dashboard/head/WorkLogForm'
import { CommentThread } from '@/components/tasks/CommentThread'
import { ExtensionHistory } from '@/components/tasks/ExtensionHistory'
import { FileDownloadButton } from '@/components/tasks/FileDownloadButton'
import { formatDate, formatDueDate, isOverdue } from '@/lib/utils'
import { ArrowLeft, Calendar, Flag, User, Link as LinkIcon } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const task = await getTaskById(id)
  return { title: task ? `${task.title} | Head Workspace` : 'Task Not Found' }
}

export default async function HeadTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, pillar:pillars(id, name, nickname)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/command')

  const { id } = await params
  const task = await getTaskById(id)
  if (!task) notFound()

  // STRICT PILLAR ISOLATION: Head can only view tasks belonging to their pillar
  if (task.pillar_id !== profile.pillar_id) {
    notFound()
  }

  const overdue = isOverdue(task.due_date, task.status)

  const [submissions, logs, comments, extensionRequests, pendingExtension] = await Promise.all([
    getSubmissionsForTask(task.id),
    getTaskLogs(task.id),
    getCommentsForTask(task.id),
    getExtensionRequestsForTask(task.id),
    getPendingExtensionForTask(task.id),
  ])

  // Find latest returned submission feedback if returned
  const latestReturnedSubmission = submissions.find((s) => s.review_status === 'returned')

  return (
    <div className="page-content" style={{ maxWidth: '880px' }}>
      {/* Back button */}
      <Link
        href="/head"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '20px',
          textDecoration: 'none',
        }}
        className="hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={14} />
        Back to Pillar Workspace
      </Link>

      {/* Returned feedback banner (if returned) */}
      {task.status === 'returned' && (
        <ReturnedFeedbackBanner feedback={latestReturnedSubmission?.feedback ?? null} />
      )}

      {/* Header section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, flex: 1, minWidth: '220px', margin: 0 }}>
            {task.title}
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <StatusBadge status={task.status} isOverdue={overdue} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        {/* Metadata pills */}
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
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <LinkIcon size={12} />
              {task.kpi_ref}
            </span>
          )}
        </div>
      </div>

      {/* Task Description */}
      {task.description && (
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '24px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Description & Context
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{task.description}</p>
        </div>
      )}

      {/* Execution Controls (Start Work / Mark Blocked / Submit for Review) */}
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '10px',
          padding: '18px 20px',
          marginBottom: '24px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          Execution Controls
        </div>
        <HeadStatusControls
          taskId={task.id}
          taskTitle={task.title}
          status={task.status}
          currentDueDate={task.due_date}
          hasPendingExtension={!!pendingExtension}
        />
      </div>

      {/* Extension History (Phase 2) */}
      <ExtensionHistory requests={extensionRequests} />

      {/* Work Log section */}
      <WorkLogForm
        taskId={task.id}
        logs={logs}
        isTaskLocked={task.status === 'approved'}
      />

      {/* Submission history */}
      {submissions.length > 0 && (
        <section
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>
            Submission History ({submissions.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {submissions.map((sub) => (
              <div
                key={sub.id}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className={`badge badge-${sub.review_status === 'approved' ? 'approved' : sub.review_status === 'returned' ? 'returned' : 'submitted'}`}>
                    {sub.review_status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDate(sub.submitted_at)}
                  </span>
                </div>

                {sub.note && (
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px', margin: 0, lineHeight: 1.5 }}>
                    {sub.note}
                  </p>
                )}

                {sub.links && sub.links.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {sub.links.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-accent)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'underline',
                        }}
                      >
                        <LinkIcon size={12} />
                        Deliverable {i + 1}
                      </a>
                    ))}
                  </div>
                )}

                {sub.file_paths && sub.file_paths.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {sub.file_paths.map((fp, i) => (
                      <FileDownloadButton key={i} filePath={fp} />
                    ))}
                  </div>
                )}

                {sub.feedback && (
                  <div
                    style={{
                      marginTop: '10px',
                      borderTop: '1px solid var(--border-default)',
                      paddingTop: '8px',
                      fontSize: '12px',
                      color: '#FF9A50',
                    }}
                  >
                    <strong>Reviewer Feedback:</strong> {sub.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Discussion & Comments (Phase 2) */}
      <CommentThread
        taskId={task.id}
        initialComments={comments}
        currentUserId={user.id}
        currentUserName={profile.full_name}
      />
    </div>
  )
}
