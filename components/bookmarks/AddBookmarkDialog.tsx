'use client'

import { useState, useTransition, useMemo } from 'react'
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
import { Plus, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { CreateFolderDialog } from '@/components/folders/CreateFolderDialog'
import { CreateCollectionDialog } from '@/components/collections/CreateCollectionDialog'
import type { Collection, Folder, UrlMeta } from '@/lib/types'

type AddBookmarkDialogProps = {
  folders: Folder[]
  collections: Collection[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAdd: (data: {
    url: string
    title: string
    description: string
    collection_id: string | null
    favicon_url: string | null
  }) => Promise<void>
  onRefresh?: () => void
}

export function AddBookmarkDialog({
  folders,
  collections,
  open: controlledOpen,
  onOpenChange,
  onAdd,
  onRefresh,
}: AddBookmarkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [folderId, setFolderId] = useState<string>('')
  const [collectionId, setCollectionId] = useState<string>('')
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isFetching, setIsFetching] = useState(false)
  const [metaFetched, setMetaFetched] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const supabase = createClient()

  const filteredCollections = useMemo(() => {
    if (!folderId) return []
    return collections.filter((c) => c.folder_id === folderId)
  }, [folderId, collections])

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleFetchMeta = async () => {
    if (!url || !isValidUrl(url)) return

    setIsFetching(true)
    try {
      const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(url)}`)
      const data: UrlMeta = await res.json()

      setTitle(data.title ?? '')
      setDescription(data.description ?? '')
      setFaviconUrl(data.favicon_url)
      setMetaFetched(true)
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
    setFolderId('')
    setCollectionId('')
    setFaviconUrl(null)
    setMetaFetched(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      let finalCollectionId = collectionId

      // If no collection selected, create/use "Others" collection
      if (!collectionId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        let targetFolderId = folderId

        // If no folder selected either, create/use "Others" folder
        if (!targetFolderId) {
          let { data: othersFolder } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.id)
            .eq('name', 'Others')
            .single()

          // Create it if it doesn't exist
          if (!othersFolder) {
            const { data: newFolder, error: folderError } = await supabase
              .from('folders')
              .insert({ user_id: user.id, name: 'Others' })
              .select()
              .single()

            if (folderError) {
              console.error('Failed to create Others folder:', folderError)
              return
            }
            othersFolder = newFolder
          }

          targetFolderId = othersFolder.id
        }

        // Now check if "Others" collection exists in the target folder
        let { data: othersCollection } = await supabase
          .from('collections')
          .select('*')
          .eq('user_id', user.id)
          .eq('folder_id', targetFolderId)
          .eq('name', 'Others')
          .single()

        // Create Others collection if it doesn't exist
        if (!othersCollection) {
          const { data: newCollection, error: collectionError } = await supabase
            .from('collections')
            .insert({
              user_id: user.id,
              name: 'Others',
              folder_id: targetFolderId,
            })
            .select()
            .single()

          if (collectionError) {
            console.error('Failed to create Others collection:', collectionError)
            return
          }
          othersCollection = newCollection
        }

        finalCollectionId = othersCollection.id
      }

      await onAdd({
        url,
        title,
        description,
        collection_id: finalCollectionId || null,
        favicon_url: faviconUrl,
      })

      setOpen(false)
      reset()
    })
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) reset()
        }}
      >
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
                <Label htmlFor="url" className="text-[#e5e5e5]">
                  URL
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setMetaFetched(false)
                      }}
                      required
                      className="bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5] pr-3"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={!isValidUrl(url) || isFetching}
                    onClick={handleFetchMeta}
                    title="Fetch page info"
                    className="shrink-0 bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5] hover:bg-[#1a1a1a] hover:text-[#3a5ff5] disabled:opacity-40"
                  >
                    <RefreshCw
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isFetching && 'animate-spin'
                      )}
                      style={{ animationDirection: 'normal' }}
                    />
                  </Button>
                </div>
              </div>

              {metaFetched && (
                <>
                  <div className="grid gap-2">
                    <Label className="text-[#e5e5e5]">Icon</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#0f0f0f]">
                        {faviconUrl ? (
                          <img
                            src={faviconUrl}
                            alt=""
                            className="h-5 w-5 rounded-sm object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="h-5 w-5 rounded-sm bg-[#2a2a2a]" />
                        )}
                      </div>
                      <p className="text-xs text-[#737373]">
                        Custom icon upload coming soon
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-[#e5e5e5]">
                      Title
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Page title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5]"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-[#e5e5e5]">
                      Description
                    </Label>
                    <textarea
                      id="description"
                      placeholder="Page description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2 text-sm text-[#e5e5e5] placeholder:text-[#737373] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3a5ff5]"
                    />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <Label htmlFor="folder" className="text-[#e5e5e5]">
                  Folder
                </Label>
                <div className="flex items-center gap-2">
                  <select
                    id="folder"
                    value={folderId}
                    onChange={(e) => {
                      setFolderId(e.target.value)
                      setCollectionId('')
                    }}
                    className="flex-1 h-10 w-full border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2 text-sm text-[#e5e5e5] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a3a] focus-visible:ring-offset-2"
                  >
                    <option value="">None (auto → Others folder)</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setShowCreateFolder(true)}
                    className="shrink-0 bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5] hover:bg-[#1a1a1a] hover:text-[#3a5ff5]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="collection" className="text-[#e5e5e5]">
                  Collection
                </Label>
                <div className="flex items-center gap-2">
                  <select
                    id="collection"
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    disabled={!folderId}
                    className="flex-1 h-10 w-full border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2 text-sm text-[#e5e5e5] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a3a] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {folderId ? 'Select collection' : 'Select folder first'}
                    </option>
                    {filteredCollections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setShowCreateCollection(true)}
                    disabled={!folderId}
                    className="shrink-0 bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5] hover:bg-[#1a1a1a] hover:text-[#3a5ff5] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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

      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={(open) => {
          setShowCreateFolder(open)
          if (!open && onRefresh) onRefresh()
        }}
        onCreated={(folder) => {
          setFolderId(folder.id)
          setCollectionId('')
          onRefresh?.()
        }}
      />

      <CreateCollectionDialog
        folderId={folderId}
        open={showCreateCollection}
        onOpenChange={(open) => {
          setShowCreateCollection(open)
          if (!open && onRefresh) onRefresh()
        }}
        onCreated={(collection) => {
          setCollectionId(collection.id)
          onRefresh?.()
        }}
      />
    </>
  )
}
