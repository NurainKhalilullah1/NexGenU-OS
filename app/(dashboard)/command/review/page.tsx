// app/(dashboard)/command/review/page.tsx — Review Queue Page
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPendingSubmissions } from '@/lib/db/submissions'
import { ReviewQueueSection } from '@/components/dashboard/command/ReviewQueueSection'
import { EmptyState } from '@/components/dashboard/shared/EmptyState'
import { ClipboardList, ArrowLeft, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Review Queue | Command Center',
}

export default async function ReviewQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/head')

  const pendingSubmissions = await getPendingSubmissions()

  return (
    <div className="page-content">
      {/* Back button */}
      <Link
        href="/command"
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
        Back to Command Center
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Review Queue</h1>
          {pendingSubmissions.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                background: 'rgba(207, 193, 252, 0.2)',
                color: 'var(--color-lavender)',
                border: '1px solid rgba(207, 193, 252, 0.35)',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {pendingSubmissions.length} pending
            </span>
          )}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
          Deliverables submitted by pillar heads awaiting leadership approval or feedback.
        </p>
      </div>

      {pendingSubmissions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Review Queue is Clear"
          description="All submitted deliverables have been reviewed. High quality execution all around!"
        />
      ) : (
        <ReviewQueueSection submissions={pendingSubmissions} />
      )}
    </div>
  )
}
