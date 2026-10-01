// components/tasks/ExtensionHistory.tsx
'use client'

import { useState } from 'react'
import type { ExtensionRequest } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { CalendarClock, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface ExtensionHistoryProps {
  requests: ExtensionRequest[]
}

export function ExtensionHistory({ requests }: ExtensionHistoryProps) {
  const [open, setOpen] = useState(false)

  if (!requests || requests.length === 0) return null

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '20px',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          textAlign: 'left',
        }}
        className="hover:bg-[var(--surface-2)] transition-colors"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarClock size={16} color="var(--color-lavender)" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            Extension History ({requests.length})
          </span>
          {requests.some((r) => r.status === 'pending') && (
            <span
              style={{
                fontSize: '11px',
                background: 'rgba(207, 193, 252, 0.2)',
                color: 'var(--color-lavender)',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(207, 193, 252, 0.4)',
              }}
            >
              1 Pending
            </span>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>

      {open && (
        <div
          style={{
            padding: '0 18px 18px 18px',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '12px',
          }}
        >
          {requests.map((req) => {
            const isApproved = req.status === 'approved'
            const isDeclined = req.status === 'declined' || req.status === 'denied'
            const isPending = req.status === 'pending'

            return (
              <div
                key={req.id}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isApproved && <CheckCircle2 size={16} color="var(--color-accent)" />}
                    {isDeclined && <XCircle size={16} color="var(--color-orange)" />}
                    {isPending && <Clock size={16} color="var(--color-lavender)" />}
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: isApproved
                          ? 'var(--color-accent)'
                          : isDeclined
                          ? 'var(--color-orange)'
                          : 'var(--color-lavender)',
                      }}
                    >
                      {req.status}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Requested: {formatDate(req.created_at)}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Original: <strong style={{ color: 'var(--text-muted)' }}>{req.original_date}</strong> &rarr; Proposed: <strong style={{ color: 'var(--text-primary)' }}>{req.requested_date}</strong>
                  </div>
                </div>

                {/* Reason */}
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Reason: </strong>
                  {req.reason}
                </div>

                {/* Decision note (if present) */}
                {req.decision_note && (
                  <div
                    style={{
                      background: 'var(--surface-0)',
                      borderLeft: `3px solid ${isApproved ? 'var(--color-accent)' : 'var(--color-orange)'}`,
                      padding: '8px 12px',
                      borderRadius: '0 6px 6px 0',
                      fontSize: '12px',
                      color: isDeclined ? '#FF9A50' : 'var(--text-primary)',
                      marginTop: '6px',
                    }}
                  >
                    <strong>Decision Note ({req.reviewer?.full_name || 'Admin'}):</strong> {req.decision_note}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
