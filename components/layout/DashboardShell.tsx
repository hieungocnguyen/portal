'use client'

import { useCollections, useFolders } from '@/lib/queries'
import { Sidebar } from '@/components/layout/Sidebar'

type DashboardShellProps = {
  userId: string
  userEmail: string
  avatarUrl: string | null
  fullName: string | null
  children: React.ReactNode
}

export function DashboardShell({
  userId,
  userEmail,
  avatarUrl,
  fullName,
  children,
}: DashboardShellProps) {
  const { data: collections = [] } = useCollections(userId)
  const { data: folders = [] } = useFolders(userId)

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f0f]">
      <Sidebar
        folders={folders}
        collections={collections}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        fullName={fullName}
      />
      <div className="flex flex-col flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
