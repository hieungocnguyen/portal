import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          BookmarkHub
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Save, organize, and share your bookmarks.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign In
        </Link>
      </main>
    </div>
  );
}
