'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import type { Collection, UrlMeta } from '@/lib/types'

type AddBookmarkDialogProps = {
  collections: Collection[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAdd: (data: {
    url: string
    title: string
    description: string
    collection_id: string | null
    tags: string[]
    favicon_url: string | null
    og_image: string | null
  }) => Promise<void>
}

export function AddBookmarkDialog({ collections, open: controlledOpen, onOpenChange, onAdd }: AddBookmarkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [collectionId, setCollectionId] = useState<string>('')
  const [tags, setTags] = useState('')
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [ogImage, setOgImage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isFetching, setIsFetching] = useState(false)

  const handleFetchMeta = async () => {
    if (!url) return

    setIsFetching(true)
    try {
      const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(url)}`)
      const data: UrlMeta = await res.json()

      if (data.title) setTitle(data.title)
      if (data.description) setDescription(data.description)
      setFaviconUrl(data.favicon_url)
      setOgImage(data.og_image)
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const reset = () => {
    setUrl('')
    setTitle('')
    setDescription('')
    setCollectionId('')
    setTags('')
    setFaviconUrl(null)
    setOgImage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      await onAdd({
        url,
        title,
        description,
        collection_id: collectionId || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        favicon_url: faviconUrl,
        og_image: ogImage,
      })

      setOpen(false)
      reset()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-[525px] bg-[#1a1a1a] border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-[#e5e5e5]">Add Bookmark</DialogTitle>
          <DialogDescription className="text-[#737373]">
            Save a new URL to your bookmark collection
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url" className="text-[#e5e5e5]">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="flex-1 bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5]"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleFetchMeta}
                  disabled={!url || isFetching}
                  className="bg-[#2a2a2a] text-[#e5e5e5] hover:bg-[#3a3a3a]"
                >
                  {isFetching ? 'Fetching...' : 'Fetch'}
                </Button>
              </div>
            </div>

            {/* Preview thumbnail + favicon after fetch */}
            {(ogImage || faviconUrl) && (
              <div className="relative overflow-hidden border border-[#2a2a2a] h-36 bg-[#0f0f0f] flex items-center justify-center">
                {ogImage ? (
                  <Image
                    src={ogImage}
                    alt="Site thumbnail"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[#606060] text-xs">No thumbnail</span>
                )}
                {faviconUrl && (
                  <div className="absolute bottom-2 left-2 w-8 h-8 bg-[#1a1a1a]/80 backdrop-blur p-1 flex items-center justify-center">
                    <Image
                      src={faviconUrl}
                      alt="Site favicon"
                      width={24}
                      height={24}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="title" className="text-[#e5e5e5]">Title</Label>
              <Input
                id="title"
                placeholder="Bookmark title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-[#e5e5e5]">Description</Label>
              <Input
                id="description"
                placeholder="Brief description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="collection" className="text-[#e5e5e5]">Collection</Label>
              <select
                id="collection"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="flex h-10 w-full border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2 text-sm text-[#e5e5e5] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a3a] focus-visible:ring-offset-2"
              >
                <option value="">None</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags" className="text-[#e5e5e5]">Tags</Label>
              <Input
                id="tags"
                placeholder="design, inspiration, reference (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5] hover:bg-[#1a1a1a]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !url}
              className="bg-[#3a5ff5] hover:bg-[#2d4cd1] text-white"
            >
              {isPending ? 'Saving...' : 'Save Bookmark'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
