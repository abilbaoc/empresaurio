import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PreviewApprovalBar } from '@/components/calendar/PreviewApprovalBar'
import type { CalendarEntry, Script, AudioFile } from '@/lib/types'

export default async function ContentPreviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: entry, error } = await supabase
    .from('content_calendar')
    .select('*, script:scripts(*)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (error || !entry) notFound()

  const calendarEntry = entry as CalendarEntry & { script?: Script | null }

  // Fetch audio file if a script is linked
  let audio: AudioFile | null = null
  if (calendarEntry.script_id) {
    const { data: audioData } = await supabase
      .from('audio_files')
      .select('*')
      .eq('script_id', calendarEntry.script_id)
      .eq('user_id', user!.id)
      .maybeSingle()
    audio = audioData ?? null
  }

  const script = calendarEntry.script as Script | null

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{calendarEntry.title}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Vista previa &amp; aprobación
          </p>
        </div>
      </div>

      {/* Approval bar */}
      <PreviewApprovalBar entry={calendarEntry} scriptId={calendarEntry.script_id} />

      {/* Main preview grid: script | audio | video mock */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: script text */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Guion
            </h2>
            {script?.content ? (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-foreground">
                {script.content}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Sin guion vinculado. Edita esta entrada del calendario para asociar un guion.
              </p>
            )}
          </div>

          {calendarEntry.notes && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Notas
              </h2>
              <p className="text-sm text-foreground">{calendarEntry.notes}</p>
            </div>
          )}

          {calendarEntry.approval_feedback && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-500 mb-2">
                Feedback anterior
              </h2>
              <p className="text-sm text-foreground">{calendarEntry.approval_feedback}</p>
            </div>
          )}
        </div>

        {/* Right: audio + video preview */}
        <div className="space-y-4">
          {/* Audio player */}
          {calendarEntry.script_id && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Audio
              </h2>
              <AudioPreview scriptId={calendarEntry.script_id} audio={audio} />
            </div>
          )}

          {/* Video preview mockup */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Preview de video
              </h2>
            </div>
            <VideoPreviewMockup
              title={calendarEntry.title}
              platform={calendarEntry.platform}
              scriptSnippet={script?.content?.slice(0, 120) ?? null}
            />
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Metadatos
            </h2>
            <MetaRow label="Plataforma" value={calendarEntry.platform ?? '—'} />
            <MetaRow
              label="Fecha programada"
              value={
                calendarEntry.scheduled_date
                  ? new Date(calendarEntry.scheduled_date + 'T00:00:00').toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : '—'
              }
            />
            <MetaRow label="Guion" value={script?.title ?? '—'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  )
}

function AudioPreview({ scriptId, audio }: { scriptId: string; audio: AudioFile | null }) {
  // Client interaction is handled in PreviewApprovalBar; here we show a static indicator
  if (!audio || audio.status !== 'ready') {
    return (
      <p className="text-xs text-muted-foreground">
        Audio no disponible. Genera el audio desde el editor de guion.
      </p>
    )
  }
  return (
    <p className="text-xs text-muted-foreground">
      Audio listo — reproduce desde el editor de guion o aprueba el contenido para publicar.
    </p>
  )
}

function VideoPreviewMockup({
  title,
  platform,
  scriptSnippet,
}: {
  title: string
  platform: string | null
  scriptSnippet: string | null
}) {
  const isVertical = platform === 'tiktok' || platform === 'instagram'
  const aspectClass = isVertical ? 'aspect-[9/16]' : 'aspect-video'

  return (
    <div className={`${aspectClass} w-full bg-black relative flex flex-col items-center justify-center overflow-hidden max-h-[480px]`}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      {/* Platform indicator */}
      {platform && (
        <div className="absolute top-3 right-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">
          {platform}
        </div>
      )}

      {/* Script text overlay */}
      <div className="relative z-10 px-6 text-center space-y-3">
        <div className="text-white/30 text-[10px] uppercase tracking-widest">Vista previa</div>
        {scriptSnippet ? (
          <p className="text-white text-sm leading-relaxed line-clamp-4 font-medium drop-shadow-md">
            {scriptSnippet}
            {scriptSnippet.length === 120 && '…'}
          </p>
        ) : (
          <p className="text-white/50 text-xs italic">Sin texto de guion</p>
        )}
      </div>

      {/* Title bar at bottom */}
      <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-xs font-semibold line-clamp-1">{title}</p>
      </div>
    </div>
  )
}
