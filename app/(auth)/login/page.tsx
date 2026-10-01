// app/(auth)/login/page.tsx
import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'
import { Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to the NexGenU Workforce Dashboard',
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-40%',
          right: '-20%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(185,251,194,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(207,193,252,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          animation: 'fadeIn 300ms ease',
        }}
      >
        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Zap size={28} color="var(--surface-0)" />
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            NexGenU
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Workforce Dashboard — Sign in to continue
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
            padding: '32px',
          }}
        >
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
