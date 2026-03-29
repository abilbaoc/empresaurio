import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScriptEditor } from '@/components/script-generator/script-editor'
import type { Script, ViralTopic, ScriptVersion } from '@/lib/types'

export default async function EditScriptPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [scriptRes, topicsRes, versionsRes] = await Promise.all([
    supabase
      .from('scripts')
      .select('*, topic:viral_topics(*)')
      .eq('id', id)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('viral_topics')
      .select('*')
      .eq('user_id', user!.id)
      .in('status', ['approved', 'in_review', 'new', 'scripted'])
      .order('virality_score', { ascending: false }),
    supabase
      .from('script_versions')
      .select('*')
      .eq('script_id', id)
      .order('version', { ascending: false }),
  ])

  if (!scriptRes.data) notFound()

  const script = {
    ...scriptRes.data,
    versions: (versionsRes.data ?? []) as ScriptVersion[],
  } as Script & { topic?: ViralTopic | null; versions: ScriptVersion[] }

  const topics = (topicsRes.data ?? []) as ViralTopic[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight truncate">{script.title}</h1>
        <p className="text-muted-foreground">Versión {script.version}</p>
      </div>
      <ScriptEditor script={script} topics={topics} />
    </div>
  )
}
