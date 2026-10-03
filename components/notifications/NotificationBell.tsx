// components/notifications/NotificationBell.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

interface NotificationBellProps {
  userId: string
  initialNotifications: Notification[]
  initialUnreadCount: number
}

export function NotificationBell({
  userId,
  initialNotifications,
  initialUnreadCount,
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50))
          setUnreadCount((c) => c + 1)
          toast.info(newNotif.message, {
            title: 'Notification',
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function markRead(notifId: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', notifId)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function markAllRead() {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '8px',
          background: 'transparent',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          transition: 'all 150ms ease',
        }}
        className="hover:bg-[var(--color-overlay)] hover:text-[var(--text-primary)]"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        id="notification-bell-btn"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--color-orange)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--surface-2)',
            }}
            aria-live="polite"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 360,
            maxHeight: 480,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 150ms ease',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          }}
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Notifications</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="btn btn-ghost btn-sm"
                  title="Mark all as read"
                  style={{ fontSize: '11px', gap: 4 }}
                >
                  <CheckCheck size={12} />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm"
                aria-label="Close notifications"
                style={{ padding: '4px' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 16px',
                    background: notif.read ? 'transparent' : 'rgba(185,251,194,0.04)',
                    border: 'none',
                    borderBottom: '1px solid var(--border-default)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 150ms ease',
                  }}
                  className="hover:bg-[var(--color-overlay)]"
                >
                  {/* Unread dot */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: notif.read ? 'transparent' : 'var(--color-accent)',
                      flexShrink: 0,
                      marginTop: '5px',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '13px',
                        color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                        marginBottom: '4px',
                        lineHeight: 1.4,
                      }}
                    >
                      {notif.message}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatDate(notif.created_at)}
                    </span>
                  </div>
                  {notif.read && (
                    <Check size={12} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 4 }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
