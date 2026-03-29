import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TrendingSource, TrendingTopicInsert } from '@/lib/types'

function parseRssItems(xml: string): { title: string; link: string }[] {
  const items: { title: string; link: string }[] = []
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let itemMatch: RegExpExecArray | null
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const block = itemMatch[1]
    const titleMatch = block.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i)
    const linkMatch = block.match(/<link[^>]*>(.*?)<\/link>|<link[^>]*\/>/i)
    const title = (titleMatch?.[1] ?? titleMatch?.[2] ?? '').trim()
    const link = (linkMatch?.[1] ?? '').trim()
    if (title && title.length > 10) items.push({ title, link })
  }
  return items
}

function scoreTechBusiness(title: string, source: TrendingSource): number {
  const lc = title.toLowerCase()
  let score = 50
  const signals = ['startup','funding','ipo','acquisition','revenue','profit','billion','million',
    'invest','launch','raise','valuation','market','product','platform','ai','llm','model',
    'openai','google','apple','microsoft','meta','amazon','tesla','nvidia','chip','cloud',
    'saas','enterprise','b2b','data','ceo','founder','strategy']
  const hits = signals.filter(s => lc.includes(s)).length
  score += Math.min(hits * 8, 30)
  const base: Record<TrendingSource, number> = {
    hackernews: 60, producthunt: 55, techcrunch: 65, theverge: 60, arstechnica: 58,
  }
  score = Math.floor((score + base[source]) / 2)
  return Math.min(Math.max(score, 0), 100)
}

async function fetchRss(url: string, source: TrendingSource, limit = 10): Promise<TrendingTopicInsert[]> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ElEmpresaurio/1.0' }, next: { revalidate: 0 } })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRssItems(xml).slice(0, limit).map(item => ({
      title: item.title, url: item.link || null, source,
      score: scoreTechBusiness(item.title, source),
      fetched_at: new Date().toISOString(), used: false,
    }))
  } catch { return [] }
}

async function fetchHackerNews(limit = 10): Promise<TrendingTopicInsert[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { next: { revalidate: 0 } })
    if (!res.ok) return []
    const ids: number[] = await res.json()
    const stories = await Promise.all(
      ids.slice(0, limit).map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()).catch(() => null)
      )
    )
    return stories.filter(s => s?.type === 'story' && s.title).map(s => ({
      title: s.title as string,
      url: (s.url as string | undefined) ?? `https://news.ycombinator.com/item?id=${s.id}`,
      source: 'hackernews' as TrendingSource,
      score: scoreTechBusiness(s.title, 'hackernews'),
      fetched_at: new Date().toISOString(), used: false,
    }))
  } catch { return [] }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: latest } = await supabase
    .from('trending_topics').select('fetched_at').eq('user_id', user.id)
    .order('fetched_at', { ascending: false }).limit(1).maybeSingle()

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (latest?.fetched_at && new Date(latest.fetched_at) > sixHoursAgo) {
    return NextResponse.redirect(new URL('/trending', siteUrl))
  }

  const [hn, ph, tc, tv, ar] = await Promise.all([
    fetchHackerNews(10),
    fetchRss('https://www.producthunt.com/feed?category=undefined', 'producthunt', 8),
    fetchRss('https://techcrunch.com/feed/', 'techcrunch', 10),
    fetchRss('https://www.theverge.com/rss/index.xml', 'theverge', 8),
    fetchRss('https://feeds.arstechnica.com/arstechnica/technology-lab', 'arstechnica', 8),
  ])

  const allTopics = [...hn, ...ph, ...tc, ...tv, ...ar].map(t => ({ ...t, user_id: user.id }))
  if (allTopics.length === 0) return NextResponse.redirect(new URL('/trending?error=no_topics', siteUrl))

  const { error } = await supabase.from('trending_topics')
    .upsert(allTopics as never[], { onConflict: 'user_id,title,source', ignoreDuplicates: true })

  if (error) {
    console.error('[trending/refresh]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/trending', siteUrl))
}
