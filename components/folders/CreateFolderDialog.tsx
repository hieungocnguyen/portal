'use client'

import { useState, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { slugify } from '@/lib/utils'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import type { Folder } from '@/lib/types'

type CreateFolderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (folder: Folder) => void
}

export function CreateFolderDialog({ open, onOpenChange, onCreated }: CreateFolderDialogProps) {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()
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

      let slug = slugify(name.trim())
      const { data: existing } = await supabase
        .from('folders')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle()
      if (existing) slug = `${slug}-${nanoid(4)}`

      const { data: newFolder, error } = await supabase
        .from('folders')
        .insert({ user_id: user.id, name: name.trim(), slug })
        .select()
        .single()

      if (error) {
        toast.error('Failed to create folder')
        return
      }

      toast.success('Folder created')
      setName('')
      onOpenChange(false)
      onCreated?.(newFolder)
      queryClient.invalidateQueries({ queryKey: ['folders', user.id] })
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#1a1a1a] border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-[#e5e5e5]">New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="folder-name" className="text-[#a0a0a0] text-xs uppercase tracking-wider">
                Name
              </Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Folder name"
                autoFocus
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
