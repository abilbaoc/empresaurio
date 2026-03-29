'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RotateCcw, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CalendarEntry, CalendarStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<CalendarStatus, string> = {
  draft: 'Borrador',
  ready: 'Listo para revisar',
  approved: 'Aprobado',
  published: 'Publicado',
  archived: 'Archivado',
}

const STATUS_BADGE_CLASS: Record<CalendarStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  ready: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-green-500/20 text-green-400',
  published: 'bg-emerald-500/20 text-emerald-400',
  archived: 'bg-muted text-muted-foreground',
}

interface Props {
  entry: CalendarEntry
  scriptId: string | null
}

export function PreviewApprovalBar({ entry, scriptId }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<CalendarStatus>(entry.status)
  const [loading, setLoading] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function callApprove(action: 'approve' | 'reject' | 'reset', feedbackText?: string) {
    setLoading(action)
    setError(null)
    try {
      const res = await fetch(`/api/calendar/${entry.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback: feedbackText }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al procesar la acción')
      }
      const updated = await res.json()
      setStatus(updated.status)
      setShowRejectForm(false)
      setFeedback('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(null)
    }
  }

  function handleApprove() {
    callApprove('approve')
  }

  function handleRejectSubmit() {
    if (!feedback.trim()) {
      setError('Escribe feedback antes de rechazar')
      return
    }
    callApprove('reject', feedback)
  }

  function handleReset() {
    callApprove('reset')
  }

  const canApprove = status === 'ready' || status === 'draft'
  const canReject = status === 'ready' || status === 'approved'
  const canReset = status !== 'draft'

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Status row */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Estado:</span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              STATUS_BADGE_CLASS[status]
            )}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {canReset && (
            <Button
              variant="ghost"
              size="sm"
              disabled={!!loading}
              onClick={handleReset}
              className="text-muted-foreground"
            >
              {loading === 'reset' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              <span className="hidden sm:inline ml-1.5">Borrador</span>
            </Button>
          )}

          {canReject && (
            <Button
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() => setShowRejectForm((v) => !v)}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <XCircle className="size-3.5" />
              <span className="ml-1.5">Rechazar</span>
            </Button>
          )}

          {canApprove && (
            <Button
              size="sm"
              disabled={!!loading}
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading === 'approve' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle className="size-3.5" />
              )}
              <span className="ml-1.5">Aprobar</span>
            </Button>
          )}

          {status === 'approved' && (
            <Button
              size="sm"
              disabled={!!loading}
              onClick={() =>
                fetch(`/api/calendar/${entry.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'published' }),
                })
                  .then(() => { setStatus('published'); router.refresh() })
              }
              className="bg-primary"
            >
              Publicar
            </Button>
          )}

          {scriptId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/script-generator/${scriptId}`)}
            >
              Editar guion
            </Button>
          )}
        </div>
      </div>

      {/* Reject form */}
      {showRejectForm && (
        <div className="space-y-2 pt-1 border-t border-border">
          <label className="text-xs text-muted-foreground font-medium">
            Motivo del rechazo (requerido)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="Describe qué debe mejorar..."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={!!loading}
              onClick={handleRejectSubmit}
            >
              {loading === 'reject' && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              Confirmar rechazo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowRejectForm(false); setFeedback('') }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
