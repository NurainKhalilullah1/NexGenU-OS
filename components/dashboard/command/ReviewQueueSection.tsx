// components/dashboard/command/ReviewQueueSection.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, RotateCcw, Calendar, User, Loader2 } from 'lucide-react'
import type { Submission } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { approveSubmissionAction, returnSubmissionAction } from '@/app/(dashboard)/command/actions'
import { toast } from '@/lib/toast'

export type ReviewQueueSubmission = Submission & {
  task?: { id: string; title: string; pillar?: { name: string; nickname: string } }
  user?: { id: string; full_name: string }
}

interface ReviewQueueSectionProps {
  submissions: ReviewQueueSubmission[]
}

export function ReviewQueueSection({ submissions }: ReviewQueueSectionProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [returnModal, setReturnModal] = useState<{ submission: typeof submissions[0] } | null>(null)
  const [feedback, setFeedback] = useState('')
  const [returnError, setReturnError] = useState<string | null>(null)
  const [returnLoading, setReturnLoading] = useState(false)

  async function handleApprove(submission: typeof submissions[0]) {
    if (!submission.task || !submission.user) return
    setLoadingId(submission.id)
    const result = await approveSubmissionAction(submission.id, submission.task.id, submission.user.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Deliverable approved!')
      router.refresh()
    }
    setLoadingId(null)
  }

  async function handleReturnSubmit() {
    if (!returnModal || !returnModal.submission.task || !returnModal.submission.user) return
    setReturnError(null)
    setReturnLoading(true)
    const result = await returnSubmissionAction(
      returnModal.submission.id,
      returnModal.submission.task.id,
      returnModal.submission.user.id,
      feedback
    )
    if (result.error) {
      setReturnError(result.error)
      toast.error(result.error)
      setReturnLoading(false)
      return
    }
    toast.info('Submission returned to Head with feedback.')
    setReturnModal(null)
    setFeedback('')
    router.refresh()
    setReturnLoading(false)
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {submissions.map((sub) => (
          <div
            key={sub.id}
            style={{
              background: 'rgba(207,193,252,0.06)',
              border: '1px solid rgba(207,193,252,0.2)',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                {sub.task?.title ?? 'Unknown Task'}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {sub.task?.pillar && (
                  <span>{sub.task.pillar.nickname}</span>
                )}
                {sub.user && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={10} />
                    {sub.user.full_name}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={10} />
                  {formatDate(sub.submitted_at)}
                </span>
              </div>
              {sub.note && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                  &ldquo;{sub.note.slice(0, 120)}{sub.note.length > 120 ? '…' : ''}&rdquo;
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={() => { setReturnModal({ submission: sub }); setFeedback(''); setReturnError(null) }}
                className="btn btn-secondary btn-sm"
                disabled={loadingId === sub.id}
                style={{ gap: 4 }}
                id={`return-btn-${sub.id}`}
              >
                <RotateCcw size={12} />
                Return
              </button>
              <button
                onClick={() => handleApprove(sub)}
                className="btn btn-primary btn-sm"
                disabled={loadingId === sub.id}
                style={{ gap: 4 }}
                id={`approve-btn-${sub.id}`}
              >
                {loadingId === sub.id ? (
                  <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Return Modal */}
      {returnModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setReturnModal(null) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-modal-title"
        >
          <div
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border-default)',
              borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px',
              animation: 'fadeIn 200ms ease',
            }}
          >
            <h2 id="return-modal-title" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Return Submission
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Task: <strong style={{ color: 'var(--text-primary)' }}>{returnModal.submission.task?.title}</strong>
            </p>
            <div>
              <label htmlFor="return-feedback" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Feedback <span style={{ color: 'var(--color-orange)' }}>*</span>
              </label>
              <textarea
                id="return-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input"
                rows={4}
                placeholder="Explain what needs to be revised…"
                style={{ resize: 'vertical' }}
              />
            </div>
            {returnError && (
              <div style={{ background: 'rgba(255,99,0,0.1)', border: '1px solid rgba(255,99,0,0.3)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#FF9A50', marginTop: '8px' }} role="alert">
                {returnError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setReturnModal(null)} className="btn btn-secondary" disabled={returnLoading}>
                Cancel
              </button>
              <button onClick={handleReturnSubmit} className="btn btn-danger" disabled={returnLoading} id="return-submit-btn">
                {returnLoading ? (
                  <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Returning…</>
                ) : 'Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
