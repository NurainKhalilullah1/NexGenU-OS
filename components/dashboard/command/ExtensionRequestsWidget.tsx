// components/dashboard/command/ExtensionRequestsWidget.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ExtensionRequest } from '@/types/database'
import {
  approveExtensionAction,
  declineExtensionAction,
} from '@/app/(dashboard)/actions/collaboration'
import { CalendarClock, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface ExtensionRequestsWidgetProps {
  requests: ExtensionRequest[]
}

export function ExtensionRequestsWidget({ requests }: ExtensionRequestsWidgetProps) {
  const router = useRouter()
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!requests || requests.length === 0) return null

  async function handleApprove(requestId: string) {
    setLoadingId(requestId)
    setError(null)
    const result = await approveExtensionAction(requestId)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
    setLoadingId(null)
  }

  async function handleDecline(requestId: string) {
    if (!decisionNote.trim() || decisionNote.trim().length < 3) {
      setError('Please provide a reason for declining (minimum 3 characters)')
      return
    }

    setLoadingId(requestId)
    setError(null)
    const result = await declineExtensionAction(requestId, decisionNote.trim())
    if (result.error) {
      setError(result.error)
    } else {
      setDecliningId(null)
      setDecisionNote('')
      router.refresh()
    }
    setLoadingId(null)
  }

  return (
    <section style={{ marginBottom: '28px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <CalendarClock size={16} color="var(--color-lavender)" />
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
          Deadline Extension Requests
        </h2>
        <span
          className="badge badge-submitted"
          style={{ fontSize: '11px', background: 'rgba(207, 193, 252, 0.15)', color: 'var(--color-lavender)' }}
        >
          {requests.length}
        </span>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(255, 99, 0, 0.15)',
            border: '1px solid rgba(255, 99, 0, 0.4)',
            color: 'var(--color-orange)',
            fontSize: '12px',
            marginBottom: '12px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {requests.map((req) => {
          const isDeclining = decliningId === req.id
          const isExpanded = expandedId === req.id
          const isLoading = loadingId === req.id

          return (
            <div
              key={req.id}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Title & Metadata */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {req.task?.title || 'Task'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        background: 'var(--surface-3)',
                        color: 'var(--text-muted)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {req.task?.pillar?.nickname || 'Pillar'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Requested by <strong>{req.requester?.full_name || 'Team Lead'}</strong> &middot;{' '}
                    Current: <span style={{ color: 'var(--text-muted)' }}>{req.original_date}</span> &rarr;{' '}
                    Proposed: <strong style={{ color: 'var(--color-accent)' }}>{req.requested_date}</strong>
                  </div>
                </div>

                {/* Actions */}
                {!isDeclining && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={isLoading}
                      style={{
                        background: 'var(--color-accent)',
                        color: 'var(--surface-0)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      className="hover:opacity-90"
                    >
                      {isLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      Approve
                    </button>

                    <button
                      onClick={() => {
                        setDecliningId(req.id)
                        setDecisionNote('')
                      }}
                      disabled={isLoading}
                      style={{
                        background: 'transparent',
                        color: 'var(--color-orange)',
                        border: '1px solid rgba(255, 99, 0, 0.4)',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      className="hover:bg-[rgba(255,99,0,0.1)]"
                    >
                      <X size={13} />
                      Decline
                    </button>
                  </div>
                )}
              </div>

              {/* Reason toggle */}
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                  className="hover:text-[var(--text-secondary)]"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isExpanded ? 'Hide Reason' : 'Show Reason'}
                </button>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '10px 14px',
                      background: 'var(--surface-2)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {req.reason}
                  </div>
                )}
              </div>

              {/* Inline Decline Note Input */}
              {isDeclining && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-default)',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-orange)',
                      marginBottom: '6px',
                    }}
                  >
                    Provide Reason for Declining (Required)
                  </label>
                  <textarea
                    rows={2}
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="Explain to the head why this extension cannot be granted..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'var(--surface-0)',
                      border: '1px solid rgba(255, 99, 0, 0.4)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      marginBottom: '8px',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setDecliningId(null)}
                      style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(req.id)}
                      disabled={isLoading || decisionNote.trim().length < 3}
                      style={{
                        background: 'var(--color-orange)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isLoading || decisionNote.trim().length < 3 ? 'not-allowed' : 'pointer',
                        opacity: isLoading || decisionNote.trim().length < 3 ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isLoading && <Loader2 size={13} className="animate-spin" />}
                      Confirm Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
