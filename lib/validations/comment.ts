// lib/validations/comment.ts
import { z } from 'zod'

export const addCommentSchema = z.object({
  task_id: z.string().uuid(),
  body: z.string().min(1, 'Comment cannot be empty').max(3000, 'Comment is too long'),
})

export type AddCommentInput = z.infer<typeof addCommentSchema>
