// components/layout/MobileNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, ClipboardList, Bell, Inbox } from 'lucide-react'
import type { User } from '@/types/database'

interface MobileNavProps {
  user: User
  unreadCount?: number
}

export function MobileNav({ user, unreadCount = 0 }: MobileNavProps) {
  const pathname = usePathname()
  const isAdmin = user.role === 'admin'

  const items = isAdmin
    ? [
        { href: '/command', label: 'Command', icon: LayoutDashboard },
        { href: '/command/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/command/review', label: 'Review', icon: ClipboardList },
      ]
    : user.role === 'head'
    ? [
        { href: '/head', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/head/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/head/team-inbox', label: 'Inbox', icon: Inbox },
      ]
    : [
        { href: '/member', label: 'My Work', icon: LayoutDashboard },
      ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: 'var(--surface-2)',
        borderTop: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
        zIndex: 100,
      }}
      aria-label="Mobile navigation"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/command' && href !== '/head' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: active ? 'var(--color-accent)' : 'var(--text-muted)',
              transition: 'color 150ms ease',
              minWidth: 64,
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        )
      })}

      {/* Notifications tab */}
      <button
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          position: 'relative',
          minWidth: 64,
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 12,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--color-orange)',
              fontSize: '9px',
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--surface-2)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span style={{ fontSize: '10px' }}>Alerts</span>
      </button>
    </nav>
  )
}
