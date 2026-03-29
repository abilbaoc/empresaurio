'use client'

import Link from 'next/link'
import { ExternalLink, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { TrendingTopic, TrendingSource } from '@/lib/types'
import { cn } from '@/lib/utils'

const SOURCE_LABELS: Record<TrendingSource, string> = {
  techcrunch: 'TechCrunch',
  theverge: 'The Verge',
  arstechnica: 'Ars Technica',
  hackernews: 'Hacker News',
  producthunt: 'Product Hunt',
}

const SOURCE_COLORS: Record<TrendingSource, string> = {
  techcrunch: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  theverge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  arstechnica: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  hackernews: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  producthunt: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-red-600' :
    score >= 65 ? 'text-orange-500' :
    score >= 50 ? 'text-yellow-500' :
    'text-muted-foreground'
  return (
    <span className={cn('flex items-center gap-1 text-xs font-semibold tabular-nums', color)}>
      <Zap className="h-3 w-3" />
      {score}
    </span>
  )
}

export function TrendingTopicCard({ topic }: { topic: TrendingTopic }) {
  const generateScriptUrl = `/script-generator/new?topic=${encodeURIComponent(topic.title)}&source=${encodeURIComponent(SOURCE_LABELS[topic.source])}&url=${encodeURIComponent(topic.url ?? '')}`
  return (
    <Card className={cn('transition-shadow hover:shadow-md', topic.used && 'opacity-60')}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">{topic.title}</p>
          <ScoreBadge score={topic.score} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', SOURCE_COLORS[topic.source])}>
            {SOURCE_LABELS[topic.source]}
          </span>
          {topic.used && (
            <Badge variant="outline" className="text-xs text-muted-foreground">Usado</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={generateScriptUrl}>
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Generar guion
            </Link>
          </Button>
          {topic.url && (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <a href={topic.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="sr-only">Ver fuente</span>
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
