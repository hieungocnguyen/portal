'use client'

import { SearchBar } from '@/components/layout/SearchBar'
import { Button } from '@/components/ui/button'
import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'

type HeaderProps = {
  breadcrumbs?: { label: string; href?: string }[]
  onSearch?: (query: string) => void
  onNewClick?: () => void
}

export function Header({
  breadcrumbs = [],
  onSearch,
  onNewClick
}: HeaderProps) {
  return (
    <header className="px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-[#606060] hover:text-[#a0a0a0] transition-colors uppercase tracking-wide"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#a0a0a0] uppercase tracking-wide font-medium">
                    {crumb.label}
                  </span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRightIcon className="h-3 w-3 text-[#3a3a3a]" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          {/* <div className="flex-1 max-w-md">
            <SearchBar onSearch={onSearch} />
          </div> */}

          {/* NEW button */}
          <Button
            className="h-9 px-5 bg-[#3a5ff5] hover:bg-[#2d4cd1] text-white font-medium text-sm"
            onClick={onNewClick}
          >
            + NEW
          </Button>
        </div>
      </div>
    </header>
  )
}
