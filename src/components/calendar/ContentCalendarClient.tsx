'use client'

import { useState } from 'react'
import { Calendar, LayoutGrid, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonthCalendar } from './MonthCalendar'
import { KanbanBoard } from './KanbanBoard'
import { NewEntryModal } from './NewEntryModal'
import type { CalendarEntry, Platform } from '@/lib/types'
import { cn } from '@/lib/utils'

type View = 'calendar' | 'kanban'

const PLATFORM_LABELS: Record<Platform | 'all', string> = {
  all: 'Todos',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
}

const PLATFORM_FILTER_OPTIONS: (Platform | 'all')[] = ['all', 'tiktok', 'youtube', 'instagram']

interface Props {
  entries: CalendarEntry[]
  scripts: { id: string; title: string }[]
}

export function ContentCalendarClient({ entries: initialEntries, scripts }: Props) {
  const [view, setView] = useState<View>('calendar')
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all')
  const [entries, setEntries] = useState<CalendarEntry[]>(initialEntries)
  const [modalOpen, setModalOpen] = useState(false)

  const filteredEntries =
    platformFilter === 'all'
      ? entries
      : entries.filter((e) => e.platform === platformFilter)

  function handleEntryCreated(entry: CalendarEntry) {
    setEntries((prev) => [entry, ...prev])
  }

  function handleEntryUpdated(updated: CalendarEntry) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario de Contenido</h1>
        <p className="text-muted-foreground">Planifica y organiza tus publicaciones</p>
      </div>

      {/* Subheader bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Platform filter pills */}
        <div className="flex items-center gap-1.5">
          {PLATFORM_FILTER_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={cn(
                'h-7 rounded-full px-3 text-xs font-medium transition-colors',
                platformFilter === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          <button
            onClick={() => setView('calendar')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              view === 'calendar'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Calendar className="size-3.5" />
            Calendario
          </button>
          <button
            onClick={() => setView('kanban')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              view === 'kanban'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="size-3.5" />
            Kanban
          </button>
        </div>

        {/* New button */}
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="size-3.5" />
          Nuevo
        </Button>
      </div>

      {/* Main view */}
      {view === 'calendar' ? (
        <MonthCalendar entries={filteredEntries} />
      ) : (
        <KanbanBoard entries={filteredEntries} onEntryUpdated={handleEntryUpdated} />
      )}

      {/* New entry modal */}
      {modalOpen && (
        <NewEntryModal
          scripts={scripts}
          onClose={() => setModalOpen(false)}
          onCreated={handleEntryCreated}
        />
      )}
    </div>
  )
}
