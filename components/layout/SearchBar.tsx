'use client'

import { useState, useTransition } from 'react'
import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'

type SearchBarProps = {
  onSearch?: (query: string) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    if (onSearch) {
      startTransition(() => {
        onSearch(value)
      })
    }
  }

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#606060]" />
      <Input
        type="search"
        placeholder="SEARCH..."
        value={query}
        onChange={handleChange}
        className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-[#e5e5e5] placeholder:text-[#606060] focus-visible:ring-[#3a3a3a]"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin border-2 border-[#60a5fa] border-t-transparent" />
        </div>
      )}
    </div>
  )
}
