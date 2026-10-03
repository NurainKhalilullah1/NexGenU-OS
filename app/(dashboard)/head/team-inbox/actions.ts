'use server'
// app/(dashboard)/head/team-inbox/actions.ts
import { createClient } from '@/lib/supabase/server'
import { reviewInternalSubmission } from '@/lib/db/internal-submissions'
import { createNotifications } from '@/lib/db/notifications'
import { addAuditLog } from '@/lib/db/audit-log'
import { revalidatePath } from 'next/cache'
import type { ActionResult, InternalSubmission } from '@/types/database'

async function getHeadUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'head' || !profile.pillar_id) return null
  return profile
}

export async function reviewMemberSubmissionAction(
  submissionId: string,
  taskId: string,
  submittedById: string,
  status: 'approved' | 'returned',
  feedback: string
): Promise<ActionResult<InternalSubmission>> {
  const head = await getHeadUser()
  if (!head) return { data: null, error: 'Unauthorized' }
  if (!feedback.trim()) return { data: null, error: 'Feedback is required.' }

  const result = await reviewInternalSubmission({
    id: submissionId,
    status,
    head_feedback: feedback,
    reviewer_id: head.id,
  })
  if (result.error) return result

  await createNotifications([{
    user_id: submittedById,
    type: 'internal_submission_reviewed',
    task_id: taskId,
    message: status === 'approved'
      ? head.full_name + ' approved your submission.'
      : head.full_name + ' returned your submission with feedback.',
  }])

  await addAuditLog({
    actor_id: head.id,
    action: 'internal_submission.' + status,
    entity: 'internal_submissions',
    entity_id: submissionId,
    before: { status: 'pending' },
    after: { status, head_feedback: feedback },
  })

  revalidatePath('/head')
  revalidatePath('/head/team-inbox')
  revalidatePath('/member')
  return result
}
