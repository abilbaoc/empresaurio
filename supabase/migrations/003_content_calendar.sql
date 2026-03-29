-- Content Calendar table for scheduling and tracking video content
create table if not exists content_calendar (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  title          text not null,
  script_id      uuid references scripts(id) on delete set null,
  scheduled_date date,
  platform       text check (platform in ('tiktok', 'youtube', 'instagram')),
  status         text not null default 'draft'
                 check (status in ('draft', 'scheduled', 'published', 'archived')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Auto-update updated_at
create trigger content_calendar_updated_at
  before update on content_calendar
  for each row execute function update_updated_at();

-- RLS
alter table content_calendar enable row level security;

create policy "Users manage their own calendar entries"
  on content_calendar for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes for common queries
create index content_calendar_user_status on content_calendar (user_id, status);
create index content_calendar_user_date on content_calendar (user_id, scheduled_date);
