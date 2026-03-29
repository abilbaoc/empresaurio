'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { CalendarEntry, CalendarStatus, Platform } from '@/lib/types'
import { cn } from '@/lib/utils'

const COLUMNS: { status: CalendarStatus; label: string }[] = [
  { status: 'draft', label: 'Borrador' },
  { status: 'ready', label: 'Listo' },
  { status: 'approved', label: 'Aprobado' },
  { status: 'published', label: 'Publicado' },
  { status: 'archived', label: 'Archivado' },
]

const PLATFORM_PILL_CLASS: Record<Platform | 'none', string> = {
  tiktok: 'bg-rose-500/20 text-rose-400',
  youtube: 'bg-red-500/20 text-red-400',
  instagram: 'bg-purple-500/20 text-purple-400',
  none: 'bg-muted text-muted-foreground',
}

const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
}

const STATUS_HEADER_CLASS: Record<CalendarStatus, string> = {
  draft: 'text-muted-foreground',
  ready: 'text-blue-400',
  approved: 'text-green-400',
  published: 'text-emerald-400',
  archived: 'text-muted-foreground',
}

const STATUS_BADGE_CLASS: Record<CalendarStatus, string> = {
  draft: 'bg-muted/60 text-muted-foreground',
  ready: 'bg-blue-500/15 text-blue-400',
  approved: 'bg-green-500/15 text-green-400',
  published: 'bg-emerald-500/15 text-emerald-400',
  archived: 'bg-muted/60 text-muted-foreground',
}

const STATUS_LABEL: Record<CalendarStatus, string> = {
  draft: 'Borrador',
  ready: 'Listo',
  approved: 'Aprobado',
  published: 'Publicado',
  archived: 'Archivado',
}

interface Props {
  entries: CalendarEntry[]
  onEntryUpdated: (entry: CalendarEntry) => void
}

function pillClass(platform: Platform | null) {
  return PLATFORM_PILL_CLASS[platform ?? 'none']
}

export function KanbanBoard({ entries, onEntryUpdated }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [draggingOver, setDraggingOver] = useState<CalendarStatus | null>(null)

  const byStatus: Record<CalendarStatus, CalendarEntry[]> = {
    draft: [],
    ready: [],
    approved: [],
    published: [],
    archived: [],
  }
  for (const e of entries) {
    byStatus[e.status].push(e)
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, status: CalendarStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggingOver(status)
  }

  function handleDragLeave() {
    setDraggingOver(null)
  }

  async function handleDrop(e: React.DragEvent, newStatus: CalendarStatus) {
    e.preventDefault()
    setDraggingOver(null)

    if (!draggedId) return
    const entry = entries.find((en) => en.id === draggedId)
    if (!entry || entry.status === newStatus) {
      setDraggedId(null)
      return
    }

    // Optimistic update
    onEntryUpdated({ ...entry, status: newStatus })
    setDraggedId(null)

    try {
      const res = await fetch(`/api/calendar/${draggedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const updated = await res.json() as CalendarEntry
        onEntryUpdated(updated)
      } else {
        // Revert on failure
        onEntryUpdated(entry)
      }
    } catch {
      onEntryUpdated(entry)
    }
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDraggingOver(null)
  }

  return (
    <div className="grid grid-cols-5 gap-3 min-h-[400px]">
      {COLUMNS.map(({ status, label }) => {
        const colEntries = byStatus[status]
        const isOver = draggingOver === status

        return (
          <div
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            className={cn(
              'flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-2 transition-colors',
              isOver && 'border-primary bg-primary/5'
            )}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-1 py-0.5">
              <span className={cn('text-xs font-semibold uppercase tracking-wide', STATUS_HEADER_CLASS[status])}>
                {label}
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                {colEntries.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {colEntries.map((entry) => (
                <KanbanCard
                  key={entry.id}
                  entry={entry}
                  isDragging={draggedId === entry.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
              {colEntries.length === 0 && (
                <div className="rounded-lg border border-dashed border-border py-6 text-center text-[11px] text-muted-foreground">
                  Sin entradas
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface KanbanCardProps {
  entry: CalendarEntry
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
}

function KanbanCard({ entry, isDragging, onDragStart, onDragEnd }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, entry.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'cursor-grab rounded-lg border border-border bg-card p-2.5 space-y-2 active:cursor-grabbing select-none transition-opacity',
        isDragging && 'opacity-40'
      )}
    >
      <p className="text-xs font-medium leading-snug line-clamp-2">{entry.title}</p>

      <div className="flex flex-wrap items-center gap-1">
        {/* Status badge */}
        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', STATUS_BADGE_CLASS[entry.status])}>
          {STATUS_LABEL[entry.status]}
        </span>

        {entry.platform && (
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', pillClass(entry.platform))}>
            {PLATFORM_LABELS[entry.platform]}
          </span>
        )}
        {entry.script_id && (
          <Badge variant="outline" className="text-[10px] h-4">
            Guion
          </Badge>
        )}
      </div>

      {entry.scheduled_date && (
        <p className="text-[10px] text-muted-foreground">
          {new Date(entry.scheduled_date + 'T00:00:00').toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
          })}
        </p>
      )}

      {/* Preview link */}
      <Link
        href={`/content/${entry.id}/preview`}
        onClick={(e) => e.stopPropagation()}
        className="block text-[10px] text-primary hover:underline"
      >
        Ver preview →
      </Link>
    </div>
  )
}
