import { TopicForm } from '@/components/viral-tracker/topic-form'

export default function NewTopicPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo topic viral</h1>
        <p className="text-muted-foreground">Añade un topic o tendencia que quieras rastrear</p>
      </div>
      <TopicForm />
    </div>
  )
}
