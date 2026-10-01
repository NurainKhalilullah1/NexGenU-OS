// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns'
import type { TaskStatus, TaskPriority } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for display
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}

// Format relative date (e.g. "2 days overdue", "due today")
export function formatDueDate(date: string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isToday(d)) return 'Due today'
  if (isTomorrow(d)) return 'Due tomorrow'
  if (isPast(d)) {
    const days = Math.abs(differenceInDays(d, new Date()))
    return `${days}d overdue`
  }
  return `Due ${format(d, 'MMM d')}`
}

// Compute if a task is overdue
export function isOverdue(dueDate: string | null | undefined, status: TaskStatus): boolean {
  if (!dueDate || status === 'approved') return false
  return isPast(new Date(dueDate)) && !isToday(new Date(dueDate))
}

// Status display labels
export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  submitted: 'Submitted',
  returned: 'Returned',
  approved: 'Approved',
}

// Priority display labels
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

// Truncate text
export function truncate(text: string, maxLength = 80): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

// Format hours
export function formatHours(hours: number | null): string {
  if (hours === null) return '—'
  return `${hours}h`
}

// Get initials from full name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
