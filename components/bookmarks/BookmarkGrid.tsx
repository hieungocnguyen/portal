'use client'

import type { Bookmark, Collection } from '@/lib/types'
import { BookmarkCard } from './BookmarkCard'

type BookmarkGridProps = {
  bookmarks: Bookmark[]
  collections: Collection[]
  onDelete?: (id: string) => void
  onEdit?: (bookmark: Bookmark) => void
}

export function BookmarkGrid({ bookmarks, collections, onDelete, onEdit }: BookmarkGridProps) {
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
        const collection = collections.find((c) => c.id === bookmark.collection_id)
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
