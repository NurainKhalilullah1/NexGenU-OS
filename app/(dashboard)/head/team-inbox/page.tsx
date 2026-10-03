// app/(dashboard)/head/team-inbox/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInternalSubmissionsForHead } from '@/lib/db/internal-submissions'
import { TeamInbox } from '@/components/dashboard/head/TeamInbox'

export const metadata: Metadata = { title: 'Team Inbox | NexGenU OS' }

export default async function TeamInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('*, pillar:pillars(id, name, nickname)').eq('id', user.id).single()
  if (!profile || profile.role !== 'head') redirect('/login')
  if (!profile.pillar_id) redirect('/head')

  const submissions = await getInternalSubmissionsForHead(profile.pillar_id)

  return (
    <div className="page-content">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(207,193,252,0.15)', color: 'var(--color-lavender)', padding: '2px 8px', borderRadius: '4px' }}>
            {profile.pillar?.nickname ?? 'Head'}
          </span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Team Inbox</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Review and action work submitted by your team members.
        </p>
      </div>
      <TeamInbox submissions={submissions} headId={user.id} />
    </div>
  )
}
