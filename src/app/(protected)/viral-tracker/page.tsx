import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TopicActions } from '@/components/viral-tracker/topic-actions'
import { Plus, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViralTopic, TopicStatus } from '@/lib/types'

const STATUS_LABELS: Record<TopicStatus, string> = {
  new: 'Nuevo',
  in_review: 'En revisión',
  approved: 'Aprobado',
  scripted: 'Guionizado',
  archived: 'Archivado',
}

const STATUS_COLORS: Record<TopicStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  in_review: 'secondary',
  approved: 'default',
  scripted: 'secondary',
  archived: 'outline',
}

function getViralityColor(score: number) {
  if (score >= 80) return 'text-red-500'
  if (score >= 60) return 'text-orange-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-muted-foreground'
}

interface SearchParams {
  status?: string
  category?: string
  q?: string
}

export default async function ViralTrackerPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('viral_topics')
    .select('*')
    .eq('user_id', user!.id)
    .order('virality_score', { ascending: false })
    .order('created_at', { ascending: false })

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }
  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }

  const { data: topicsRaw } = await query
  const topics = topicsRaw ?? []

  const stats = {
    total: topics?.length ?? 0,
    approved: topics?.filter((t) => t.status === 'approved').length ?? 0,
    highVirality: topics?.filter((t) => t.virality_score >= 70).length ?? 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Viral Tracker</h1>
          <p className="text-muted-foreground">Monitoriza topics y tendencias virales</p>
        </div>
        <div className="flex gap-2">
          <Link href="/api/viral-tracker/ingest" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Ingesta RSS
          </Link>
          <Link href="/viral-tracker/new" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo topic
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Topics totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Aprobados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.highVirality}</div>
            <p className="text-xs text-muted-foreground">Alta viralidad (70+)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'new', 'in_review', 'approved', 'scripted', 'archived'] as const).map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/viral-tracker' : `/viral-tracker?status=${s}`}
          >
            <Badge
              variant={
                (searchParams.status === s || (!searchParams.status && s === 'all'))
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer"
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Topics table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {topics.length} topic{topics.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Flame className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Sin topics aún</p>
              <p className="text-sm mt-1">Añade tu primer topic viral o activa la ingesta RSS</p>
            </div>
          ) : (
            <div className="divide-y">
              {(topics as ViralTopic[]).map((topic) => (
                <div key={topic.id} className="flex items-start gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{topic.title}</span>
                      <Badge variant={STATUS_COLORS[topic.status]} className="text-xs shrink-0">
                        {STATUS_LABELS[topic.status]}
                      </Badge>
                      {topic.category && (
                        <span className="text-xs text-muted-foreground">{topic.category}</span>
                      )}
                    </div>
                    {topic.source && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {topic.source_url ? (
                          <a
                            href={topic.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {topic.source}
                          </a>
                        ) : (
                          topic.source
                        )}
                        {' · '}
                        {new Date(topic.created_at).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`flex items-center gap-1 text-sm font-bold ${getViralityColor(topic.virality_score)}`}>
                      <Flame className="h-4 w-4" />
                      {topic.virality_score}
                    </div>
                    <TopicActions topicId={topic.id} status={topic.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
