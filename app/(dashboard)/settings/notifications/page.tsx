// app/(dashboard)/settings/notifications/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNotificationSettings } from '@/lib/db/notification-settings'
import { NotificationSettingsForm } from '@/components/settings/NotificationSettingsForm'

export const metadata: Metadata = { title: 'Notification Settings' }

export default async function NotificationSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const settings = await getNotificationSettings(user.id)

  return (
    <div className="page-content" style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0' }}>
          Notification Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          Manage your email alerts, digests, and activity notifications.
        </p>
      </div>

      <NotificationSettingsForm
        initialSettings={settings}
        userRole={profile.role as 'admin' | 'head'}
      />
    </div>
  )
}
