export type TopicStatus = 'new' | 'in_review' | 'approved' | 'scripted' | 'archived'
export type ScriptStatus = 'draft' | 'ready' | 'produced' | 'archived'

export interface ViralTopic {
  id: string
  user_id: string
  title: string
  source: string | null
  source_url: string | null
  category: string | null
  virality_score: number
  status: TopicStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type ViralTopicInsert = Omit<ViralTopic, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type ViralTopicUpdate = Partial<ViralTopicInsert>

export interface Script {
  id: string
  user_id: string
  topic_id: string | null
  title: string
  content: string
  version: number
  status: ScriptStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ScriptVersion {
  id: string
  script_id: string
  version: number
  content: string
  created_at: string
}

export type ScriptInsert = Omit<Script, 'id' | 'user_id' | 'version' | 'created_at' | 'updated_at'>

export type CalendarStatus = 'draft' | 'scheduled' | 'published' | 'archived'
export type Platform = 'tiktok' | 'youtube' | 'instagram'

export interface CalendarEntry {
  id: string
  user_id: string
  title: string
  script_id: string | null
  scheduled_date: string | null  // ISO date string
  platform: Platform | null
  status: CalendarStatus
  notes: string | null
  created_at: string
  updated_at: string
  script?: { title: string } | null  // joined
}

export type CalendarEntryInsert = Omit<CalendarEntry, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'script'>
export type CalendarEntryUpdate = Partial<CalendarEntryInsert>
