// app/(dashboard)/layout.tsx — Shell: sidebar + topbar
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import type { User } from '@/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!profile) redirect('/login')

  const user = profile as User

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--surface-0)',
      }}
    >
      {/* Sidebar — hidden on mobile, visible on desktop (md+) */}
      <div className="dashboard-sidebar-wrapper hidden md:flex h-full shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
        }}
      >
        <TopBar user={user} />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: '80px', /* space for mobile nav */
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile nav — visible only on small screens */}
      <div className="md:hidden">
        <MobileNav user={user} />
      </div>
    </div>
  )
}
