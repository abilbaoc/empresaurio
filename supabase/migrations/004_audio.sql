-- Audio files table for ElevenLabs TTS generated audio
create table if not exists audio_files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  script_id    uuid references scripts(id) on delete cascade not null,
  storage_path text not null,
  status       text not null default 'ready'
               check (status in ('pending', 'generating', 'ready', 'error')),
  error_msg    text,
  duration_s   numeric(8,2),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint audio_files_script_id_unique unique (script_id)
);

create trigger audio_files_updated_at
  before update on audio_files
  for each row execute function update_updated_at();

alter table audio_files enable row level security;

create policy "Users manage their own audio files"
  on audio_files for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index audio_files_script on audio_files (script_id);
create index audio_files_user on audio_files (user_id);
