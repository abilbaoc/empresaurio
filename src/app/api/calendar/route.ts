import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CalendarEntryInsert } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json() as CalendarEntryInsert

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('content_calendar')
    .insert({
      user_id: user.id,
      title: body.title.trim(),
      script_id: body.script_id ?? null,
      scheduled_date: body.scheduled_date ?? null,
      platform: body.platform ?? null,
      status: body.status ?? 'draft',
      notes: body.notes ?? null,
    })
    .select('*, script:scripts(title)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
