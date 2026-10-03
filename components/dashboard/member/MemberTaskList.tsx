'use client'
// components/dashboard/member/MemberTaskList.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, InternalSubmission } from '@/types/database'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { formatDueDate, isOverdue } from '@/lib/utils'
import { memberSubmitTaskAction } from '@/app/(dashboard)/member/actions'
import { Send, AlertTriangle, CheckCircle2, RotateCcw, Loader2, X } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Props {
  tasks: Task[]
  submissions: InternalSubmission[]
  memberId: string
}

export function MemberTaskList({ tasks, submissions, memberId }: Props) {
  const router = useRouter()
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const latestSub = (taskId: string) =>
    submissions
      .filter((s) => s.task_id === taskId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  async function handleSubmit(taskId: string) {
    setError(null)
    setLoading(true)
    const fd = new FormData()
    fd.append('task_id', taskId)
    fd.append('notes', notes[taskId] || '')
    const result = await memberSubmitTaskAction(fd)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      return
    }
    toast.success('Work submitted to Head!')
    setOpenModal(null)
    setNotes((prev) => ({ ...prev, [taskId]: '' }))
    router.refresh()
  }

  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        <CheckCircle2 size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
        <p>No tasks assigned to you yet.</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tasks.map((task) => {
          const sub = latestSub(task.id)
          const overdue = isOverdue(task.due_date, task.status)
          return (
            <div
              key={task.id}
              style={{
                background: 'var(--surface-2)',
                border: overdue ? '1px solid var(--color-orange)' : '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', margin: 0, marginBottom: '4px' }}>{task.title}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.due_date && (
                      <span style={{ fontSize: '11px', color: overdue ? 'var(--color-orange)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {overdue && <AlertTriangle size={10} />}
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Submission status badge */}
                {sub && (
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', flexShrink: 0,
                    background: sub.status === 'approved' ? 'rgba(185,251,194,0.12)' : sub.status === 'returned' ? 'rgba(255,99,0,0.12)' : 'rgba(207,193,252,0.12)',
                    color: sub.status === 'approved' ? 'var(--color-accent)' : sub.status === 'returned' ? 'var(--color-orange)' : 'var(--color-lavender)',
                    border: sub.status === 'approved' ? '1px solid rgba(185,251,194,0.3)' : sub.status === 'returned' ? '1px solid rgba(255,99,0,0.3)' : '1px solid rgba(207,193,252,0.3)',
                  }}>
                    {sub.status === 'pending' ? 'Awaiting Review' : sub.status === 'approved' ? '✓ Approved' : '↩ Returned'}
                  </span>
                )}
              </div>

              {/* Head feedback on returned */}
              {sub?.status === 'returned' && sub.head_feedback && (
                <div style={{ background: 'rgba(255,99,0,0.08)', border: '1px solid rgba(255,99,0,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--color-orange)', fontWeight: 600, marginBottom: '2px' }}>Head Feedback</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{sub.head_feedback}</p>
                </div>
              )}

              {/* Submit button — show if no pending submission */}
              {(!sub || sub.status === 'returned') && task.status !== 'approved' && (
                <button
                  onClick={() => setOpenModal(task.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: 'flex-start', gap: '6px' }}
                >
                  <Send size={13} />
                  {sub?.status === 'returned' ? 'Resubmit to Head' : 'Submit to Head'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit Modal */}
      {openModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpenModal(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
        >
          <div className="modal-content" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Submit Work to Head</h2>
              <button onClick={() => setOpenModal(null)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {tasks.find((t) => t.id === openModal)?.title}
            </p>
            {error && <div style={{ background: 'rgba(255,99,0,0.12)', border: '1px solid rgba(255,99,0,0.3)', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '13px', color: 'var(--color-orange)' }}>{error}</div>}
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Work Notes <span style={{ color: 'var(--color-orange)' }}>*</span>
            </label>
            <textarea
              className="input"
              rows={5}
              placeholder="Describe what you completed, any issues encountered, and what the Head should review..."
              value={notes[openModal] || ''}
              onChange={(e) => setNotes((p) => ({ ...p, [openModal]: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setOpenModal(null)} className="btn btn-ghost btn-sm">Cancel</button>
              <button
                disabled={loading}
                onClick={() => handleSubmit(openModal)}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px' }}
              >
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
