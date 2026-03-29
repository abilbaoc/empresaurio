import { createClient } from '@/lib/supabase/server'
import { ScriptEditor } from '@/components/script-generator/script-editor'
import type { ViralTopic } from '@/lib/types'

export default async function NewScriptPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: topicsRaw } = await supabase
    .from('viral_topics')
    .select('*')
    .eq('user_id', user!.id)
    .in('status', ['approved', 'in_review', 'new'])
    .order('virality_score', { ascending: false })

  const topics = (topicsRaw ?? []) as ViralTopic[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo guion</h1>
        <p className="text-muted-foreground">Genera y edita un guion con Claude AI</p>
      </div>
      <ScriptEditor topics={topics} />
    </div>
  )
}
