'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CalendarEntry, Platform } from '@/lib/types'

interface Props {
  scripts: { id: string; title: string }[]
  onClose: () => void
  onCreated: (entry: CalendarEntry) => void
}

export function NewEntryModal({ scripts, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState<Platform | ''>('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scriptId, setScriptId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('El título es obligatorio.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          platform: platform || null,
          scheduled_date: scheduledDate || null,
          script_id: scriptId || null,
          notes: notes.trim() || null,
          status: 'draft',
        }),
      })

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setError(body.error ?? 'Error al crear la entrada.')
        return
      }

      const created = await res.json() as CalendarEntry
      onCreated(created)
      onClose()
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Nueva entrada</h2>
          <button
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="entry-title">Titulo <span className="text-destructive">*</span></Label>
            <Input
              ref={titleRef}
              id="entry-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Video sobre IA en PYMES"
              required
            />
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <Label htmlFor="entry-platform">Plataforma</Label>
            <select
              id="entry-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform | '')}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Sin plataforma</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          {/* Scheduled date */}
          <div className="space-y-1.5">
            <Label htmlFor="entry-date">Fecha programada</Label>
            <Input
              id="entry-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          {/* Link script */}
          {scripts.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="entry-script">Guion vinculado</Label>
              <select
                id="entry-script"
                value={scriptId}
                onChange={(e) => setScriptId(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Sin guion</option>
                {scripts.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="entry-notes">Notas</Label>
            <textarea
              id="entry-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas opcionales..."
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none dark:bg-input/30"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear entrada'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
