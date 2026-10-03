// app/(auth)/login/LoginForm.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

type Mode = 'password' | 'magic-link'

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      if (mode === 'password') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)

        toast.success('Signed in successfully!')
        router.push('/')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/` },
        })
        if (error) throw new Error(error.message)
        toast.info('Magic link sent to your email.')
        setMagicSent(true)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (magicSent) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'rgba(185,251,194,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Mail size={22} color="var(--color-accent)" />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Check your email</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          We sent a magic link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
          Click it to sign in.
        </p>
        <button
          onClick={() => { setMagicSent(false); setMode('password') }}
          className="btn btn-ghost btn-sm"
          style={{ marginTop: '16px' }}
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Email */}
      <div>
        <label htmlFor="login-email" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
          Email address
        </label>
        <div style={{ position: 'relative' }}>
          <Mail
            size={16}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@nexgenu.com"
            className="input"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Password (only in password mode) */}
      {mode === 'password' && (
        <div>
          <label htmlFor="login-password" style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="input"
              style={{ paddingLeft: 36, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            background: 'rgba(255,99,0,0.1)',
            border: '1px solid rgba(255,99,0,0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#FF9A50',
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '4px', justifyContent: 'center' }}
        id="login-submit-btn"
      >
        {loading ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
            Signing in…
          </>
        ) : mode === 'password' ? (
          'Sign in'
        ) : (
          'Send magic link'
        )}
      </button>

      {/* Mode toggle */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => { setMode(mode === 'password' ? 'magic-link' : 'password'); setError(null) }}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '12px' }}
        >
          {mode === 'password' ? 'Sign in with magic link instead' : 'Sign in with password instead'}
        </button>
      </div>
    </form>
  )
}
