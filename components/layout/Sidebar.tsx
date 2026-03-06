'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  FolderIcon,
  FolderOpen,
  PlusIcon,
  Settings,
  LogOutIcon,
  UserIcon,
  BookmarkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import type { Collection } from '@/lib/types'

type SidebarProps = {
  collections: Collection[]
  tagsByCollection?: Record<string, string[]>
  userEmail: string
  avatarUrl?: string | null
  fullName?: string | null
}

export function Sidebar({
  collections,
  tagsByCollection = {},
  userEmail,
  avatarUrl,
  fullName,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const activeCollectionId = pathname.startsWith('/dashboard/collections/')
    ? pathname.split('/')[3]
    : null
  const activeTag = searchParams.get('tag')

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    if (activeCollectionId) initial.add(activeCollectionId)
    else if (collections[0]) initial.add(collections[0].id)
    return initial
  })

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const displayName = fullName || userEmail.split('@')[0]
  const roleLabel = userEmail.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 12) || 'MEMBER'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <aside className="flex w-64 flex-col h-full bg-[#0f0f0f] border-r border-[#1a1a1a]">
      {/* User profile - top section */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1a1a1a]">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 rounded-none border border-[#2a2a2a]">
            {avatarUrl && (
              <AvatarImage src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-[#1a1a1a] text-[#a0a0a0] text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#e5e5e5] truncate">
            {displayName.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}
          </p>
          <p className="text-xs text-[#737373] truncate">{roleLabel}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-[#a0a0a0] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-[#1a1a1a] border-[#2a2a2a]"
            align="end"
            side="bottom"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-[#e5e5e5]">{displayName}</p>
                <p className="text-xs text-[#737373]">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#2a2a2a]" />
            <DropdownMenuItem className="text-[#e5e5e5] focus:bg-[#2a2a2a] focus:text-[#e5e5e5]">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2a2a2a]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[#e5e5e5] focus:bg-[#2a2a2a] focus:text-[#e5e5e5]"
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* All Bookmarks link */}
      <div className="px-4 py-4">
        <Link href="/dashboard">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
              pathname === '/dashboard'
                ? 'bg-[#1e3a5f]/50 text-[#60a5fa]'
                : 'text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-[#e5e5e5]'
            )}
          >
            <BookmarkIcon className="h-4 w-4 shrink-0" />
            <span>All Bookmarks</span>
          </div>
        </Link>
      </div>

      {/* System Folders section */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#737373]">
            Folders
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#a0a0a0] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-0.5">
          {collections.map((collection) => {
            const collectionPath = `/dashboard/collections/${collection.id}`
            const isExpanded = expandedIds.has(collection.id)
            const isCollectionActive = pathname === collectionPath && !activeTag
            const tags = tagsByCollection[collection.id] || []

            return (
              <div key={collection.id}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => toggleExpand(collection.id)}
                    className="shrink-0 p-0.5 -ml-0.5 text-[#737373] hover:text-[#a0a0a0]"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <Link href={collectionPath} className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'flex items-center gap-2 px-2 py-2 text-sm transition-colors',
                        isCollectionActive
                          ? 'bg-[#1e3a5f]/60 text-[#60a5fa]'
                          : 'text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-[#e5e5e5]'
                      )}
                    >
                      {isExpanded ? (
                        <FolderOpen className="h-4 w-4 shrink-0" />
                      ) : (
                        <FolderIcon className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{collection.name}</span>
                    </div>
                  </Link>
                </div>
                {isExpanded && (
                  <div className="ml-6 space-y-0.5 border-l border-[#2a2a2a] pl-2 py-1">
                    <Link href={collectionPath}>
                      <div
                        className={cn(
                          'px-2 py-1.5 text-sm transition-colors',
                          isCollectionActive && !activeTag
                            ? 'border-l-2 border-[#60a5fa] bg-[#1a1a1a] pl-[10px] text-[#e5e5e5] -ml-[2px]'
                            : 'text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-[#e5e5e5]'
                        )}
                      >
                        All
                      </div>
                    </Link>
                    {tags.slice(0, 5).map((tag) => {
                      const tagPath = `${collectionPath}?tag=${encodeURIComponent(tag)}`
                      const isTagActive = activeCollectionId === collection.id && activeTag === tag
                      return (
                        <Link key={tag} href={tagPath}>
                          <div
                            className={cn(
                              'px-2 py-1.5 text-sm transition-colors',
                              isTagActive
                                ? 'border-l-2 border-[#60a5fa] bg-[#1a1a1a] pl-[10px] text-[#e5e5e5] -ml-[2px]'
                                : 'text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-[#e5e5e5]'
                            )}
                          >
                            {tag}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
