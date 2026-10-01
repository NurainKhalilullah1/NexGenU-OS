// components/dashboard/head/HeadStatusControls.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TaskStatus } from '@/types/database'
import { updateHeadTaskStatusAction } from '@/app/(dashboard)/head/actions'
import { SubmitTaskModal } from './SubmitTaskModal'
import { RequestExtensionModal } from '@/components/tasks/RequestExtensionModal'
import { Play, AlertCircle, CheckCircle2, RotateCcw, Send, Loader2, X, CalendarClock } from 'lucide-react'

interface HeadStatusControlsProps {
  taskId: string
  taskTitle: string
  status: TaskStatus
  currentDueDate?: string | null
  hasPendingExtension?: boolean
}

export function HeadStatusControls({
  taskId,
  taskTitle,
  status,
  currentDueDate = null,
  hasPendingExtension = false,
}: HeadStatusControlsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [blockedReason, setBlockedReason] = useState('')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showExtensionModal, setShowExtensionModal] = useState(false)

  async function handleStartWork() {
    setLoading(true)
    setError(null)
    const res = await updateHeadTaskStatusAction(taskId, 'in_progress')
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      router.refresh()
    }
  }

  async function handleConfirmBlocked(e: React.FormEvent) {
    e.preventDefault()
    if (blockedReason.trim().length < 10) {
      setError('Please provide a reason with at least 10 characters')
      return
    }

    setLoading(true)
    setError(null)
    const res = await updateHeadTaskStatusAction(taskId, 'blocked', blockedReason.trim())
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setShowBlockedModal(false)
      setBlockedReason('')
      router.refresh()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {error && (
        <div
          style={{
            background: 'rgba(255, 99, 0, 0.15)',
            border: '1px solid rgba(255, 99, 0, 0.4)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#FF9A50',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Not started -> Start work */}
        {status === 'not_started' && (
          <>
            <button
              onClick={handleStartWork}
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Start Work
            </button>
            <button
              onClick={() => {
                setError(null)
                setShowBlockedModal(true)
              }}
              disabled={loading}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-orange)' }}
            >
              <AlertCircle size={14} />
              Mark Blocked
            </button>
          </>
        )}

        {/* In progress -> Submit or Block */}
        {status === 'in_progress' && (
          <>
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} />
              Submit for Review
            </button>
            <button
              onClick={() => {
                setError(null)
                setShowBlockedModal(true)
              }}
              disabled={loading}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-orange)' }}
            >
              <AlertCircle size={14} />
              Mark Blocked
            </button>
          </>
        )}

        {/* Blocked -> Resume */}
        {status === 'blocked' && (
          <button
            onClick={handleStartWork}
            disabled={loading}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Resume Work
          </button>
        )}

        {/* Returned -> Resume or Resubmit */}
        {status === 'returned' && (
          <>
            <button
              onClick={handleStartWork}
              disabled={loading}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Resume Work
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} />
              Resubmit Work
            </button>
          </>
        )}

        {/* Submitted info badge */}
        {status === 'submitted' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(207, 193, 252, 0.15)',
              border: '1px solid rgba(207, 193, 252, 0.35)',
              color: 'var(--color-lavender)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Send size={14} />
            Submitted — Awaiting Leadership Review
          </div>
        )}

        {/* Approved info badge */}
        {status === 'approved' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(185, 251, 194, 0.15)',
              border: '1px solid rgba(185, 251, 194, 0.35)',
              color: 'var(--color-accent)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <CheckCircle2 size={14} />
            Task Approved & Complete
          </div>
        )}

        {/* Request Extension button (Phase 2) */}
        {status !== 'approved' && status !== 'submitted' && !hasPendingExtension && (
          <button
            type="button"
            onClick={() => setShowExtensionModal(true)}
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-lavender)' }}
          >
            <CalendarClock size={14} />
            Request Extension
          </button>
        )}

        {hasPendingExtension && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(207, 193, 252, 0.15)',
              border: '1px solid rgba(207, 193, 252, 0.35)',
              color: 'var(--color-lavender)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <CalendarClock size={14} />
            Extension Request Pending Review
          </span>
        )}
      </div>

      {/* Blocked reason modal */}
      {showBlockedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBlockedModal(false)
          }}
        >
          <div
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              animation: 'fadeIn 150ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Mark Task as Blocked
              </h3>
              <button
                onClick={() => setShowBlockedModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmBlocked}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Please specify the impediment or dependency blocking progress on this task:
              </p>
              <textarea
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="e.g. Waiting on Figma asset approvals from Design team..."
                rows={4}
                required
                className="input-field"
                style={{ width: '100%', resize: 'vertical', marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBlockedModal(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn"
                  style={{
                    background: 'var(--color-orange)',
                    color: '#fff',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Confirm Blocked
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit modal */}
      <SubmitTaskModal
        taskId={taskId}
        taskTitle={taskTitle}
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />

      {/* Extension modal (Phase 2) */}
      <RequestExtensionModal
        taskId={taskId}
        taskTitle={taskTitle}
        currentDueDate={currentDueDate}
        open={showExtensionModal}
        onClose={() => setShowExtensionModal(false)}
      />
    </div>
  )
}
