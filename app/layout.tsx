// app/layout.tsx — Root layout with Inter font (Nohemi self-hosted per spec)
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | NexGenU Dashboard',
    default: 'NexGenU Workforce Dashboard',
  },
  description: 'Internal task-assignment and execution-tracking system for NexGenU leadership and pillar heads',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
