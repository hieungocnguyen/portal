'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVerticalIcon, TrashIcon, EditIcon, FolderIcon } from 'lucide-react'
import type { Bookmark, Collection } from '@/lib/types'
import Image from 'next/image'

type BookmarkCardProps = {
  bookmark: Bookmark
  collection?: Collection | null
  onDelete?: (id: string) => void
  onEdit?: (bookmark: Bookmark) => void
}

export function BookmarkCard({ bookmark, collection, onDelete, onEdit }: BookmarkCardProps) {
  const domain = new URL(bookmark.url).hostname.replace('www.', '')

  const categoryColor = collection?.name ? getCategoryColor(collection.name) : 'bg-[#2a2a2a]'
  const categoryLabel = collection?.name.toUpperCase() || 'GENERAL'

  return (
    <div className="group relative bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {/* Thumbnail area */}
        <div className="aspect-video bg-[#0f0f0f] relative flex items-center justify-center overflow-hidden">
          {bookmark.og_image ? (
            <Image
              src={bookmark.og_image}
              alt={bookmark.title || domain}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#3a3a3a]">
              {bookmark.favicon_url && (
                <div className="relative w-16 h-16">
                  <Image
                    src={bookmark.favicon_url}
                    alt={domain}
                    fill
                    className="object-contain opacity-20"
                    unoptimized
                  />
                </div>
              )}
            </div>
          )}

          {/* Category badge - top left */}
          {collection && (
            <div className={`absolute top-0 left-0 px-2 py-1 text-[10px] font-medium tracking-wider ${categoryColor} text-white`}>
              {categoryLabel}
            </div>
          )}

          {/* More menu - top right */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 bg-[#1a1a1a]/90 hover:bg-[#2a2a2a] backdrop-blur-sm group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVerticalIcon className="h-4 w-4 text-[#a0a0a0]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault()
                      onEdit(bookmark)
                    }}
                    className="text-[#e5e5e5] focus:bg-[#2a2a2a]"
                  >
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-[#e5e5e5] focus:bg-[#2a2a2a]">
                  <FolderIcon className="mr-2 h-4 w-4" />
                  Move to...
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      onDelete(bookmark.id)
                    }}
                    className="text-red-400 focus:bg-[#2a2a2a] focus:text-red-400"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </a>

      {/* Content section */}
      <div className="p-4 space-y-3">
        {/* Title with favicon */}
        <div className="flex items-start gap-2">
          {bookmark.favicon_url && (
            <div className="shrink-0 mt-0.5">
              <Image
                src={bookmark.favicon_url}
                alt={domain}
                width={16}
                height={16}
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[#e5e5e5] text-sm line-clamp-2 leading-tight">
              {bookmark.title || bookmark.url}
            </h3>
          </div>
        </div>

        {/* Description */}
        {bookmark.description && (
          <p className="text-xs text-[#737373] line-clamp-2 leading-relaxed">
            {bookmark.description}
          </p>
        )}

        {/* Domain link */}
        <div className="flex items-center gap-1 text-[10px] text-[#606060]">
          <span>{domain}</span>
        </div>

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {bookmark.tags.slice(0, 4).map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-[10px] px-2 py-0.5 bg-[#2a2a2a] text-[#a0a0a0] border-0 hover:bg-[#3a3a3a]"
              >
                {tag}
              </Badge>
            ))}
            {bookmark.tags.length > 4 && (
              <Badge 
                variant="secondary" 
                className="text-[10px] px-2 py-0.5 bg-[#2a2a2a] text-[#a0a0a0] border-0"
              >
                +{bookmark.tags.length - 4}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function getCategoryColor(name: string): string {
  const colors = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-purple-600',
    'bg-orange-600',
    'bg-pink-600',
    'bg-cyan-600',
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}
