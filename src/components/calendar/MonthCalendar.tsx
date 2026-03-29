'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { CalendarEntry, Platform, CalendarStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const PLATFORM_PILL_CLASS: Record<Platform | 'none', string> = {
  tiktok: 'bg-rose-500/20 text-rose-400',
  youtube: 'bg-red-500/20 text-red-400',
  instagram: 'bg-purple-500/20 text-purple-400',
  none: 'bg-muted text-muted-foreground',
}

const STATUS_VARIANT: Record<CalendarStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  scheduled: 'default',
  published: 'default',
  archived: 'outline',
}

const STATUS_LABELS: Record<CalendarStatus, string> = {
  draft: 'Borrador',
  scheduled: 'Programado',
  published: 'Publicado',
  archived: 'Archivado',
}

const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
}

interface Props {
  entries: CalendarEntry[]
}

function pillClass(platform: Platform | null) {
  return PLATFORM_PILL_CLASS[platform ?? 'none']
}

// Returns ISO date string "YYYY-MM-DD" for a given year/month/day (local)
function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Build calendar grid for the given month
// Returns an array of 6 weeks × 7 days (null = outside current month)
function buildGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1)
  // Monday-first: Sunday = 6, Mon = 0
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

export function MonthCalendar({ entries }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const weeks = buildGrid(year, month)

  // Group entries by scheduled_date
  const byDate = new Map<string, CalendarEntry[]>()
  for (const entry of entries) {
    if (entry.scheduled_date) {
      const existing = byDate.get(entry.scheduled_date) ?? []
      existing.push(entry)
      byDate.set(entry.scheduled_date, existing)
    }
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
    setSelectedDate(null)
  }

  const todayStr = toISODate(today.getFullYear(), today.getMonth(), today.getDate())
  const selectedEntries = selectedDate ? (byDate.get(selectedDate) ?? []) : []

  return (
    <div className="flex gap-4">
      {/* Calendar grid */}
      <div className="flex-1 min-w-0">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="text-base font-semibold">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-border">
          {weeks.flat().map((day, idx) => {
            const dateStr = day !== null ? toISODate(year, month, day) : null
            const dayEntries = dateStr ? (byDate.get(dateStr) ?? []) : []
            const isToday = dateStr === todayStr
            const isSelected = dateStr !== null && dateStr === selectedDate

            return (
              <div
                key={idx}
                onClick={() => day !== null && setSelectedDate(isSelected ? null : dateStr!)}
                className={cn(
                  'min-h-[80px] p-1.5 flex flex-col gap-1 bg-card transition-colors',
                  day !== null && 'cursor-pointer hover:bg-muted/50',
                  day === null && 'bg-muted/20',
                  isSelected && 'ring-1 ring-inset ring-primary'
                )}
              >
                {day !== null && (
                  <>
                    <span
                      className={cn(
                        'text-xs font-medium self-start flex size-5 items-center justify-center rounded-full',
                        isToday && 'bg-primary text-primary-foreground',
                        !isToday && 'text-foreground'
                      )}
                    >
                      {day}
                    </span>
                    {/* Entry pills — up to 3 */}
                    {dayEntries.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={cn(
                          'truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight',
                          pillClass(e.platform)
                        )}
                        title={e.title}
                      >
                        {e.title}
                      </span>
                    ))}
                    {dayEntries.length > 3 && (
                      <span className="text-[10px] text-muted-foreground pl-1">
                        +{dayEntries.length - 3} más
                      </span>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Day detail sidebar */}
      {selectedDate && (
        <div className="w-64 shrink-0">
          <div className="rounded-xl border border-border bg-card p-3 space-y-3">
            <h3 className="text-sm font-semibold">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            {selectedEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin entradas para este día.</p>
            ) : (
              <div className="space-y-2">
                {selectedEntries.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border bg-card p-2 space-y-1.5">
                    <p className="text-xs font-medium leading-snug">{e.title}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      {e.platform && (
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', pillClass(e.platform))}>
                          {PLATFORM_LABELS[e.platform]}
                        </span>
                      )}
                      <Badge variant={STATUS_VARIANT[e.status]} className="text-[10px] h-4">
                        {STATUS_LABELS[e.status]}
                      </Badge>
                    </div>
                    {e.script && (
                      <p className="text-[10px] text-muted-foreground truncate">Guion: {e.script.title}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
