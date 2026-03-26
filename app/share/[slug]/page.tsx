import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BookmarkGrid } from '@/components/bookmarks/BookmarkGrid'
import { createClient } from '@/utils/supabase/server'
import type { Collection, Bookmark } from '@/lib/types'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('name')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!collection?.name) return { title: 'Portal' }

  return { title: `${collection.name} | Portal` }
}

export default async function ShareCollectionPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id, user_id, name, description, is_public, slug, folder_id, created_at')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (collectionError || !collection) notFound()

  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('collection_id', collection.id)
    .order('created_at', { ascending: false })

  const safeBookmarks = (bookmarks ?? []) as Bookmark[]

  if (bookmarksError) {
    // If bookmarks can't be fetched for some reason, still render the collection.
    // RLS should normally prevent access for private collections, which we already filter above.
  }

  return (
    <div className="px-8 py-10">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#e5e5e5] tracking-tight mb-1">
            {collection.name.toUpperCase()}
          </h1>
          <p className="text-sm text-[#606060]">
            {collection.description || `All bookmarks in ${collection.name}`}
          </p>
        </div>

        {safeBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border border-[#1a1a1a] bg-[#1a1a1a]">
            <div className="text-6xl mb-4">🔖</div>
            <h3 className="text-lg font-medium text-foreground mb-2">No bookmarks yet</h3>
            <p className="text-sm text-muted-foreground">
              This collection has no bookmarks.
            </p>
          </div>
        ) : (
          <BookmarkGrid
            bookmarks={safeBookmarks}
            collections={[collection as Collection]}
            isLoading={false}
          />
        )}
      </div>
    </div>
  )
}

