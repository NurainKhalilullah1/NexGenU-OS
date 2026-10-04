// components/layout/TopBar.tsx
import Image from 'next/image'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
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
    <form action={signOut} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="submit"
        className="btn btn-ghost btn-sm"
        style={{ gap: 6, padding: '6px 10px' }}
        id="topbar-signout-btn"
        title="Sign out"
        aria-label="Sign out"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </form>
  )
}

export async function TopBar({ user, pageTitle }: TopBarProps) {
  const [notifications, unreadCount] = await Promise.all([
    getNotificationsForUser(user.id),
    getUnreadCount(user.id),
  ])

  const homeHref = user.role === 'admin' ? '/command' : user.role === 'head' ? '/head' : '/member'

  return (
    <header
      style={{
        height: 60,
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      {/* Mobile NexGenU Brand Logo — visible on mobile when sidebar is hidden */}
      <Link
        href={homeHref}
        className="flex md:hidden items-center gap-2"
        style={{
          textDecoration: 'none',
          flexShrink: 0,
        }}
        aria-label="NexGenU Home"
        id="topbar-mobile-logo"
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Image
            src="/images/nexgenu-logo.png"
            alt="NexGenU"
            width={22}
            height={22}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          NexGenU
        </span>
      </Link>

      {/* Page title */}
      {pageTitle && (
        <h1
          className="hidden md:block"
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

      {/* User avatar + name + role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: user.role === 'admin' ? 'rgba(185,251,194,0.2)' : user.role === 'head' ? 'rgba(207,193,252,0.2)' : 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: user.role === 'admin' ? 'var(--color-accent)' : user.role === 'head' ? 'var(--color-lavender)' : 'var(--text-primary)',
            flexShrink: 0,
          }}
          title={user.full_name || user.email}
        >
          {getInitials(user.full_name || user.email)}
        </div>
        <div className="hidden sm:flex" style={{ flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {user.full_name || user.email}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: user.role === 'admin' ? 'var(--color-accent)' : user.role === 'head' ? 'var(--color-lavender)' : 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
          >
            {user.role}
          </span>
        </div>
        <SignOutButton />
      </div>
    </header>
  )
}
