import Link from 'next/link'

export default function ShareLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
      <header className="px-8 py-5 border-b border-[#1a1a1a]">
        <Link href="/" className="text-sm font-medium text-[#e5e5e5] hover:text-[#a0a0a0] transition-colors">
          Portal
        </Link>
      </header>
      <main>{children}</main>
    </div>
  )
}

