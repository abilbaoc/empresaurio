-- Scripts table for storing generated video scripts
create table if not exists scripts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  topic_id    uuid references viral_topics(id) on delete set null,
  title       text not null,
  content     text not null,
  version     integer not null default 1,
  status      text not null default 'draft'
              check (status in ('draft', 'ready', 'produced', 'archived')),
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Script versions (history)
create table if not exists script_versions (
  id          uuid primary key default gen_random_uuid(),
  script_id   uuid references scripts(id) on delete cascade not null,
  version     integer not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- Auto-update updated_at
create trigger scripts_updated_at
  before update on scripts
  for each row execute function update_updated_at();

-- RLS
alter table scripts enable row level security;
alter table script_versions enable row level security;

create policy "Users manage their own scripts"
  on scripts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can see versions of their own scripts"
  on script_versions for all
  using (
    exists (
      select 1 from scripts s
      where s.id = script_id and s.user_id = auth.uid()
    )
  );

-- Indexes
create index scripts_user_status on scripts (user_id, status);
create index scripts_topic on scripts (topic_id);
create index script_versions_script on script_versions (script_id, version desc);
