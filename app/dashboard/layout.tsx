import { createClient, getUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import type { Profile } from '@/lib/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const avatarUrl =
    (profile as Profile | null)?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null

  const fullName =
    (profile as Profile | null)?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    null

  return (
    <DashboardShell
      userId={user.id}
      userEmail={user.email ?? ''}
      avatarUrl={avatarUrl}
      fullName={fullName}
    >
      {children}
    </DashboardShell>
  )
}
