'use client'

import { useMemo, useState } from 'react'
import { BookmarkGrid } from '@/components/bookmarks/BookmarkGrid'
import { AddBookmarkDialog } from '@/components/bookmarks/AddBookmarkDialog'
import { Header } from '@/components/layout/Header'
import {
  useBookmarks,
  useCollections,
  useFolders,
  useAddBookmark,
  useDeleteBookmark,
  useInvalidateCollections,
  useInvalidateFolders,
  useToggleCollectionPublic,
} from '@/lib/queries'
import type { Collection } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Link } from 'lucide-react'
import { toast } from 'sonner'

type BookmarkPageClientProps = {
  userId: string
  collection: Collection
}

export function BookmarkPageClient({ userId, collection }: BookmarkPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { data: bookmarks = [], isLoading: bookmarksLoading } = useBookmarks(userId, collection.id)
  const { data: collections = [] } = useCollections(userId)
  const { data: folders = [] } = useFolders(userId)

  const invalidateCollections = useInvalidateCollections()
  const invalidateFolders = useInvalidateFolders()
  const addBookmark = useAddBookmark()
  const deleteBookmark = useDeleteBookmark()

  const activeCollection = useMemo(
    () => collections.find((c) => c.id === collection.id) ?? collection,
    [collections, collection],
  )

  const activeFolder = useMemo(() => {
    const folderId = activeCollection.folder_id
    if (!folderId) return null
    return folders.find((f) => f.id === folderId) ?? null
  }, [activeCollection.folder_id, folders])

  const [optimisticIsPublic, setOptimisticIsPublic] = useState(activeCollection.is_public)

  const toggleCollectionPublic = useToggleCollectionPublic(userId)
  const effectiveIsPublic = toggleCollectionPublic.isPending
    ? optimisticIsPublic
    : activeCollection.is_public

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery) return bookmarks
    const query = searchQuery.toLowerCase()
    return bookmarks.filter((bookmark) => {
      const titleMatch = bookmark.title?.toLowerCase().includes(query)
      const urlMatch = bookmark.url.toLowerCase().includes(query)
      const descMatch = bookmark.description?.toLowerCase().includes(query)
      return titleMatch || urlMatch || descMatch
    })
  }, [bookmarks, searchQuery])

  const handleAddBookmark = async (data: {
    url: string
    title: string
    description: string
    collection_id: string | null
    favicon_url: string | null
  }) => {
    await addBookmark.mutateAsync(
      {
        userId,
        url: data.url,
        title: data.title || null,
        description: data.description || null,
        collection_id: data.collection_id,
        favicon_url: data.favicon_url,
      },
      {
        onSuccess: () => toast.success('Bookmark added successfully'),
        onError: () => toast.error('Failed to add bookmark'),
      }
    )
    setShowAddDialog(false)
  }

  const handleDeleteBookmark = async (id: string) => {
    await deleteBookmark.mutateAsync(
      { id, userId },
      {
        onSuccess: () => toast.success('Bookmark deleted'),
        onError: () => toast.error('Failed to delete bookmark'),
      }
    )
  }

  const handleTogglePublic = (checked: boolean) => {
    const prev = activeCollection.is_public
    setOptimisticIsPublic(checked)

    toggleCollectionPublic
      .mutateAsync({
        collectionId: collection.id,
        makePublic: checked,
        currentSlug: activeCollection.slug,
      })
      .catch(() => {
        setOptimisticIsPublic(prev)
        toast.error('Failed to update collection visibility')
      })
  }

  const handleCopyShareLink = async () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const slug = activeCollection.slug
    if (!appUrl) {
      toast.error('App URL is not configured')
      return
    }
    if (!slug) {
      toast.error('Share link is not available for this collection')
      return
    }

    const shareUrl = `${appUrl}/share/${encodeURIComponent(slug)}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const breadcrumbs: Array<{ label: string; href?: string }> = [
    ...(activeFolder ? [{ label: activeFolder.name.toUpperCase() }] : []),
    { label: activeCollection.name.toUpperCase() },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={breadcrumbs}
        onSearch={setSearchQuery}
        onNewClick={() => setShowAddDialog(true)}
      />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#e5e5e5] tracking-tight mb-1">
                {collection.name.toUpperCase()}
              </h1>
              <p className="text-sm text-[#606060]">
                {collection.description || `All bookmarks in ${collection.name}`}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 h-8">
              <Switch
                aria-label="Make collection public"
                checked={effectiveIsPublic}
                onCheckedChange={handleTogglePublic}
                disabled={toggleCollectionPublic.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCopyShareLink}
                disabled={!effectiveIsPublic || toggleCollectionPublic.isPending}
                className="h-8 w-8 text-[#a0a0a0] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]"
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <BookmarkGrid
          bookmarks={filteredBookmarks}
          collections={collections}
          isLoading={bookmarksLoading}
          onDelete={handleDeleteBookmark}
        />
      </div>

      <AddBookmarkDialog
        folders={folders}
        collections={collections}
        onAdd={handleAddBookmark}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onRefresh={() => {
          invalidateCollections(userId)
          invalidateFolders(userId)
        }}
      />
    </div>
  )
}
