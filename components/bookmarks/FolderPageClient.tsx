'use client'

import { useState, useMemo } from 'react'
import { BookmarkGrid } from '@/components/bookmarks/BookmarkGrid'
import { AddBookmarkDialog } from '@/components/bookmarks/AddBookmarkDialog'
import { Header } from '@/components/layout/Header'
import {
  useCollections,
  useFolders,
  useBookmarksByCollectionIds,
  useAddBookmark,
  useDeleteBookmark,
  useInvalidateCollections,
  useInvalidateFolders,
} from '@/lib/queries'
import type { Folder } from '@/lib/types'
import { toast } from 'sonner'

type FolderPageClientProps = {
  userId: string
  folder: Folder
}

export function FolderPageClient({ userId, folder }: FolderPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { data: allCollections = [] } = useCollections(userId)
  const { data: folders = [] } = useFolders(userId)

  const folderCollectionIds = useMemo(
    () => allCollections.filter((c) => c.folder_id === folder.id).map((c) => c.id),
    [allCollections, folder.id]
  )

  const { data: bookmarks = [], isLoading: bookmarksLoading } =
    useBookmarksByCollectionIds(userId, folderCollectionIds)

  const invalidateCollections = useInvalidateCollections()
  const invalidateFolders = useInvalidateFolders()
  const addBookmark = useAddBookmark()
  const deleteBookmark = useDeleteBookmark()

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

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[{ label: folder.name.toUpperCase() }]}
        onSearch={setSearchQuery}
        onNewClick={() => setShowAddDialog(true)}
      />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#e5e5e5] tracking-tight mb-1">
              {folder.name.toUpperCase()}
            </h1>
            <p className="text-sm text-[#606060]">All bookmarks in {folder.name}</p>
          </div>
          <div className="text-sm text-[#606060] font-medium mt-1">
            {bookmarksLoading ? '..._ITEMS' : `${filteredBookmarks.length}_ITEMS`}
          </div>
        </div>

        <BookmarkGrid
          bookmarks={filteredBookmarks}
          collections={allCollections}
          isLoading={bookmarksLoading}
          onDelete={handleDeleteBookmark}
        />
      </div>

      <AddBookmarkDialog
        folders={folders}
        collections={allCollections}
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
