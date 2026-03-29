import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `Eres un guionista experto en contenido tech para redes sociales (TikTok, IG Reels, YouTube Shorts) en español para la cuenta "El Empresaurio".

El estilo de El Empresaurio:
- Audiencia: profesionales tech, emprendedores, y personas curiosas sobre tecnología y negocios
- Tono: directo, analítico, sin hype vacío — "qué significa esto para el negocio"
- Formato: hook potente (3-5s), contexto rápido, insight clave, call-to-action
- Duración objetivo: 60-90 segundos de locución (aprox 150-225 palabras habladas)
- Evita: tecnicismos sin explicar, frases vacías, clickbait sin sustancia

Estructura del guion:
1. **HOOK** (1-2 frases impactantes — el problema o dato sorprendente)
2. **CONTEXTO** (qué está pasando, por qué importa)
3. **INSIGHT** (el ángulo de negocio/estrategia que otros no ven)
4. **CIERRE** (takeaway + CTA: "sígueme para más")

Devuelve SOLO el guion listo para grabar, sin metadatos ni explicaciones adicionales.`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { topic, style, duration, notes } = body as {
    topic: string
    style?: string
    duration?: string
    notes?: string
  }

  if (!topic?.trim()) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 503 }
    )
  }

  const client = new Anthropic({ apiKey })

  const userPrompt = [
    `Topic: ${topic}`,
    style ? `Estilo adicional: ${style}` : null,
    duration ? `Duración objetivo: ${duration}` : null,
    notes ? `Notas extra: ${notes}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  // Streaming response
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
    cancel() {
      stream.controller.abort()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
