import { createClient, getUser } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BookmarkPageClient } from '@/components/bookmarks/BookmarkPageClient'
import type { Collection } from '@/lib/types'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const supabase = await createClient()
  const { data: collection, error } = await supabase
    .from('collections')
    .select('id, name, description, slug, is_public, folder_id')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single()

  if (error || !collection) {
    notFound()
  }

  return (
    <BookmarkPageClient
      userId={user.id}
      collection={collection as Collection}
    />
  )
}
