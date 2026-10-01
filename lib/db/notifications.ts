// lib/db/notifications.ts
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Notification, NotificationType, ActionResult } from '@/types/database'

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*, task:tasks(id, title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return data as Notification[]
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  return count ?? 0
}

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function markAllRead(userId: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// Server-side only: create notification (uses service client to bypass RLS)
export async function createNotification(notification: {
  user_id: string
  type: NotificationType
  task_id: string | null
  message: string
}): Promise<ActionResult<Notification>> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Notification, error: null }
}

// Create notifications for multiple users at once
export async function createNotifications(notifications: Array<{
  user_id: string
  type: NotificationType
  task_id: string | null
  message: string
}>): Promise<void> {
  if (notifications.length === 0) return
  const supabase = createServiceClient()
  await supabase.from('notifications').insert(notifications)
}
