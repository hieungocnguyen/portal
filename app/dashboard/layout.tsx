import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Collection, Profile } from '@/lib/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const [{ data: collections }, { data: profile }, { data: bookmarks }] =
    await Promise.all([
      supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('bookmarks')
        .select('collection_id, tags')
        .eq('user_id', user.id),
    ])

  // Build tags per collection for nested sidebar items
  const tagsByCollection: Record<string, string[]> = {}
  for (const c of (collections as Collection[]) || []) {
    tagsByCollection[c.id] = []
  }
  for (const b of (bookmarks as { collection_id: string | null; tags: string[] }[]) || []) {
    if (b.collection_id && b.tags?.length) {
      const existing = tagsByCollection[b.collection_id] || []
      const merged = [...new Set([...existing, ...b.tags])]
      tagsByCollection[b.collection_id] = merged.slice(0, 5)
    }
  }

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
    <div className="flex h-screen overflow-hidden bg-[#0f0f0f]">
      <Sidebar
        collections={(collections as Collection[]) || []}
        tagsByCollection={tagsByCollection}
        userEmail={user.email || ''}
        avatarUrl={avatarUrl}
        fullName={fullName}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
