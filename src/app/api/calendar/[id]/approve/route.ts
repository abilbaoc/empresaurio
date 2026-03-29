import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ContentApprovalAction } from '@/lib/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json() as ContentApprovalAction

  if (!body.action || !['approve', 'reject', 'reset'].includes(body.action)) {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  if (body.action === 'reject' && !body.feedback?.trim()) {
    return NextResponse.json({ error: 'El feedback es obligatorio al rechazar' }, { status: 400 })
  }

  const statusMap: Record<ContentApprovalAction['action'], string> = {
    approve: 'approved',
    reject: 'ready',
    reset: 'draft',
  }

  const { data, error } = await supabase
    .from('content_calendar')
    .update({
      status: statusMap[body.action],
      approval_feedback: body.action === 'reject' ? (body.feedback ?? null) : null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, script:scripts(title)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })
  }

  return NextResponse.json(data)
}
