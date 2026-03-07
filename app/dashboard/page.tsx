import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BookmarkPageClient } from '@/components/bookmarks/BookmarkPageClient'
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
    <BookmarkPageClient
      initialBookmarks={(bookmarks as Bookmark[]) || []}
      collections={(collections as Collection[]) || []}
      folders={(folders as Folder[]) || []}
      title="ALL BOOKMARKS"
      subtitle="All your bookmarks in one place."
      breadcrumbs={[{ label: 'ALL BOOKMARKS' }]}
    />
  )
}
