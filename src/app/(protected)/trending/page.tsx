import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RefreshCw, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { TrendingTopicCard } from '@/components/trending/TrendingTopicCard'
import type { TrendingTopic, TrendingSource } from '@/lib/types'

const SOURCE_ORDER: TrendingSource[] = ['hackernews', 'techcrunch', 'theverge', 'arstechnica', 'producthunt']
const SOURCE_NAMES: Record<TrendingSource, string> = {
  hackernews: 'Hacker News', techcrunch: 'TechCrunch', theverge: 'The Verge',
  arstechnica: 'Ars Technica', producthunt: 'Product Hunt',
}

export default async function TrendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: topics, error } = await supabase
    .from('trending_topics').select('*').eq('user_id', user.id)
    .order('score', { ascending: false }).order('fetched_at', { ascending: false }).limit(60)

  const allTopics = (topics ?? []) as TrendingTopic[]
  const lastFetchDate = allTopics[0]?.fetched_at ? new Date(allTopics[0].fetched_at) : null
  const isFresh = lastFetchDate ? lastFetchDate > new Date(Date.now() - 6 * 60 * 60 * 1000) : false

  const bySource: Record<string, TrendingTopic[]> = {}
  for (const t of allTopics) {
    if (!bySource[t.source]) bySource[t.source] = []
    bySource[t.source].push(t)
  }
  const orderedSources = SOURCE_ORDER.filter(s => bySource[s]?.length > 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            Trending Topics
          </h1>
          {lastFetchDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Última actualización: {lastFetchDate.toLocaleString('es-ES')}
              {isFresh && <span className="ml-2 text-green-600 font-medium">· Actualizado</span>}
            </p>
          )}
        </div>
        <Link href="/api/trending/refresh" className={buttonVariants({ variant: isFresh ? 'outline' : 'default' })}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {allTopics.length === 0 ? 'Cargar temas' : 'Actualizar'}
        </Link>
      </div>

      {allTopics.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{allTopics.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Temas totales</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{allTopics.filter(t => !t.used).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Sin usar</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{allTopics[0]?.score ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Score máximo</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Error al cargar temas. Intenta actualizar de nuevo.
        </div>
      )}

      {allTopics.length === 0 && !error && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Flame className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Sin temas todavía</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Carga los temas trending de HackerNews, TechCrunch, The Verge, Ars Technica y Product Hunt.
          </p>
          <Link href="/api/trending/refresh" className={buttonVariants()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Cargar temas
          </Link>
        </div>
      )}

      {orderedSources.map(source => (
        <section key={source}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {SOURCE_NAMES[source]}
            <span className="ml-2 normal-case text-xs font-normal">({bySource[source].length} temas)</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bySource[source].map(topic => (
              <TrendingTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
