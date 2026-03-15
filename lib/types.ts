export type Folder = {
  id: string
  user_id: string
  name: string
  slug: string
  created_at: string
}

export type Collection = {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  slug: string
  folder_id: string | null
  created_at: string
}

export type Bookmark = {
  id: string
  collection_id: string | null
  user_id: string
  url: string
  title: string | null
  description: string | null
  favicon_url: string | null
  created_at: string
}

export type UrlMeta = {
  title: string | null
  description: string | null
  favicon_url: string | null
}

export type BookmarkWithCollection = Bookmark & {
  collection: Collection | null
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  updated_at: string
}
