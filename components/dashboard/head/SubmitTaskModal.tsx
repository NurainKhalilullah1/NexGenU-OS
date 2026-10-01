// components/dashboard/head/SubmitTaskModal.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitTaskAction } from '@/app/(dashboard)/head/actions'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Trash2, Loader2, Send, Link as LinkIcon, Paperclip, FileText } from 'lucide-react'

interface SubmitTaskModalProps {
  taskId: string
  taskTitle: string
  open: boolean
  onClose: () => void
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_FILES = 3
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'zip']

export function SubmitTaskModal({ taskId, taskTitle, open, onClose }: SubmitTaskModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [links, setLinks] = useState<string[]>([''])
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function handleAddLink() {
    setLinks((prev) => [...prev, ''])
  }

  function handleLinkChange(index: number, value: string) {
    setLinks((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function handleRemoveLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    if (files.length + selected.length > MAX_FILES) {
      setError(`You can attach a maximum of ${MAX_FILES} files per submission.`)
      return
    }

    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 50MB size limit.`)
        return
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`File format ".${ext}" is not supported. Allowed formats: PDF, DOCX, XLSX, PNG, JPG, ZIP.`)
        return
      }
    }

    setFiles((prev) => [...prev, ...selected])
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleRemoveFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('task_id', taskId)

    // filter non-empty links
    const validLinks = links.map((l) => l.trim()).filter((l) => l.length > 0)
    formData.delete('links')
    validLinks.forEach((link) => formData.append('links', link))

    const note = (formData.get('note') as string)?.trim() || ''

    if (!note && validLinks.length === 0 && files.length === 0) {
      setError('Please provide a note, at least one link, or an attached file')
      setLoading(false)
      return
    }

    try {
      // Upload files to Supabase Storage if present
      const uploadedPaths: string[] = []
      if (files.length > 0) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('User session expired. Please reload and log in.')
          setLoading(false)
          return
        }

        for (const file of files) {
          const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const storagePath = `${taskId}/${user.id}/${Date.now()}_${cleanName}`

          const { error: uploadErr } = await supabase.storage
            .from('task-submissions')
            .upload(storagePath, file)

          if (uploadErr) {
            console.error('Storage upload error:', uploadErr)
            setError(`Failed to upload "${file.name}": ${uploadErr.message}`)
            setLoading(false)
            return
          }

          uploadedPaths.push(storagePath)
        }
      }

      uploadedPaths.forEach((path) => formData.append('file_paths', path))

      const result = await submitTaskAction(formData)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setLoading(false)
      router.refresh()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 150ms ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>Submit for Review</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{taskTitle}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
            className="hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 99, 0, 0.15)',
              border: '1px solid rgba(255, 99, 0, 0.4)',
              color: 'var(--color-orange)',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Note */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Submission Notes & Summary
            </label>
            <textarea
              name="note"
              rows={3}
              placeholder="Describe what was accomplished, deliverables created, or any context for leadership review..."
              className="input-field"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Deliverable Links */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>
                Deliverable Links <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Figma, GitHub, Docs)</span>
              </label>
              <button
                type="button"
                onClick={handleAddLink}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent)',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                Add Link
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {links.map((link, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <LinkIcon
                      size={14}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    />
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => handleLinkChange(idx, e.target.value)}
                      placeholder="https://..."
                      className="input-field"
                      style={{ width: '100%', paddingLeft: '34px' }}
                    />
                  </div>
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                      }}
                      className="hover:text-[var(--color-orange)]"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* File Attachments (Phase 2) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>
                File Attachments <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(PDF, DOCX, XLSX, PNG, JPG, ZIP &middot; Max 50MB, up to 3 files)</span>
              </label>
              {files.length < MAX_FILES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-accent)',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Paperclip size={13} />
                  Attach File
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.zip"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {files.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1px dashed var(--border-default)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--surface-0)',
                }}
                className="hover:border-[var(--color-accent)] transition-colors"
              >
                <Paperclip size={20} color="var(--text-muted)" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Click to browse or drop files to upload
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Supports documents, spreadsheets, images, and zip archives
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileText size={16} color="var(--color-accent)" flexShrink={0} />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                        ({formatBytes(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      className="hover:text-[var(--color-orange)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send size={15} />
                  Submit Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
