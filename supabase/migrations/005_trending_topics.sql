-- Trending topics table: auto-fetched from RSS feeds, HN, ProductHunt
create table if not exists trending_topics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  url         text,
  source      text not null,
  score       integer not null default 50 check (score between 0 and 100),
  fetched_at  timestamptz not null default now(),
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table trending_topics enable row level security;

create policy "Users can view own trending topics"
  on trending_topics for select using (auth.uid() = user_id);

create policy "Users can insert own trending topics"
  on trending_topics for insert with check (auth.uid() = user_id);

create policy "Users can update own trending topics"
  on trending_topics for update using (auth.uid() = user_id);

create policy "Users can delete own trending topics"
  on trending_topics for delete using (auth.uid() = user_id);

create index if not exists trending_topics_user_fetched
  on trending_topics (user_id, fetched_at desc);

create index if not exists trending_topics_user_score
  on trending_topics (user_id, score desc);

create unique index if not exists trending_topics_user_title_source
  on trending_topics (user_id, title, source);
