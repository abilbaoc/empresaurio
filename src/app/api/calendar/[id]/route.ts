import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CalendarEntryUpdate } from '@/lib/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership before updating
  const { data: existing, error: fetchError } = await supabase
    .from('content_calendar')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json() as CalendarEntryUpdate

  const updatePayload: CalendarEntryUpdate = {}
  if (body.status !== undefined) updatePayload.status = body.status
  if (body.scheduled_date !== undefined) updatePayload.scheduled_date = body.scheduled_date
  if (body.title !== undefined) updatePayload.title = body.title
  if (body.platform !== undefined) updatePayload.platform = body.platform
  if (body.notes !== undefined) updatePayload.notes = body.notes
  if (body.script_id !== undefined) updatePayload.script_id = body.script_id

  const { data, error } = await supabase
    .from('content_calendar')
    .update(updatePayload)
    .eq('id', id)
    .select('*, script:scripts(title)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
