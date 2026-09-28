-- Helper: is the current user an admin?
-- Reads app_metadata from the JWT, which users cannot edit themselves
-- (unlike user_metadata), so it's safe to base permissions on.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Keeps updated_at fresh on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.sections (
  id           uuid primary key default gen_random_uuid(),
  type         text not null unique,   -- 'hero', 'program', 'location', ...
  heading      text,
  subheading   text,
  body         text,
  excerpt      text,                   -- nullable, only some sections use it
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger sections_set_updated_at
  before update on public.sections
  for each row execute function public.set_updated_at();

-- RLS: nothing is readable or writable until a policy allows it
alter table public.sections enable row level security;

-- Anyone can read published sections; admins can also see drafts
create policy "Public can read published sections"
  on public.sections for select
  to anon, authenticated
  using (is_published or public.is_admin());

-- Only admins can write
create policy "Admins can insert sections"
  on public.sections for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update sections"
  on public.sections for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete sections"
  on public.sections for delete
  to authenticated
  using (public.is_admin());