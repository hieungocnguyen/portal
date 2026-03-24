import { getUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardPageClient } from '@/components/bookmarks/DashboardPageClient'

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <DashboardPageClient userId={user.id} />
}
