'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTopic, updateTopic } from '@/app/actions/viral-topics'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ViralTopic } from '@/lib/types'

const CATEGORIES = [
  'AI / ML', 'Cloud', 'Dev Tools', 'Web Dev', 'Mobile', 'Security',
  'Blockchain', 'Open Source', 'Startups', 'Big Tech', 'Otro',
]

const STATUSES = [
  { value: 'new', label: 'Nuevo' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'scripted', label: 'Guionizado' },
  { value: 'archived', label: 'Archivado' },
] as const

interface TopicFormProps {
  topic?: ViralTopic
}

export function TopicForm({ topic }: TopicFormProps) {
  const router = useRouter()
  const isEditing = !!topic

  const [form, setForm] = useState({
    title: topic?.title ?? '',
    source: topic?.source ?? '',
    source_url: topic?.source_url ?? '',
    category: topic?.category ?? '',
    virality_score: topic?.virality_score ?? 50,
    status: topic?.status ?? 'new',
    notes: topic?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = {
        ...form,
        source: form.source || null,
        source_url: form.source_url || null,
        category: form.category || null,
        notes: form.notes || null,
        status: form.status as ViralTopic['status'],
      }

      if (isEditing) {
        await updateTopic(topic.id, data)
      } else {
        await createTopic(data)
      }
      router.push('/viral-tracker')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar topic' : 'Nuevo topic viral'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Claude 4 supera GPT-5 en benchmarks de código"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Fuente</Label>
              <Input
                id="source"
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                placeholder="Ej: Hacker News, X, Reddit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_url">URL fuente</Label>
              <Input
                id="source_url"
                type="url"
                value={form.source_url}
                onChange={(e) => set('source_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin categoría</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="virality_score">
              Puntuación viral: <span className="font-bold">{form.virality_score}</span>/100
            </Label>
            <input
              id="virality_score"
              type="range"
              min={0}
              max={100}
              value={form.virality_score}
              onChange={(e) => set('virality_score', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Ideas, ángulos, audiencia objetivo..."
              rows={3}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear topic'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/viral-tracker')}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
