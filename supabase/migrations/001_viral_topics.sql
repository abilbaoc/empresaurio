-- Viral Topics table for tracking trending tech content topics
create table if not exists viral_topics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  source      text,
  source_url  text,
  category    text,
  virality_score integer not null default 0 check (virality_score between 0 and 100),
  status      text not null default 'new'
              check (status in ('new', 'in_review', 'approved', 'scripted', 'archived')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger viral_topics_updated_at
  before update on viral_topics
  for each row execute function update_updated_at();

-- Row-Level Security
alter table viral_topics enable row level security;

create policy "Users manage their own topics"
  on viral_topics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for common queries
create index viral_topics_user_status on viral_topics (user_id, status);
create index viral_topics_virality on viral_topics (user_id, virality_score desc);
