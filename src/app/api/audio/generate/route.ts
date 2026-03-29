import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID

  if (!apiKey || !voiceId) {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY y ELEVENLABS_VOICE_ID son obligatorios. Configura las variables de entorno.' },
      { status: 500 }
    )
  }

  let body: { script_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido' }, { status: 400 })
  }

  const { script_id } = body

  if (!script_id) {
    return NextResponse.json({ error: 'script_id es obligatorio' }, { status: 400 })
  }

  // Fetch script — ensure it belongs to the authenticated user
  const { data: script, error: scriptError } = await supabase
    .from('scripts')
    .select('id, content, user_id')
    .eq('id', script_id)
    .eq('user_id', user.id)
    .single()

  if (scriptError || !script) {
    return NextResponse.json({ error: 'Guion no encontrado' }, { status: 404 })
  }

  // Call ElevenLabs TTS API
  const elevenLabsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: script.content,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  )

  if (!elevenLabsRes.ok) {
    let errorDetail = elevenLabsRes.statusText
    try {
      const errBody = await elevenLabsRes.json()
      errorDetail = errBody?.detail?.message ?? errBody?.detail ?? errorDetail
    } catch {
      // ignore parse errors
    }
    return NextResponse.json(
      { error: `Error en ElevenLabs: ${errorDetail}` },
      { status: 502 }
    )
  }

  const audioBuffer = await elevenLabsRes.arrayBuffer()

  // Upload to Supabase Storage bucket "audio"
  const storagePath = `${user.id}/${script_id}/${Date.now()}.mp3`

  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(storagePath, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: `Error al subir el audio: ${uploadError.message}` },
      { status: 502 }
    )
  }

  // Upsert into audio_files (one record per script, replace on regeneration)
  const { data: audioFile, error: dbError } = await supabase
    .from('audio_files')
    .upsert(
      {
        user_id: user.id,
        script_id,
        storage_path: storagePath,
        status: 'ready',
        error_msg: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'script_id' }
    )
    .select()
    .single()

  if (dbError) {
    return NextResponse.json(
      { error: `Error guardando registro de audio: ${dbError.message}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ audioFile }, { status: 200 })
}
