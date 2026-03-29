'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ViralTopicInsert, ViralTopicUpdate } from '@/lib/types'

export async function createTopic(data: ViralTopicInsert) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('viral_topics')
    .insert({ ...data, user_id: user.id })

  if (error) throw new Error(error.message)
  revalidatePath('/viral-tracker')
}

export async function updateTopic(id: string, data: ViralTopicUpdate) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('viral_topics')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/viral-tracker')
}

export async function deleteTopic(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('viral_topics')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/viral-tracker')
}

export async function updateTopicStatus(id: string, status: ViralTopicInsert['status']) {
  return updateTopic(id, { status })
}
