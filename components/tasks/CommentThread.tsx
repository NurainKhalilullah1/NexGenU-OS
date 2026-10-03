// components/tasks/CommentThread.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import type { Comment } from '@/types/database'
import { addCommentAction } from '@/app/(dashboard)/actions/collaboration'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Send, Loader2, MessageSquare } from 'lucide-react'
import { toast } from '@/lib/toast'

interface CommentThreadProps {
  taskId: string
  initialComments: Comment[]
  currentUserId: string
  currentUserName: string
}

export function CommentThread({
  taskId,
  initialComments,
  currentUserId,
  currentUserName,
}: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on initial load and when new comments arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [comments])

  // Supabase Realtime Subscription for new comments
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`,
        },
        async (payload) => {
          const newCommentRow = payload.new as Comment
          // Avoid duplicate if we already appended our own comment locally
          setComments((prev) => {
            if (prev.some((c) => c.id === newCommentRow.id)) return prev

            // Fetch user info for the new comment if needed
            return [
              ...prev,
              {
                ...newCommentRow,
                user:
                  newCommentRow.user_id === currentUserId
                    ? {
                        id: currentUserId,
                        full_name: currentUserName,
                        email: '',
                        role: 'head',
                        pillar_id: null,
                        active: true,
                        created_at: '',
                      }
                    : prev.find((c) => c.user_id === newCommentRow.user_id)?.user,
              },
            ]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId, currentUserId, currentUserName])

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!body.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.set('task_id', taskId)
    formData.set('body', body.trim())

    const result = await addCommentAction(formData)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      setSubmitting(false)
      return
    }

    if (result.data) {
      const newComment = result.data
      setComments((prev) => {
        if (prev.some((c) => c.id === newComment.id)) return prev
        return [...prev, newComment]
      })
      setBody('')
      toast.success('Comment posted!')
    }

    setSubmitting(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  function getInitials(name?: string) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '28px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <MessageSquare size={18} color="var(--color-accent)" />
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
          Discussion & Comments
        </h2>
        <span
          style={{
            fontSize: '11px',
            background: 'var(--surface-3)',
            color: 'var(--text-secondary)',
            padding: '2px 8px',
            borderRadius: '12px',
            marginLeft: 'auto',
          }}
        >
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Comment List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxHeight: '420px',
          overflowY: 'auto',
          paddingRight: '6px',
          marginBottom: '20px',
        }}
      >
        {comments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            No comments yet. Start the conversation below.
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.user_id === currentUserId
            const authorName = comment.user?.full_name || (isOwn ? currentUserName : 'Team Member')
            const initials = getInitials(authorName)
            const role = comment.user?.role

            return (
              <div
                key={comment.id}
                style={{
                  display: 'flex',
                  flexDirection: isOwn ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isOwn ? 'var(--color-surface)' : 'var(--surface-3)',
                    border: isOwn ? '1px solid var(--color-accent)' : '1px solid var(--border-default)',
                    color: isOwn ? 'var(--color-accent)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                  title={authorName}
                >
                  {initials}
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    maxWidth: '75%',
                    background: isOwn ? 'rgba(185, 251, 194, 0.08)' : 'var(--surface-2)',
                    border: `1px solid ${isOwn ? 'rgba(185, 251, 194, 0.3)' : 'var(--border-default)'}`,
                    borderRadius: isOwn ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                    padding: '12px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {authorName}
                    </span>
                    {role && (
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: role === 'admin' ? 'var(--color-orange)' : 'var(--color-lavender)',
                          background: 'rgba(0, 0, 0, 0.2)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        {role}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-muted)' }}>
                      {comment.created_at
                        ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                        : 'just now'}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {comment.body}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 99, 0, 0.15)',
              border: '1px solid rgba(255, 99, 0, 0.4)',
              color: 'var(--color-orange)',
              fontSize: '12px',
              marginBottom: '10px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a comment... (Cmd/Ctrl + Enter to send)"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--surface-0)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '12px 90px 12px 14px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            className="focus:border-[var(--color-accent)] transition-colors"
          />

          <button
            type="submit"
            disabled={submitting || !body.trim()}
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '12px',
              background: body.trim() ? 'var(--color-accent)' : 'var(--surface-3)',
              color: body.trim() ? 'var(--surface-0)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: body.trim() && !submitting ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 150ms ease-out',
            }}
          >
            {submitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <Send size={12} />
                Send
              </>
            )}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span>Shift+Enter for newline</span>
          <span>Cmd/Ctrl+Enter to post</span>
        </div>
      </form>
    </div>
  )
}
