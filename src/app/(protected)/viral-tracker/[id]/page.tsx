import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopicForm } from '@/components/viral-tracker/topic-form'
import type { ViralTopic } from '@/lib/types'

export default async function EditTopicPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('viral_topics')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!data) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar topic</h1>
        <p className="text-muted-foreground truncate">{data.title}</p>
      </div>
      <TopicForm topic={data as ViralTopic} />
    </div>
  )
}
