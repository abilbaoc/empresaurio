import { createClient } from '@/lib/supabase/server'
import { ContentCalendarClient } from '@/components/calendar/ContentCalendarClient'
import type { CalendarEntry } from '@/lib/types'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: entriesRaw }, { data: scriptsRaw }] = await Promise.all([
    supabase
      .from('content_calendar')
      .select('*, script:scripts(title)')
      .eq('user_id', user!.id)
      .order('scheduled_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('scripts')
      .select('id, title')
      .eq('user_id', user!.id)
      .order('title', { ascending: true }),
  ])

  const entries = (entriesRaw ?? []) as CalendarEntry[]
  const scripts = (scriptsRaw ?? []) as { id: string; title: string }[]

  return <ContentCalendarClient entries={entries} scripts={scripts} />
}
