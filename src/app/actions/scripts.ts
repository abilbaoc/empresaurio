'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ScriptInsert, ScriptStatus } from '@/lib/types'

export async function saveScript(data: ScriptInsert & { id?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (data.id) {
    // Update existing script: save current version, bump version number
    const { data: existing } = await supabase
      .from('scripts')
      .select('id, content, version')
      .eq('id', data.id)
      .eq('user_id', user.id)
      .single()

    if (!existing) throw new Error('Script not found')

    // Save version snapshot
    await supabase.from('script_versions').insert({
      script_id: data.id,
      version: existing.version,
      content: existing.content,
    })

    // Update script
    const { error } = await supabase
      .from('scripts')
      .update({
        title: data.title,
        content: data.content,
        topic_id: data.topic_id,
        status: data.status,
        metadata: data.metadata,
        version: existing.version + 1,
      })
      .eq('id', data.id)
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
  } else {
    // Insert new script
    const { error } = await supabase
      .from('scripts')
      .insert({ ...data, user_id: user.id })

    if (error) throw new Error(error.message)
  }

  revalidatePath('/script-generator')
}

export async function deleteScript(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('scripts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/script-generator')
}

export async function updateScriptStatus(id: string, status: ScriptStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('scripts')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/script-generator')
}
