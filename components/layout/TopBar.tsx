// components/layout/TopBar.tsx
import { Search, LogOut, User as UserIcon } from 'lucide-react'
import { getNotificationsForUser, getUnreadCount } from '@/lib/db/notifications'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import type { User } from '@/types/database'
import { getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface TopBarProps {
  user: User
  pageTitle?: string
}

async function SignOutButton() {
  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <form action={signOut}>
      <button type="submit" className="btn btn-ghost btn-sm" style={{ gap: 6 }} id="topbar-signout-btn">
        <LogOut size={14} />
        Sign out
      </button>
    </form>
  )
}

export async function TopBar({ user, pageTitle }: TopBarProps) {
  const [notifications, unreadCount] = await Promise.all([
    getNotificationsForUser(user.id),
    getUnreadCount(user.id),
  ])

  return (
    <header
      style={{
        height: 60,
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      {/* Page title */}
      {pageTitle && (
        <h1
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            flex: 1,
            marginRight: '16px',
          }}
        >
          {pageTitle}
        </h1>
      )}

      <div style={{ flex: 1 }} />

      {/* Notification Bell */}
      <NotificationBell
        userId={user.id}
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />

      {/* User avatar + menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: user.role === 'admin' ? 'rgba(185,251,194,0.2)' : 'rgba(207,193,252,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: user.role === 'admin' ? 'var(--color-accent)' : 'var(--color-lavender)',
            flexShrink: 0,
          }}
          title={user.full_name}
        >
          {getInitials(user.full_name || user.email)}
        </div>
        <div style={{ display: 'none' }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{user.full_name || user.email}</span>
        </div>
        <SignOutButton />
      </div>
    </header>
  )
}
