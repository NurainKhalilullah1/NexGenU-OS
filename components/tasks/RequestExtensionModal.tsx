// components/tasks/RequestExtensionModal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestExtensionAction } from '@/app/(dashboard)/actions/collaboration'
import { CalendarClock, X, Loader2, AlertCircle } from 'lucide-react'

interface RequestExtensionModalProps {
  taskId: string
  taskTitle: string
  currentDueDate: string | null
  open: boolean
  onClose: () => void
}

export function RequestExtensionModal({
  taskId,
  taskTitle,
  currentDueDate,
  open,
  onClose,
}: RequestExtensionModalProps) {
  const router = useRouter()
  const [requestedDate, setRequestedDate] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  // Minimum selectable date is day after current due date (or tomorrow if no due date)
  const minDate = currentDueDate
    ? new Date(new Date(currentDueDate).getTime() + 86400000).toISOString().split('T')[0]
    : new Date(Date.now() + 86400000).toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!requestedDate) {
      setError('Please select a proposed new due date')
      return
    }

    if (reason.trim().length < 20) {
      setError('Please provide a detailed justification (minimum 20 characters)')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.set('task_id', taskId)
    formData.set('requested_date', requestedDate)
    formData.set('reason', reason.trim())

    const result = await requestExtensionAction(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 150ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarClock size={18} color="var(--color-accent)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              Request Deadline Extension
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
            className="hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
          Request an adjustment to the scheduled completion date for <strong style={{ color: '#FFFFFF' }}>{taskTitle}</strong>.
          Leadership will review and approve or decline with a rationale.
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 99, 0, 0.15)',
              border: '1px solid rgba(255, 99, 0, 0.4)',
              color: 'var(--color-orange)',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Current Due Date display */}
          <div
            style={{
              background: 'var(--surface-2)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Current Due Date:</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {currentDueDate || 'No due date set'}
            </strong>
          </div>

          {/* Proposed Date */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Proposed New Due Date *
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--surface-0)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
              className="focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Reason */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Reason & Context *
              </label>
              <span style={{ fontSize: '11px', color: reason.trim().length >= 20 ? 'var(--color-accent)' : 'var(--text-muted)' }}>
                {reason.trim().length} / 20 chars min
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the circumstances or blockers necessitating this extension (minimum 20 characters)..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--surface-0)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              className="focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              className="hover:bg-[var(--surface-3)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 20 || !requestedDate}
              style={{
                background: 'var(--color-accent)',
                color: 'var(--surface-0)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading || reason.trim().length < 20 || !requestedDate ? 'not-allowed' : 'pointer',
                opacity: loading || reason.trim().length < 20 || !requestedDate ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
