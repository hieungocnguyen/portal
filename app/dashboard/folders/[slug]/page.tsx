import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BookmarkPageClient } from '@/components/bookmarks/BookmarkPageClient'
import type { Bookmark, Collection, Folder } from '@/lib/types'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function FolderPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: folder, error: folderError } = await supabase
    .from('folders')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single()

  if (folderError || !folder) {
    notFound()
  }

  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .eq('folder_id', folder.id)
    .order('created_at', { ascending: false })

  const collectionIds = collections?.map((c) => c.id) || []

  let bookmarks: Bookmark[] = []
  if (collectionIds.length > 0) {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .in('collection_id', collectionIds)
      .order('created_at', { ascending: false })

    bookmarks = (data as Bookmark[]) || []
  }

  const { data: allCollections } = await supabase
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
      title={folder.name.toUpperCase()}
      subtitle={`All bookmarks in ${folder.name}`}
      breadcrumbs={[
        { label: folder.name.toUpperCase() },
      ]}
      initialBookmarks={bookmarks}
      collections={(allCollections as Collection[]) || []}
      folders={(folders as Folder[]) || []}
    />
  )
}
