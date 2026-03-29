import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * RSS feeds to ingest. Uses native browser DOMParser via plain text XML parsing.
 * Add more feeds here as needed.
 */
const RSS_FEEDS = [
  { url: 'https://news.ycombinator.com/rss', source: 'Hacker News' },
  { url: 'https://www.reddit.com/r/programming/.rss', source: 'Reddit /r/programming' },
  { url: 'https://feeds.feedburner.com/TechCrunch', source: 'TechCrunch' },
]

interface RSSItem {
  title: string
  link: string
  source: string
}

async function fetchRSSFeed(feedUrl: string, source: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'ElEmpresaurio-RSSReader/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const text = await res.text()
    const items: RSSItem[] = []

    // Simple regex-based XML parsing (no DOM available in Node.js edge)
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
    for (const match of itemMatches) {
      const itemXml = match[1]
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)
      const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)

      if (titleMatch?.[1]) {
        items.push({
          title: titleMatch[1].trim(),
          link: linkMatch?.[1]?.trim() ?? feedUrl,
          source,
        })
      }
    }

    return items.slice(0, 10) // top 10 per feed
  } catch {
    return []
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all RSS feeds in parallel
  const feedResults = await Promise.all(
    RSS_FEEDS.map((feed) => fetchRSSFeed(feed.url, feed.source))
  )
  const allItems = feedResults.flat()

  if (allItems.length === 0) {
    return NextResponse.json({ message: 'No items found from feeds', inserted: 0 })
  }

  // Build insert rows — skip duplicates by title (upsert on title+user_id not supported easily,
  // so we check existing titles first)
  const { data: existing } = await supabase
    .from('viral_topics')
    .select('title')
    .eq('user_id', user.id)

  const existingTitles = new Set((existing ?? []).map((r: { title: string }) => r.title.toLowerCase()))

  const toInsert = allItems
    .filter((item) => !existingTitles.has(item.title.toLowerCase()))
    .map((item) => ({
      user_id: user.id,
      title: item.title,
      source: item.source,
      source_url: item.link,
      virality_score: 50, // default score; user adjusts manually
      status: 'new' as const,
    }))

  if (toInsert.length === 0) {
    return NextResponse.json({ message: 'All items already ingested', inserted: 0 })
  }

  const { error } = await supabase.from('viral_topics').insert(toInsert)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    message: `Ingested ${toInsert.length} new topics`,
    inserted: toInsert.length,
    feeds: RSS_FEEDS.map((f) => f.source),
  })
}
