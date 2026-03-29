'use client'

import { useState } from 'react'
import { Volume2, RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AudioFile } from '@/lib/types'

interface AudioPlayerProps {
  scriptId: string
  initialAudio?: AudioFile | null
}

type AudioState = 'idle' | 'loading' | 'ready' | 'error'

export function AudioPlayer({ scriptId, initialAudio }: AudioPlayerProps) {
  const [audioState, setAudioState] = useState<AudioState>(
    initialAudio?.status === 'ready' ? 'ready' : 'idle'
  )
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function fetchSignedUrl(forScriptId: string) {
    const res = await fetch(`/api/audio/${forScriptId}`)
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Error obteniendo URL de audio')
    }
    const data = await res.json()
    return data.url as string
  }

  async function handleGenerate() {
    setAudioState('loading')
    setErrorMsg(null)
    setSignedUrl(null)

    try {
      // Generate audio via ElevenLabs
      const generateRes = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: scriptId }),
      })

      if (!generateRes.ok) {
        const err = await generateRes.json()
        throw new Error(err.error ?? 'Error generando el audio')
      }

      // Fetch signed URL for playback
      const url = await fetchSignedUrl(scriptId)
      setSignedUrl(url)
      setAudioState('ready')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setAudioState('error')
    }
  }

  // Load signed URL on first render when initialAudio is already ready
  async function handleLoadExisting() {
    setAudioState('loading')
    setErrorMsg(null)
    try {
      const url = await fetchSignedUrl(scriptId)
      setSignedUrl(url)
      setAudioState('ready')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setAudioState('error')
    }
  }

  if (audioState === 'idle') {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={initialAudio?.status === 'ready' ? handleLoadExisting : handleGenerate}
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Generar audio
        </Button>
      </div>
    )
  }

  if (audioState === 'loading') {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Generando...</span>
      </div>
    )
  }

  if (audioState === 'error') {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMsg ?? 'Error generando el audio'}</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    )
  }

  // ready state
  return (
    <div className="space-y-2">
      {signedUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls src={signedUrl} className="w-full" />
      )}
      <Button variant="ghost" size="sm" onClick={handleGenerate} className="text-muted-foreground">
        <RotateCcw className="h-4 w-4 mr-2" />
        Regenerar
      </Button>
    </div>
  )
}
