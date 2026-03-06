'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

type CreateCollectionDialogProps = {
  folderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCollectionDialog({
  folderId,
  open,
  onOpenChange,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in')
        return
      }

      const { error } = await supabase.from('collections').insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        folder_id: folderId,
      })

      if (error) {
        toast.error('Failed to create collection')
        return
      }

      toast.success('Collection created')
      setName('')
      setDescription('')
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#1a1a1a] border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-[#e5e5e5]">New Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="collection-name" className="text-[#a0a0a0] text-xs uppercase tracking-wider">
                Name
              </Label>
              <Input
                id="collection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection name"
                autoFocus
                className="bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5] placeholder:text-[#505050]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="collection-desc" className="text-[#a0a0a0] text-xs uppercase tracking-wider">
                Description <span className="text-[#505050]">(optional)</span>
              </Label>
              <Input
                id="collection-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                className="bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5] placeholder:text-[#505050]"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[#a0a0a0] hover:text-[#e5e5e5] hover:bg-[#2a2a2a]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isPending}
              className="bg-[#e5e5e5] text-[#0f0f0f] hover:bg-[#d0d0d0] disabled:opacity-40"
            >
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
