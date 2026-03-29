'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { saveScript } from '@/app/actions/scripts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Save, Copy, Check, RotateCcw } from 'lucide-react'
import type { Script, ViralTopic, ScriptVersion } from '@/lib/types'

interface ScriptEditorProps {
  script?: Script & { topic?: ViralTopic | null; versions?: ScriptVersion[] }
  topics: ViralTopic[]
}

const STYLE_PRESETS = [
  { label: 'Tutorial paso a paso', value: 'tutorial' },
  { label: 'Análisis de negocio', value: 'analisis' },
  { label: 'Breaking news', value: 'breaking' },
  { label: 'Opinión polémica', value: 'opinion' },
  { label: 'Comparativa', value: 'comparativa' },
]

const DURATION_OPTIONS = [
  { label: '30 segundos', value: '30s' },
  { label: '60 segundos', value: '60s' },
  { label: '90 segundos', value: '90s' },
  { label: '2 minutos', value: '2min' },
]

export function ScriptEditor({ script, topics }: ScriptEditorProps) {
  const router = useRouter()
  const isEditing = !!script

  const [title, setTitle] = useState(script?.title ?? '')
  const [topicId, setTopicId] = useState(script?.topic_id ?? '')
  const [content, setContent] = useState(script?.content ?? '')
  const [status, setStatus] = useState(script?.status ?? 'draft')

  // Generation inputs
  const [topicText, setTopicText] = useState(
    script?.topic?.title ?? ''
  )
  const [style, setStyle] = useState('')
  const [duration, setDuration] = useState('60s')
  const [notes, setNotes] = useState('')

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function handleGenerate() {
    if (!topicText.trim()) {
      setError('Escribe un topic para generar el guion')
      return
    }
    setError(null)
    setGenerating(true)
    setContent('')

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicText, style, duration, notes }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error generando guion')
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setContent(accumulated)
      }

      // Auto-fill title from topic if empty
      if (!title) {
        setTitle(topicText.slice(0, 80))
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    } finally {
      setGenerating(false)
    }
  }

  function handleStop() {
    abortRef.current?.abort()
    setGenerating(false)
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setError('El guion necesita título y contenido')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveScript({
        id: script?.id,
        title,
        content,
        topic_id: topicId || null,
        status: status as Script['status'],
        metadata: { style, duration },
      })
      router.push('/script-generator')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const estimatedSeconds = Math.round(wordCount / 2.5)

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Left panel: generation controls */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Generar con Claude
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="gen-topic">Topic / idea</Label>
              <textarea
                id="gen-topic"
                value={topicText}
                onChange={(e) => setTopicText(e.target.value)}
                placeholder="Ej: OpenAI lanza o3-mini y destrona a los modelos de código abierto"
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Estilo</Label>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setStyle(style === p.value ? '' : p.value)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      style === p.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duración objetivo</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDuration(d.value)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      duration === d.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: incluir dato de mercado, mencionar competidores"
              />
            </div>

            {generating ? (
              <Button variant="outline" className="w-full" onClick={handleStop}>
                Detener generación
              </Button>
            ) : (
              <Button className="w-full" onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar guion
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Script metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metadatos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del guion"
              />
            </div>

            <div className="space-y-2">
              <Label>Topic vinculado</Label>
              <select
                value={topicId}
                onChange={(e) => {
                  setTopicId(e.target.value)
                  const t = topics.find((t) => t.id === e.target.value)
                  if (t && !topicText) setTopicText(t.title)
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin vincular</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Script['status'])}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="draft">Borrador</option>
                <option value="ready">Listo para grabar</option>
                <option value="produced">Producido</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Version history */}
        {script?.versions && script.versions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Historial ({script.versions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {script.versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      v{v.version} — {new Date(v.created_at).toLocaleDateString('es-ES')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setContent(v.content)}
                      className="text-xs text-primary hover:underline"
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right panel: script editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {content && (
              <>
                <Badge variant="secondary">{wordCount} palabras</Badge>
                <Badge variant="outline">~{estimatedSeconds}s</Badge>
              </>
            )}
            {generating && (
              <Badge className="animate-pulse">Generando...</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {content && (
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <><Check className="h-4 w-4 mr-1" /> Copiado</>
                ) : (
                  <><Copy className="h-4 w-4 mr-1" /> Copiar</>
                )}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || !content}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar guion'}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            generating
              ? 'Generando guion...'
              : 'El guion aparecerá aquí. Puedes editarlo directamente.'
          }
          className="flex min-h-[500px] w-full rounded-md border border-input bg-transparent px-4 py-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-mono leading-relaxed"
        />
      </div>
    </div>
  )
}
