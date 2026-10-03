// app/(dashboard)/member/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { createInternalSubmission } from '@/lib/db/internal-submissions'
import { createNotifications } from '@/lib/db/notifications'
import { addAuditLog } from '@/lib/db/audit-log'
import { revalidatePath } from 'next/cache'
import type { ActionResult, InternalSubmission } from '@/types/database'

async function getMemberUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'member' || !profile.pillar_id) return null
  return profile
}

export async function memberSubmitTaskAction(
  formData: FormData
): Promise<ActionResult<InternalSubmission>> {
  const member = await getMemberUser()
  if (!member) return { data: null, error: 'Unauthorized' }

  const taskId = formData.get('task_id') as string
  const notes = (formData.get('notes') as string) || ''

  if (!notes.trim()) return { data: null, error: 'Please add a note describing your work.' }

  const result = await createInternalSubmission({
    task_id: taskId,
    submitted_by: member.id,
    notes,
  })
  if (result.error) return result

  // Notify all heads in this pillar
  const supabase = await createClient()
  const { data: heads } = await supabase
    .from('users')
    .select('id')
    .eq('pillar_id', member.pillar_id)
    .eq('role', 'head')
    .eq('active', true)

  if (heads && heads.length > 0) {
    await createNotifications(
      heads.map((h) => ({
        user_id: h.id,
        type: 'internal_submission_received' as const,
        task_id: taskId,
        message: `${member.full_name} submitted work for your review.`,
      }))
    )
  }

  await addAuditLog({
    actor_id: member.id,
    action: 'internal_submission.created',
    entity: 'internal_submissions',
    entity_id: result.data!.id,
    before: null,
    after: { task_id: taskId, notes },
  })

  revalidatePath('/member')
  return result
}
