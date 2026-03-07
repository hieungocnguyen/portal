'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BookmarkGrid } from '@/components/bookmarks/BookmarkGrid'
import { AddBookmarkDialog } from '@/components/bookmarks/AddBookmarkDialog'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/utils/supabase/client'
import type { Bookmark, Collection, Folder } from '@/lib/types'
import { toast } from 'sonner'

type Breadcrumb = {
  label: string
  href?: string
}

type BookmarkPageClientProps = {
  title: string
  subtitle: string
  breadcrumbs: Breadcrumb[]
  initialBookmarks: Bookmark[]
  collections: Collection[]
  folders: Folder[]
  activeTag?: string
}

export function BookmarkPageClient({
  title,
  subtitle,
  breadcrumbs,
  initialBookmarks,
  collections,
  folders,
  activeTag,
}: BookmarkPageClientProps) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks

    if (activeTag) {
      filtered = filtered.filter((b) => b.tags.includes(activeTag))
    }

    if (!searchQuery) return filtered

    const query = searchQuery.toLowerCase()
    return filtered.filter((bookmark) => {
      const titleMatch = bookmark.title?.toLowerCase().includes(query)
      const urlMatch = bookmark.url.toLowerCase().includes(query)
      const descMatch = bookmark.description?.toLowerCase().includes(query)
      const tagMatch = bookmark.tags.some((tag) => tag.toLowerCase().includes(query))
      return titleMatch || urlMatch || descMatch || tagMatch
    })
  }, [bookmarks, searchQuery, activeTag])

  const handleAddBookmark = async (data: {
    url: string
    title: string
    description: string
    collection_id: string | null
    tags: string[]
    favicon_url: string | null
    og_image: string | null
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error('You must be logged in to add bookmarks')
      return
    }

    const { data: newBookmark, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        url: data.url,
        title: data.title || null,
        description: data.description || null,
        collection_id: data.collection_id,
        tags: data.tags,
        favicon_url: data.favicon_url,
        og_image: data.og_image,
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to add bookmark')
      console.error(error)
      return
    }

    setBookmarks([newBookmark as Bookmark, ...bookmarks])
    toast.success('Bookmark added successfully')
    router.refresh()
  }

  const handleDeleteBookmark = async (id: string) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete bookmark')
      console.error(error)
      return
    }

    setBookmarks(bookmarks.filter((b) => b.id !== id))
    toast.success('Bookmark deleted')
    router.refresh()
  }

  const handleEditBookmark = (_bookmark: Bookmark) => {
    toast.info('Edit functionality coming soon')
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={breadcrumbs}
        onSearch={setSearchQuery}
        onNewClick={() => setShowAddDialog(true)}
      />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#e5e5e5] tracking-tight mb-1">
              {title}
            </h1>
            <p className="text-sm text-[#606060]">{subtitle}</p>
          </div>
          <div className="">
            <div className="text-sm text-[#606060] font-medium mt-1">
              {filteredBookmarks.length}_ITEMS
            </div>
          </div>
        </div>

        <BookmarkGrid
          bookmarks={filteredBookmarks}
          collections={collections}
          onDelete={handleDeleteBookmark}
          onEdit={handleEditBookmark}
        />
      </div>

      <AddBookmarkDialog
        folders={folders}
        collections={collections}
        onAdd={handleAddBookmark}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onRefresh={() => router.refresh()}
      />
    </div>
  )
}
