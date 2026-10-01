// components/settings/NotificationSettingsForm.tsx
'use client'

import { useState } from 'react'
import type { NotificationSettings } from '@/types/database'
import { updateNotificationSettingsAction } from '@/app/(dashboard)/actions/collaboration'
import { Bell, Mail, Check, Loader2, Sparkles, ShieldCheck } from 'lucide-react'

interface NotificationSettingsFormProps {
  initialSettings: NotificationSettings
  userRole: 'admin' | 'head'
}

export function NotificationSettingsForm({
  initialSettings,
  userRole,
}: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle(key: keyof NotificationSettings) {
    const updated = {
      ...settings,
      [key]: !settings[key],
    }
    setSettings(updated)
    setSaving(true)
    setSavedSuccess(false)
    setError(null)

    const result = await updateNotificationSettingsAction({ [key]: updated[key] })

    if (result.error) {
      setError(result.error)
      // Revert local state on error
      setSettings(settings)
    } else {
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    }
    setSaving(false)
  }

  const items = [
    {
      key: 'email_task_assigned' as const,
      label: 'Task Assigned',
      desc: 'Receive an email notification when a new task is assigned to your pillar.',
      roles: ['head'],
    },
    {
      key: 'email_task_due_soon' as const,
      label: 'Task Due in 24 Hours',
      desc: 'Receive a reminder 24 hours before a scheduled task deadline.',
      roles: ['head'],
    },
    {
      key: 'email_task_overdue' as const,
      label: 'Task Overdue Alert',
      desc: 'Urgent email alert when an unapproved task crosses its due date.',
      roles: ['admin', 'head'],
    },
    {
      key: 'email_submission_received' as const,
      label: 'Work Submitted for Review',
      desc: 'Receive an email when a pillar head submits task deliverables.',
      roles: ['admin'],
    },
    {
      key: 'email_submission_approved' as const,
      label: 'Submission Approved',
      desc: 'Receive an email confirmation when your submission is approved by leadership.',
      roles: ['head'],
    },
    {
      key: 'email_submission_returned' as const,
      label: 'Submission Returned with Feedback',
      desc: 'Receive an email alert when leadership requests revisions on submitted work.',
      roles: ['head'],
    },
    {
      key: 'email_extension_requested' as const,
      label: 'Extension Requested',
      desc: 'Receive an email when a pillar head requests a deadline adjustment.',
      roles: ['admin'],
    },
    {
      key: 'email_extension_decided' as const,
      label: 'Extension Decision (Approved / Declined)',
      desc: 'Receive an email when leadership approves or declines your deadline extension.',
      roles: ['head'],
    },
    {
      key: 'email_new_comment' as const,
      label: 'New Task Comments',
      desc: 'Receive an email when someone posts a comment on your active tasks.',
      roles: ['admin', 'head'],
    },
    {
      key: 'daily_digest' as const,
      label: 'Daily Morning Briefing (8:00 AM)',
      desc: 'A consolidated morning digest of tasks due today and overdue items for your pillar.',
      roles: ['head'],
    },
  ]

  const relevantItems = items.filter((item) => item.roles.includes(userRole))

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mail size={20} color="var(--color-accent)" />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              Email & Alert Preferences
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Configure when NexGenU OS delivers notifications to your inbox.
            </p>
          </div>
        </div>

        {saving && (
          <span style={{ fontSize: '12px', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Loader2 size={13} className="animate-spin" /> Saving…
          </span>
        )}

        {savedSuccess && (
          <span style={{ fontSize: '12px', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} /> Saved
          </span>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 99, 0, 0.15)',
            border: '1px solid rgba(255, 99, 0, 0.4)',
            color: 'var(--color-orange)',
            fontSize: '13px',
            marginBottom: '18px',
          }}
        >
          {error}
        </div>
      )}

      {/* Master Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-2)',
          padding: '16px 18px',
          borderRadius: '10px',
          marginBottom: '24px',
          border: '1px solid var(--border-default)',
        }}
      >
        <div>
          <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
            Master Email Notifications
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Turn off to suppress all outbound emails while keeping in-app bell notifications active.
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleToggle('email_notifications')}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: settings.email_notifications ? 'var(--color-accent)' : 'var(--surface-3)',
            border: 'none',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background-color 200ms ease',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: settings.email_notifications ? 'var(--surface-0)' : 'var(--text-muted)',
              position: 'absolute',
              top: '3px',
              left: settings.email_notifications ? '23px' : '3px',
              transition: 'left 200ms ease',
            }}
          />
        </button>
      </div>

      {/* Individual Event Preferences */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {relevantItems.map((item) => {
          const isEnabled = settings[item.key] && settings.email_notifications

          return (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'var(--surface-0)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                opacity: settings.email_notifications ? 1 : 0.45,
              }}
            >
              <div style={{ maxWidth: '80%' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                  {item.label}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {item.desc}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* In-app badge */}
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-accent)',
                    background: 'rgba(185, 251, 194, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(185, 251, 194, 0.2)',
                  }}
                  title="In-app notification is always enabled"
                >
                  In-App: On
                </span>

                {/* Email toggle */}
                <button
                  type="button"
                  disabled={!settings.email_notifications}
                  onClick={() => handleToggle(item.key)}
                  style={{
                    width: '40px',
                    height: '22px',
                    borderRadius: '11px',
                    background: isEnabled ? 'var(--color-accent)' : 'var(--surface-3)',
                    border: 'none',
                    position: 'relative',
                    cursor: settings.email_notifications ? 'pointer' : 'not-allowed',
                    transition: 'background-color 200ms ease',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: isEnabled ? 'var(--surface-0)' : 'var(--text-muted)',
                      position: 'absolute',
                      top: '3px',
                      left: isEnabled ? '21px' : '3px',
                      transition: 'left 200ms ease',
                    }}
                  />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
