import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BookmarkPageClient } from '@/components/bookmarks/BookmarkPageClient'
import type { Bookmark, Collection, Folder } from '@/lib/types'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single()

  if (collectionError || !collection) {
    notFound()
  }

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('collection_id', collection.id)
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

  let folder: Folder | null = null
  if (collection.folder_id) {
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('id', collection.folder_id)
      .single()
    folder = data as Folder
  }

  const breadcrumbs: Array<{ label: string; href?: string }> = [];
  if (folder) {
    breadcrumbs.push({
      label: folder.name.toUpperCase(),
      href: folder.slug ? `/dashboard/folders/${folder.slug}` : undefined,
    })
  }
  breadcrumbs.push({ label: collection.name.toUpperCase() })

  return (
    <BookmarkPageClient
      title={collection.name.toUpperCase()}
      subtitle={collection.description || `All bookmarks in ${collection.name}`}
      breadcrumbs={breadcrumbs}
      initialBookmarks={(bookmarks as Bookmark[]) || []}
      collections={(collections as Collection[]) || []}
      folders={(folders as Folder[]) || []}
    />
  )
}
