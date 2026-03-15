import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()
    const $ = cheerio.load(html)
    const origin = new URL(url).origin

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      null

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null

    // Favicon — try multiple selectors in priority order
    let favicon_url =
      $('link[rel="apple-touch-icon"]').attr('href') ||
      $('link[rel="icon"][sizes="32x32"]').attr('href') ||
      $('link[rel="icon"][sizes="16x16"]').attr('href') ||
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      null

    if (favicon_url && !favicon_url.startsWith('http')) {
      favicon_url = favicon_url.startsWith('/')
        ? `${origin}${favicon_url}`
        : `${origin}/${favicon_url}`
    }

    if (!favicon_url) {
      favicon_url = `${origin}/favicon.ico`
    }

    return NextResponse.json({ title, description, favicon_url })
  } catch (error) {
    console.error('Failed to fetch metadata:', error)
    return NextResponse.json({
      title: null,
      description: null,
      favicon_url: null,
    })
  }
}
