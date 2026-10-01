// lib/validations/task.ts
import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(5000).default(''),
  pillar_id: z.string().uuid('Please select a pillar'),
  assignee_id: z.string().uuid('Please select an assignee').optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  kpi_ref: z.string().max(200).optional().nullable(),
  recurrence: z.enum(['none', 'weekly', 'biweekly', 'monthly']).default('none'),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const updateTaskStatusSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'submitted', 'returned', 'approved']),
  blocked_reason: z.string().min(10, 'Please describe why the task is blocked').optional(),
})

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>

export const returnTaskSchema = z.object({
  task_id: z.string().uuid(),
  submission_id: z.string().uuid(),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters'),
})

export type ReturnTaskInput = z.infer<typeof returnTaskSchema>

export const approveTaskSchema = z.object({
  task_id: z.string().uuid(),
  submission_id: z.string().uuid(),
})

export type ApproveTaskInput = z.infer<typeof approveTaskSchema>
