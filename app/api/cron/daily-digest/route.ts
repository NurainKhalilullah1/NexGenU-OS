// app/api/cron/daily-digest/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { dailyDigestEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email/send'
import { format } from 'date-fns'

export async function GET(request: Request) {
  // Check authorization header with CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  // Fetch all active heads with daily_digest enabled (or default)
  const { data: heads, error: headsErr } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      pillar_id,
      pillar:pillars(id, name, nickname)
    `)
    .eq('role', 'head')
    .eq('active', true)

  if (headsErr || !heads) {
    return NextResponse.json({ error: 'Failed to fetch heads' }, { status: 500 })
  }

  let sentCount = 0

  for (const head of heads) {
    if (!head.email || !head.pillar_id) continue

    // Check notification settings for this head
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('daily_digest, email_notifications')
      .eq('user_id', head.id)
      .maybeSingle()

    if (settings && (!settings.daily_digest || !settings.email_notifications)) {
      continue
    }

    // Fetch overdue tasks for this head's pillar
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .eq('pillar_id', head.pillar_id)
      .lt('due_date', todayStr)
      .neq('status', 'approved')
      .eq('archived', false)

    // Fetch tasks due today
    const { data: dueTodayTasks } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('pillar_id', head.pillar_id)
      .eq('due_date', todayStr)
      .neq('status', 'approved')
      .eq('archived', false)

    const overdue = overdueTasks ?? []
    const dueToday = dueTodayTasks ?? []

    // Only send if there are tasks
    if (overdue.length > 0 || dueToday.length > 0) {
      const pillarObj = head.pillar as unknown as { name: string } | null
      const emailContent = dailyDigestEmail({
        headName: head.full_name || 'Team Lead',
        pillarName: pillarObj?.name || 'Pillar',
        overdueTasks: overdue,
        dueTodayTasks: dueToday,
      })

      await sendEmail({
        to: head.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })

      sentCount++
    }
  }

  return NextResponse.json({ success: true, digestsSent: sentCount })
}
