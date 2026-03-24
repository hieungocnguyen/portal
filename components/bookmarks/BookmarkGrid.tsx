'use client'

import { useMemo } from 'react'
import type { Bookmark, Collection } from '@/lib/types'
import { BookmarkCard } from './BookmarkCard'

type BookmarkGridProps = {
  bookmarks: Bookmark[]
  collections: Collection[]
  isLoading?: boolean
  onDelete?: (id: string) => void
  onEdit?: (bookmark: Bookmark) => void
}

function BookmarkSkeleton() {
  return (
    <div className="flex flex-col bg-[#1a1a1a] border border-[#2a2a2a] animate-pulse">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <div className="h-4 w-4 rounded bg-[#2a2a2a] shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-[#2a2a2a]" />
            <div className="h-3 w-1/2 rounded bg-[#2a2a2a]" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-[#2a2a2a]" />
        <div className="h-3 w-2/3 rounded bg-[#2a2a2a]" />
        <div className="border-t border-[#2a2a2a] pt-3 flex justify-between">
          <div className="h-2 w-1/3 rounded bg-[#2a2a2a]" />
          <div className="h-4 w-4 rounded bg-[#2a2a2a]" />
        </div>
      </div>
    </div>
  )
}

export function BookmarkGrid({
  bookmarks,
  collections,
  isLoading,
  onDelete,
  onEdit,
}: BookmarkGridProps) {
  const collectionById = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection])),
    [collections]
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <BookmarkSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-6xl mb-4">🔖</div>
        <h3 className="text-lg font-medium text-foreground mb-2">No bookmarks yet</h3>
        <p className="text-sm text-muted-foreground">
          Click the &quot;+ New&quot; button to add your first bookmark
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {bookmarks.map((bookmark) => {
        const collection = bookmark.collection_id
          ? collectionById.get(bookmark.collection_id)
          : undefined
        return (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            collection={collection}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )
      })}
    </div>
  )
}
