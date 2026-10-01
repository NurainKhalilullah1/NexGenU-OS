// lib/validations/submission.ts
import { z } from 'zod'

export const submitTaskSchema = z.object({
  task_id: z.string().uuid(),
  note: z.string().max(2000).default(''),
  links: z.array(z.string().url('Invalid URL')).default([]),
  file_paths: z.array(z.string()).default([]),
}).refine(
  (data) => data.note.trim().length > 0 || data.links.length > 0 || (data.file_paths && data.file_paths.length > 0),
  { message: 'Please provide a note, at least one link, or an attached file', path: ['note'] }
)

export type SubmitTaskInput = z.infer<typeof submitTaskSchema>

export const addWorkLogSchema = z.object({
  task_id: z.string().uuid(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  hours: z.number().min(0.25).max(24).optional().nullable(),
  note: z.string().min(3, 'Note must be at least 3 characters').max(1000),
})

export type AddWorkLogInput = z.infer<typeof addWorkLogSchema>
