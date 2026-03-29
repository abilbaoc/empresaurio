import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Script, ScriptStatus } from '@/lib/types'

const STATUS_LABELS: Record<ScriptStatus, string> = {
  draft: 'Borrador',
  ready: 'Listo',
  produced: 'Producido',
  archived: 'Archivado',
}

const STATUS_COLORS: Record<ScriptStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  ready: 'default',
  produced: 'default',
  archived: 'outline',
}

export default async function ScriptGeneratorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: scriptsRaw } = await supabase
    .from('scripts')
    .select('*, topic:viral_topics(title)')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  const scripts = scriptsRaw ?? []

  const stats = {
    total: scripts.length,
    ready: scripts.filter((s) => s.status === 'ready').length,
    produced: scripts.filter((s) => s.status === 'produced').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Script Generator</h1>
          <p className="text-muted-foreground">Genera guiones de vídeo con Claude AI</p>
        </div>
        <Link href="/script-generator/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo guion
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Guiones totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
            <p className="text-xs text-muted-foreground">Listos para grabar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.produced}</div>
            <p className="text-xs text-muted-foreground">Producidos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{scripts.length} guion{scripts.length !== 1 ? 'es' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {scripts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Sin guiones aún</p>
              <p className="text-sm mt-1">Genera tu primer guion con Claude AI</p>
            </div>
          ) : (
            <div className="divide-y">
              {scripts.map((s: Script & { topic?: { title: string } | null }) => (
                <Link
                  key={s.id}
                  href={`/script-generator/${s.id}`}
                  className="flex items-center gap-4 py-3 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.title}</p>
                    {s.topic && (
                      <p className="text-xs text-muted-foreground truncate">
                        Topic: {s.topic.title}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={STATUS_COLORS[s.status as ScriptStatus]}>
                      {STATUS_LABELS[s.status as ScriptStatus]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">v{s.version}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.updated_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
