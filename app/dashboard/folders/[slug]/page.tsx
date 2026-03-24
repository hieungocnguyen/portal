import { createClient, getUser } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { FolderPageClient } from '@/components/bookmarks/FolderPageClient'
import type { Folder } from '@/lib/types'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function FolderPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const supabase = await createClient()
  const { data: folder, error } = await supabase
    .from('folders')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single()

  if (error || !folder) {
    notFound()
  }

  return <FolderPageClient userId={user.id} folder={folder as Folder} />
}
