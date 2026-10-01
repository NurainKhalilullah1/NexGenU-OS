// lib/db/notification-settings.ts
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { NotificationSettings, NotificationType, ActionResult } from '@/types/database'

export const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  email_notifications: true,
  email_task_assigned: true,
  email_task_due_soon: true,
  email_task_overdue: true,
  email_submission_received: true,
  email_submission_approved: true,
  email_submission_returned: true,
  email_extension_requested: true,
  email_extension_decided: true,
  email_new_comment: true,
  daily_digest: true,
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return {
      id: '',
      user_id: userId,
      ...DEFAULT_NOTIFICATION_SETTINGS,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  return data as NotificationSettings
}

export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<ActionResult<NotificationSettings>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as NotificationSettings, error: null }
}

export async function shouldSendEmail(userId: string, eventType: NotificationType): Promise<boolean> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // Default to true if no row configured yet
  if (error || !data) return true

  const s = data as NotificationSettings
  if (!s.email_notifications) return false

  switch (eventType) {
    case 'task_assigned':
      return s.email_task_assigned
    case 'task_due_soon':
      return s.email_task_due_soon
    case 'task_overdue':
      return s.email_task_overdue
    case 'submission_received':
      return s.email_submission_received
    case 'submission_approved':
      return s.email_submission_approved
    case 'submission_returned':
      return s.email_submission_returned
    case 'extension_requested':
      return s.email_extension_requested
    case 'extension_decided':
      return s.email_extension_decided
    case 'new_comment':
      return s.email_new_comment
    default:
      return true
  }
}
