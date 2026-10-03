// components/layout/Sidebar.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  ClipboardList,
  Users,
  ChevronLeft,
  ChevronRight,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react'
import type { User } from '@/types/database'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/command', label: 'Command', icon: LayoutDashboard, adminOnly: true },
  { href: '/head', label: 'My Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/command/tasks', label: 'All Tasks', icon: CheckSquare, adminOnly: true },
]

interface SidebarProps {
  user: User
  unreadCount?: number
}

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const isAdmin = user.role === 'admin'

  const navItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin)
  ).filter(
    (item) => !(!item.adminOnly && isAdmin)
  )

  const sidebarItems = isAdmin
    ? [
        { href: '/command', label: 'Command Center', icon: LayoutDashboard },
        { href: '/command/tasks', label: 'All Tasks', icon: CheckSquare },
        { href: '/command/reports', label: 'Reports', icon: BarChart3 },
        { href: '/command/review', label: 'Review Queue', icon: ClipboardList },
        { href: '/command/audit', label: 'Audit Log', icon: FileText },
        { href: '/settings/notifications', label: 'Notification Settings', icon: Settings },
      ]
    : [
        { href: '/head', label: 'My Dashboard', icon: LayoutDashboard },
        { href: '/head/tasks', label: 'My Tasks', icon: CheckSquare },
        { href: '/settings/notifications', label: 'Notification Settings', icon: Settings },
      ]

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'width 300ms ease',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid var(--border-default)',
          gap: '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
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
            width={24}
            height={24}
            style={{ objectFit: 'contain' }}
          />
        </div>
        {!collapsed && (
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            NexGenU
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {sidebarItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/command' && href !== '/head' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 12px' : '10px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                background: active ? 'rgba(185,251,194,0.12)' : 'transparent',
                color: active ? 'var(--color-accent)' : 'var(--text-secondary)',
                transition: 'all 150ms ease-out',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              className="hover:bg-[var(--color-overlay)] hover:text-[var(--text-primary)]"
              title={collapsed ? label : undefined}
            >
              <Icon size={18} color={active ? '#B9FBC2' : undefined} />
              {!collapsed && (
                <span style={{ fontSize: '14px', fontWeight: active ? 500 : 400 }}>{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: '50%',
          right: -12,
          transform: 'translateY(-50%)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'var(--surface-3)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          zIndex: 10,
          transition: 'all 150ms ease',
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        id="sidebar-collapse-btn"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Role tag at bottom */}
      {!collapsed && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-default)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span
            style={{
              background: isAdmin ? 'rgba(185,251,194,0.12)' : 'rgba(207,193,252,0.12)',
              color: isAdmin ? 'var(--color-accent)' : 'var(--color-lavender)',
              border: `1px solid ${isAdmin ? 'rgba(185,251,194,0.3)' : 'rgba(207,193,252,0.3)'}`,
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {isAdmin ? 'Admin' : 'Head'}
          </span>
        </div>
      )}
    </aside>
  )
}
