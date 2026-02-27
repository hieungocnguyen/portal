# BookmarkHub — Agent Build Guide

This document is the single source of truth for AI agents building this project.
Read it fully before writing any code. Follow phases in order. Do not skip ahead.

---

## Project Overview

A bookmark manager web app with a Chrome Extension. Users save, organize, tag, and share bookmarks in collections. Collections can be made public via a unique share URL.

---

## Tech Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Frontend | Next.js (App Router) | 16.x | Server Components by default; Turbopack dev server |
| Runtime | React | 19.x | Use new `use()` hook, async transitions |
| Language | TypeScript | 5.9.x | Strict mode required |
| Backend / DB | Supabase | `@supabase/supabase-js` 2.x, `@supabase/ssr` 0.8.x | Auth + Postgres + Storage |
| Styling | Tailwind CSS | v4.x | CSS-based config — no `tailwind.config.js` |
| Components | shadcn/ui | 3.x | Built for Tailwind v4 |
| Extension | Chrome Extension | Manifest V3 | Targets Chrome and Edge |
| Deployment | Vercel | latest | Deploy via `vercel` CLI |

---

## Repository Structure

```
/
├── AGENTS.md
├── app/
│   ├── layout.tsx               ← root layout, providers
│   ├── page.tsx                 ← landing / marketing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx           ← sidebar + nav
│   │   ├── page.tsx             ← all bookmarks view
│   │   ├── collections/
│   │   │   ├── page.tsx         ← collections list
│   │   │   └── [id]/page.tsx    ← single collection view
│   │   └── import/page.tsx      ← browser bookmark import
│   ├── share/
│   │   └── [slug]/page.tsx      ← public read-only collection
│   └── api/
│       └── fetch-meta/route.ts  ← OG scraper
├── components/
│   ├── ui/                      ← shadcn generated components
│   ├── bookmarks/
│   │   ├── BookmarkCard.tsx
│   │   ├── BookmarkGrid.tsx
│   │   ├── AddBookmarkDialog.tsx
│   │   └── ImportBookmarks.tsx
│   ├── collections/
│   │   ├── CollectionList.tsx
│   │   ├── CollectionCard.tsx
│   │   └── CreateCollectionDialog.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── SearchBar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            ← browser client
│   │   ├── server.ts            ← server client (uses cookies)
│   │   └── middleware.ts
│   ├── types.ts                 ← all shared TypeScript types
│   ├── utils.ts                 ← cn(), slugify(), etc.
│   └── fetch-meta.ts            ← OG fetch helper
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── background.js
├── middleware.ts                 ← Supabase auth middleware
├── .env.local.example
└── package.json
```

---

## Environment Variables

Create `.env.local.example` with these keys (never commit real values):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Schema

Run these SQL migrations in Supabase SQL editor in order.

### 1. Collections

```sql
create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  is_public   boolean not null default false,
  slug        text unique,
  created_at  timestamptz not null default now()
);

alter table public.collections enable row level security;

create policy "Users manage own collections"
  on public.collections for all
  using (auth.uid() = user_id);

create policy "Anyone reads public collections"
  on public.collections for select
  using (is_public = true);
```

### 2. Bookmarks

```sql
create table public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete set null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  url           text not null,
  title         text,
  description   text,
  favicon_url   text,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now()
);

alter table public.bookmarks enable row level security;

create policy "Users manage own bookmarks"
  on public.bookmarks for all
  using (auth.uid() = user_id);

create policy "Anyone reads bookmarks in public collections"
  on public.bookmarks for select
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.is_public = true
    )
  );

create index on public.bookmarks using gin(tags);
create index on public.bookmarks (user_id, created_at desc);
```

---

## TypeScript Types

Define all types in `lib/types.ts`:

```typescript
export type Collection = {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  slug: string | null
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
  tags: string[]
  created_at: string
}

export type UrlMeta = {
  title: string | null
  description: string | null
  favicon_url: string | null
}
```

---

## Supabase Clients

### `lib/supabase/client.ts` — browser

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/server.ts` — server components / route handlers

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### `middleware.ts` — root

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

---

## API Routes

### `app/api/fetch-meta/route.ts`

Scrapes OG tags from a URL. Used when adding a bookmark manually.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()
    const $ = cheerio.load(html)

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      null

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null

    const favicon_url =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      `${new URL(url).origin}/favicon.ico`

    return NextResponse.json({ title, description, favicon_url })
  } catch {
    return NextResponse.json({ title: null, description: null, favicon_url: null })
  }
}
```

---

## Version-Specific Notes

These are breaking changes introduced in the versions above. Agents must follow these patterns — older patterns will cause build errors.

### Tailwind CSS v4 — No Config File

Tailwind v4 is CSS-first. There is **no `tailwind.config.js`**.

**`app/globals.css`:**
```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.7 0.15 250);
  --font-sans: "Inter", sans-serif;
  /* Add custom theme tokens here */
}
```

Do **not** use `@tailwind base`, `@tailwind components`, or `@tailwind utilities` — these are removed in v4.

**`postcss.config.mjs`:**
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### Next.js 15+ — Async Params and Headers

`params`, `searchParams`, `cookies()`, and `headers()` are all **async** and must be awaited.

```typescript
// ✅ Dynamic route — params is a Promise
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ...
}

// ✅ Search params
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
}
```

### React 19 — Server Actions

Use the native `useActionState` (replaces `useFormState`):

```typescript
'use client'
import { useActionState } from 'react'

const [state, action, isPending] = useActionState(serverAction, null)
```

Use `isPending` from `useActionState` or `useTransition` for loading states instead of manual `useState`.

### shadcn/ui v3 — Updated Install

```bash
npx shadcn@latest add button card dialog input label badge separator avatar dropdown-menu sheet tabs sonner skeleton
```

Note: `toast` is now `sonner` in shadcn v3. Use `import { toast } from 'sonner'` for notifications.

---

## Build Phases

Complete each phase fully before starting the next.

### Phase 1 — Core Web App

**Goal:** Authenticated users can manage bookmarks and collections.

#### Steps

1. **Bootstrap**
   - `npx create-next-app@latest . --typescript --tailwind --app --eslint --turbopack`
   - This installs Next.js 16, React 19, and Tailwind CSS v4
   - `npx shadcn@latest init` — detects Tailwind v4 automatically
   - Install deps: `@supabase/ssr @supabase/supabase-js cheerio nanoid`
   - Create `.env.local` from `.env.local.example`

2. **Supabase setup**
   - Run DB schema SQL above in Supabase dashboard
   - Create `lib/supabase/client.ts`, `lib/supabase/server.ts`
   - Create `middleware.ts`

3. **Auth pages**
   - `/login` — email/password + "Continue with Google" button
   - `/signup` — email/password form
   - Use `supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.signInWithOAuth`
   - After login redirect to `/dashboard`

4. **Dashboard layout**
   - Sidebar with: All Bookmarks, Collections, Import
   - Header with search input and user avatar/logout
   - Responsive: sidebar collapses to hamburger on mobile

5. **Bookmarks page** (`/dashboard`)
   - Fetch all bookmarks for current user ordered by `created_at desc`
   - Render as `BookmarkCard` grid
   - `BookmarkCard` shows: favicon, title, URL domain, tags, collection name, relative time
   - Floating "Add Bookmark" button opens `AddBookmarkDialog`

6. **AddBookmarkDialog**
   - Input: URL field with "Fetch" button
   - On fetch: call `/api/fetch-meta?url=...`, populate title + description fields
   - Fields: URL, Title, Description, Tags (comma-separated input), Collection (select)
   - Submit inserts into `bookmarks` table

7. **Collections page** (`/dashboard/collections`)
   - List all collections with bookmark count
   - "New Collection" button opens `CreateCollectionDialog`
   - Click collection → `/dashboard/collections/[id]`

8. **Single collection page** (`/dashboard/collections/[id]`)
   - Show bookmarks filtered to this collection
   - Edit collection name/description
   - Toggle public/private with slug generation: `nanoid(8)` → store as `slug`
   - When public: show share URL `/share/{slug}` with copy button

9. **Search & filter**
   - Client-side: filter bookmark list by title/URL/tags/description as user types
   - Tag filter: clickable tag chips above grid to filter by tag

10. **Fetch-meta API**
    - Implement `app/api/fetch-meta/route.ts` as shown above
    - Install `cheerio`

---

### Phase 2 — Public Sharing

**Goal:** Public collections are accessible without auth via a shareable URL.

#### Steps

1. **Public page** (`/share/[slug]/page.tsx`)
   - Server Component (SSR for SEO)
   - Look up collection by `slug` where `is_public = true`
   - If not found: return `notFound()`
   - Render read-only bookmark grid
   - No auth required — use Supabase anon key only
   - Page title: `{collection.name} by {owner display name}`

2. **Slug generation**
   - When user toggles collection to public: generate `nanoid(8)` slug if none exists
   - Store in `collections.slug`
   - Never regenerate an existing slug (links would break)

3. **Share UI**
   - Copy-to-clipboard button for `${APP_URL}/share/${slug}`
   - Show preview of what the public page looks like (optional)

---

### Phase 3 — Chrome Extension

**Goal:** One-click save current tab to a collection.

#### File: `extension/manifest.json`

```json
{
  "manifest_version": 3,
  "name": "BookmarkHub",
  "version": "1.0.0",
  "description": "Save pages to BookmarkHub",
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "background": {
    "service_worker": "background.js"
  }
}
```

#### `extension/popup.html`

- If not logged in: show email/password form + "Login with Google" button
- If logged in: show current tab URL, collection selector, "Save" button + logout

#### `extension/popup.js`

```javascript
// Auth: call Supabase REST API directly
// Store session in chrome.storage.local
// On save: POST to Supabase bookmarks table via fetch using stored token
// Collections: fetch from Supabase API using stored token
```

Key implementation notes:
- Use `chrome.tabs.query({ active: true, currentWindow: true })` to get current URL
- Call Supabase Auth REST endpoint directly (no SDK — keep extension small)
- `chrome.storage.local.set({ session: ... })` to persist login
- On popup open: check `chrome.storage.local.get('session')` to determine auth state

---

### Phase 4 — Browser Bookmark Import

**Goal:** Users upload a Chrome bookmark HTML export and bulk-insert into Supabase.

#### Steps

1. **Import page** (`/dashboard/import/page.tsx`)
   - File input: `accept=".html"`
   - On file select: read as text, parse with `DOMParser`
   - Extract all `<a>` tags: `{ href, textContent, ADD_DATE }`
   - Show preview table: checkbox list of found bookmarks (default all checked)
   - "Import Selected" button

2. **Parser logic** (client-side in `ImportBookmarks.tsx`)

```typescript
function parseChromeBookmarks(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return Array.from(doc.querySelectorAll('a')).map(a => ({
    url: a.href,
    title: a.textContent?.trim() || a.href,
    created_at: a.getAttribute('ADD_DATE')
      ? new Date(parseInt(a.getAttribute('ADD_DATE')!) * 1000).toISOString()
      : new Date().toISOString(),
  }))
}
```

3. **Bulk insert**
   - Insert in batches of 100 using `supabase.from('bookmarks').insert(batch)`
   - Show progress bar during insert
   - On success: redirect to `/dashboard`

---

## Coding Conventions

- **Server Components by default.** Add `'use client'` only when you need hooks, event handlers, or browser APIs.
- **Data fetching in Server Components.** Use the server Supabase client in page/layout server components. Pass data as props to client components.
- **No prop drilling past 2 levels.** Use context or co-located state instead.
- **Error handling.** Every Supabase call: destructure `{ data, error }` and handle `error` explicitly.
- **Loading states.** Every async action must have a loading spinner or disabled button state.
- **TypeScript strict.** Use the types in `lib/types.ts`. No `any`.
- **shadcn/ui.** Use `Button`, `Dialog`, `Input`, `Card`, `Badge`, `Separator` etc. from shadcn before writing custom components.
- **Tailwind only.** No CSS modules or styled-components.

---

## shadcn Components to Install

Run these before building UI (shadcn v3 + Tailwind v4):

```bash
npx shadcn@latest add button card dialog input label badge separator avatar dropdown-menu sheet tabs sonner skeleton
```

Note: `toast` has been replaced by `sonner`. Import toast notifications as:
```typescript
import { toast } from 'sonner'
toast.success('Bookmark saved!')
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.98.0",
    "cheerio": "latest",
    "nanoid": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "date-fns": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "@types/node": "latest",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.2.0",
    "@tailwindcss/postcss": "^4.2.0"
  }
}
```

---

## Definition of Done — Per Phase

### Phase 1
- [ ] User can sign up, log in (email + Google), log out
- [ ] User can view all their bookmarks in a grid
- [ ] User can add a bookmark by pasting a URL; title/description/favicon auto-fill
- [ ] User can create collections and assign bookmarks to them
- [ ] User can tag bookmarks and filter by tag
- [ ] Search filters bookmarks in real-time

### Phase 2
- [ ] Collection can be toggled public/private
- [ ] Public collection gets a unique `/share/{slug}` URL
- [ ] `/share/{slug}` is accessible without login and renders with SSR

### Phase 3
- [ ] Extension popup shows current tab URL
- [ ] User can log in from extension popup
- [ ] User can select a collection and save the current tab
- [ ] Session persists across popup open/close

### Phase 4
- [ ] User can upload a Chrome bookmark HTML file
- [ ] Bookmarks are parsed and shown in a preview list
- [ ] Selected bookmarks are bulk-inserted into Supabase
- [ ] Progress feedback shown during import
