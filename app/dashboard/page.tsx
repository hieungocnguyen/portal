import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardPageClient } from '@/components/bookmarks/DashboardPageClient'
import type { Bookmark, Collection, Folder } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <DashboardPageClient
      initialBookmarks={(bookmarks as Bookmark[]) || []}
      collections={(collections as Collection[]) || []}
      folders={(folders as Folder[]) || []}
    />
  )
}
