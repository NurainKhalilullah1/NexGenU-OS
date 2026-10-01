// lib/validations/extension.ts
import { z } from 'zod'

export const requestExtensionSchema = z.object({
  task_id: z.string().uuid(),
  requested_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  reason: z.string().min(20, 'Please provide a detailed reason (min 20 chars)').max(1000),
})

export type RequestExtensionInput = z.infer<typeof requestExtensionSchema>

export const decideExtensionSchema = z.object({
  extension_id: z.string().uuid(),
  decision: z.enum(['approved', 'declined', 'denied']),
  decision_note: z.string().max(1000).optional(),
})

export type DecideExtensionInput = z.infer<typeof decideExtensionSchema>

