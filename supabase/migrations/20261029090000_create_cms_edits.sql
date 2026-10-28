-- History of inline homepage edits, so the admin can undo recent saves.
-- One row per save: only the columns that actually changed, before and after.
create table public.cms_edits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  table_name  text not null check (table_name in ('sections', 'people', 'stat_items')),
  row_id      uuid not null,             -- no FK: it can point at any of the three tables
  label       text not null default '',  -- human name of the edited box, e.g. 'Keynote: Michael Clemmens'
  before      jsonb not null,
  after       jsonb not null,
  created_at  timestamptz not null default now(),
  reverted_at timestamptz                -- set when the edit is undone
);

-- The editor only ever asks for "my latest edits"
create index cms_edits_user_created_idx on public.cms_edits (user_id, created_at desc);

alter table public.cms_edits enable row level security;

-- Admin-only, and no delete policy - history is append-only apart from marking undos
create policy "Admins can read cms edits"
  on public.cms_edits for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert cms edits"
  on public.cms_edits for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update cms edits"
  on public.cms_edits for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());