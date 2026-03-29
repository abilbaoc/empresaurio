import { createClient } from '@/lib/supabase/server'
import { ScriptEditor } from '@/components/script-generator/script-editor'
import type { ViralTopic } from '@/lib/types'

interface Props {
  searchParams: Promise<{ topic?: string; source?: string; url?: string }>
}

export default async function NewScriptPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: topicsRaw } = await supabase
    .from('viral_topics')
    .select('*')
    .eq('user_id', user!.id)
    .in('status', ['approved', 'in_review', 'new'])
    .order('virality_score', { ascending: false })

  const topics = (topicsRaw ?? []) as ViralTopic[]

  // Pre-fill from trending topic (via searchParams)
  const params = await searchParams
  const initialTopic = params.topic ?? ''
  const initialSource = params.source ?? ''
  const initialUrl = params.url ?? ''
  const initialNotes = initialSource
    ? `Fuente: ${initialSource}${initialUrl ? ` — ${initialUrl}` : ''}`
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo guion</h1>
        <p className="text-muted-foreground">Genera y edita un guion con Claude AI</p>
      </div>
      <ScriptEditor
        topics={topics}
        initialTopicText={initialTopic}
        initialNotes={initialNotes}
      />
    </div>
  )
}
