// components/dashboard/head/ReturnedFeedbackBanner.tsx
'use client'

import { AlertTriangle, Send } from 'lucide-react'

interface ReturnedFeedbackBannerProps {
  feedback: string | null
  onOpenSubmitModal?: () => void
}

export function ReturnedFeedbackBanner({
  feedback,
  onOpenSubmitModal,
}: ReturnedFeedbackBannerProps) {
  return (
    <div
      style={{
        background: 'rgba(255, 99, 0, 0.12)',
        border: '1px solid rgba(255, 99, 0, 0.35)',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} style={{ color: 'var(--color-orange)', flexShrink: 0 }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FF9A50', margin: 0 }}>
            Submission Returned with Feedback
          </h3>
        </div>
        {onOpenSubmitModal && (
          <button
            onClick={onOpenSubmitModal}
            className="btn btn-primary"
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Send size={13} />
            Resubmit Work
          </button>
        )}
      </div>

      <div
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '13px',
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          borderLeft: '3px solid var(--color-orange)',
        }}
      >
        {feedback ? feedback : 'No specific feedback was provided. Please review task requirements and resubmit.'}
      </div>
    </div>
  )
}
