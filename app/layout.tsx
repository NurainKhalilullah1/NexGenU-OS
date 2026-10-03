// app/layout.tsx — Root layout with Sora font
import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
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
    <html lang="en" className={`${sora.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
