import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import type { Bookmark, Collection, Folder } from '@/lib/types'

export const queryKeys = {
  collections: (userId: string) => ['collections', userId] as const,
  folders: (userId: string) => ['folders', userId] as const,
  bookmarks: (userId: string, collectionId?: string) =>
    collectionId
      ? ['bookmarks', userId, collectionId]
      : ['bookmarks', userId, 'all'],
  bookmarksByFolder: (userId: string, folderCollectionIds: string[]) =>
    ['bookmarks', userId, 'folder', ...folderCollectionIds] as const,
}

export function useCollections(userId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.collections(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as Collection[]) ?? []
    },
    staleTime: 60_000,
  })
}

export function useFolders(userId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.folders(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data as Folder[]) ?? []
    },
    staleTime: 60_000,
  })
}

export function useBookmarks(userId: string, collectionId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.bookmarks(userId, collectionId),
    queryFn: async () => {
      let query = supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (collectionId) {
        query = query.eq('collection_id', collectionId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as Bookmark[]) ?? []
    },
    staleTime: 30_000,
  })
}

export function useBookmarksByCollectionIds(
  userId: string,
  collectionIds: string[]
) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.bookmarksByFolder(userId, collectionIds),
    queryFn: async () => {
      if (collectionIds.length === 0) return [] as Bookmark[]
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .in('collection_id', collectionIds)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as Bookmark[]) ?? []
    },
    enabled: collectionIds.length > 0,
    staleTime: 30_000,
  })
}

type AddBookmarkInput = {
  userId: string
  url: string
  title: string | null
  description: string | null
  collection_id: string | null
  favicon_url: string | null
}

export function useAddBookmark() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddBookmarkInput) => {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: input.userId,
          url: input.url,
          title: input.title,
          description: input.description,
          collection_id: input.collection_id,
          favicon_url: input.favicon_url,
        })
        .select()
        .single()
      if (error) throw error
      return data as Bookmark
    },
    onSuccess: (newBookmark) => {
      queryClient.invalidateQueries({
        queryKey: ['bookmarks', newBookmark.user_id],
      })
    },
  })
}

export function useDeleteBookmark() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      userId,
    }: {
      id: string
      userId: string
    }) => {
      const { error } = await supabase.from('bookmarks').delete().eq('id', id)
      if (error) throw error
      return { id, userId }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] })
    },
  })
}

export function useInvalidateCollections() {
  const queryClient = useQueryClient()
  return (userId: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.collections(userId) })
}

export function useInvalidateFolders() {
  const queryClient = useQueryClient()
  return (userId: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.folders(userId) })
}
