// types/database.ts
// Hand-written until `supabase gen types` can run after migrations are applied.

export type Role = 'admin' | 'head' | 'member'
export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'submitted' | 'returned' | 'approved'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskRecurrence = 'none' | 'weekly' | 'biweekly' | 'monthly'
export type ReviewStatus = 'pending' | 'approved' | 'returned'
export type NotificationType =
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_overdue'
  | 'submission_received'
  | 'submission_approved'
  | 'submission_returned'
  | 'extension_decided'
  | 'new_comment'
  | 'extension_requested'
  | 'internal_submission_received'  // member submitted to head
  | 'internal_submission_reviewed'  // head reviewed member's submission
export type ExtensionStatus = 'pending' | 'approved' | 'declined' | 'denied'

export interface Pillar {
  id: string
  name: string
  nickname: string
  created_at: string
}

export interface PillarWorkload {
  pillar: Pillar
  open: number
  overdue: number
  completedThisMonth: number
  totalAssigned: number
  capacityPercentage: number
}

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  pillar_id: string | null
  active: boolean
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  pillar_id: string
  assignee_id: string | null
  created_by: string
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  kpi_ref: string | null
  recurrence: TaskRecurrence | null
  archived: boolean
  created_at: string
  updated_at: string
  // Joined fields (optional)
  pillar?: Pillar
  assignee?: User
  creator?: User
  is_overdue?: boolean
  comments_count?: number
  has_pending_extension?: boolean
}

export interface TaskLog {
  id: string
  task_id: string
  user_id: string
  log_date: string
  hours: number | null
  note: string
  created_at: string
  user?: User
}

export interface Submission {
  id: string
  task_id: string
  user_id: string
  note: string
  links: string[]
  file_paths?: string[]
  submitted_at: string
  review_status: ReviewStatus
  reviewer_id: string | null
  feedback: string | null
  reviewed_at: string | null
  user?: User
  reviewer?: User
}

export interface InternalSubmission {
  id: string
  task_id: string
  submitted_by: string
  notes: string
  file_urls: string[]
  status: 'pending' | 'approved' | 'returned'
  head_feedback: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  submitter?: User
  reviewer?: User
  task?: Pick<Task, 'id' | 'title' | 'pillar_id'>
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string
  user?: User
}

export interface ExtensionRequest {
  id: string
  task_id: string
  requester_id: string
  original_date: string
  requested_date: string
  reason: string
  status: ExtensionStatus
  decision_note?: string | null
  reviewer_id: string | null
  reviewed_at: string | null
  created_at: string
  requester?: User
  reviewer?: User
  task?: Task
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  task_id: string | null
  message: string
  read: boolean
  created_at: string
  task?: Pick<Task, 'id' | 'title'>
}

export interface NotificationSettings {
  id: string
  user_id: string
  email_notifications: boolean
  email_task_assigned: boolean
  email_task_due_soon: boolean
  email_task_overdue: boolean
  email_submission_received: boolean
  email_submission_approved: boolean
  email_submission_returned: boolean
  email_extension_requested: boolean
  email_extension_decided: boolean
  email_new_comment: boolean
  daily_digest: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_id: string
  action: string
  entity: string
  entity_id: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
  actor?: User
}

// Server action result type
export interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

