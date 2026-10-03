'use client'
// components/dashboard/head/TeamInbox.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InternalSubmission } from '@/types/database'
import { reviewMemberSubmissionAction } from '@/app/(dashboard)/head/team-inbox/actions'
import { CheckCircle2, RotateCcw, User as UserIcon, Loader2, Inbox } from 'lucide-react'

interface Props { submissions: InternalSubmission[]; headId: string }

export function TeamInbox({ submissions, headId }: Props) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleReview(sub: InternalSubmission, status: 'approved' | 'returned') {
    const fb = feedback[sub.id] || ''
    setErrors({})
    if (!fb.trim()) {
      setErrors((p) => ({ ...p, [sub.id]: 'Feedback is required before approving or returning.' }))
      return
    }
    setLoading(sub.id + status)
    const result = await reviewMemberSubmissionAction(sub.id, sub.task_id, sub.submitted_by, status, fb)
    setLoading(null)
    if (result.error) {
      setErrors((p) => ({ ...p, [sub.id]: result.error! }))
      return
    }
    setFeedback((p) => ({ ...p, [sub.id]: '' }))
    router.refresh()
  }

  if (submissions.length === 0) {
    return (
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
        <Inbox size={36} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No pending member submissions.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {submissions.map((sub) => (
        <div key={sub.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '15px', margin: 0 }}>{sub.task?.title ?? 'Task'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <UserIcon size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {sub.submitter?.full_name ?? 'Member'} · {new Date(sub.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', background: 'rgba(207,193,252,0.12)', color: 'var(--color-lavender)', border: '1px solid rgba(207,193,252,0.3)' }}>
              Pending Review
            </span>
          </div>

          {/* Member notes */}
          <div style={{ background: 'var(--surface-2)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>MEMBER NOTES</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{sub.notes}</p>
          </div>

          {/* Error */}
          {errors[sub.id] && (
            <div style={{ background: 'rgba(255,99,0,0.1)', border: '1px solid rgba(255,99,0,0.3)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '13px', color: 'var(--color-orange)' }}>
              {errors[sub.id]}
            </div>
          )}

          {/* Feedback textarea */}
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Your Feedback <span style={{ color: 'var(--color-orange)' }}>*</span>
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="Write feedback before approving or returning..."
            value={feedback[sub.id] || ''}
            onChange={(e) => setFeedback((p) => ({ ...p, [sub.id]: e.target.value }))}
            style={{ resize: 'vertical', fontFamily: 'inherit', marginBottom: '12px' }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              disabled={loading === sub.id + 'returned'}
              onClick={() => handleReview(sub, 'returned')}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px', color: 'var(--color-orange)' }}
            >
              {loading === sub.id + 'returned' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={13} />}
              Return
            </button>
            <button
              disabled={loading === sub.id + 'approved'}
              onClick={() => handleReview(sub, 'approved')}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              {loading === sub.id + 'approved' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={13} />}
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
