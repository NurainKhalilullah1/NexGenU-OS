// components/tasks/FileDownloadButton.tsx
'use client'

import { useState } from 'react'
import { getSubmissionFileSignedUrlAction } from '@/app/(dashboard)/actions/collaboration'
import { Download, Loader2, FileText } from 'lucide-react'

interface FileDownloadButtonProps {
  filePath: string
}

export function FileDownloadButton({ filePath }: FileDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract clean file name from path: {taskId}/{userId}/{timestamp}_{cleanName}
  const rawFileName = filePath.split('/').pop() || 'attachment'
  const displayName = rawFileName.replace(/^\d+_/, '')

  async function handleDownload() {
    setLoading(true)
    setError(null)

    const result = await getSubmissionFileSignedUrlAction(filePath)

    if (result.error || !result.data) {
      setError(result.error || 'Failed to generate download link')
      setLoading(false)
      return
    }

    // Open signed download link
    const win = window.open(result.data.url, '_blank')
    if (!win) {
      window.location.href = result.data.url
    }

    setLoading(false)
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--surface-3)',
          border: '1px solid var(--border-default)',
          color: 'var(--color-accent)',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          textDecoration: 'none',
        }}
        className="hover:border-[var(--color-accent)] transition-colors"
        title={`Download ${displayName}`}
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <FileText size={13} />
        )}
        <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
        <Download size={11} color="var(--text-muted)" />
      </button>

      {error && (
        <span style={{ fontSize: '11px', color: 'var(--color-orange)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
