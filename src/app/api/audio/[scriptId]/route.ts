import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { scriptId } = await params

  // Fetch audio_files row for this script belonging to the authenticated user
  const { data: audioFile, error } = await supabase
    .from('audio_files')
    .select('*')
    .eq('script_id', scriptId)
    .eq('user_id', user.id)
    .single()

  if (error || !audioFile) {
    return NextResponse.json({ error: 'Audio no encontrado' }, { status: 404 })
  }

  // Create signed URL valid for 1 hour
  const { data: signedData, error: signedError } = await supabase.storage
    .from('audio')
    .createSignedUrl(audioFile.storage_path, 3600)

  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json(
      { error: `Error generando URL firmada: ${signedError?.message ?? 'desconocido'}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ url: signedData.signedUrl, audioFile }, { status: 200 })
}
